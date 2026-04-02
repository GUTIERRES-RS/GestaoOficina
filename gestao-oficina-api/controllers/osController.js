const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

/**
 * Controller de Ordens de Serviço (OS)
 * Centraliza toda a lógica de negócio para abertura, manutenção, 
 * fechamento de OS, controle de peças e integração financeira.
 */
const osController = {

    /**
     * Listar todas as Ordens de Serviço com filtros opcionais de data.
     * Inclui joins com Clientes e Veículos para exibição completa no Dashboard/Tabela.
     * @param {Object} req - Query params: start_date, end_date (YYYY-MM-DD).
     */
    getAll: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            let query = `
                SELECT so.*, c.name as client_name, c.document as client_document, c.phone as client_phone, 
                       v.plate, v.brand, v.model as vehicle_model, v.km_cad as km 
                FROM service_orders so
                JOIN clients c ON so.client_id = c.id
                JOIN vehicles v ON so.vehicle_id = v.id
            `;

            const queryParams = [];
            const conditions = [];

            if (start_date) {
                conditions.push("so.created_at >= ?");
                queryParams.push(`${start_date} 00:00:00`);
            }

            if (end_date) {
                conditions.push("so.created_at <= ?");
                queryParams.push(`${end_date} 23:59:59`);
            }

            if (conditions.length > 0) {
                query += " WHERE " + conditions.join(" AND ");
            }

            query += " ORDER BY so.created_at DESC";

            const [rows] = await db.query(query, queryParams);
            res.json(rows);
        } catch (error) {
            logger.error(`[OS:LIST] Erro ao buscar lista de OS: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar Ordens de Serviço' });
        }
    },

    /**
     * Buscar uma OS detalhada pelo seu Identificador Único (UUID).
     * @param {Object} req - Param :id (UUID).
     */
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT so.*, c.name as client_name, c.phone as client_phone, 
                       v.plate, v.brand, v.model, v.km_cad as km,
                       t.payment_date, t.payment_method, t.status as transaction_status
                FROM service_orders so
                JOIN clients c ON so.client_id = c.id
                JOIN vehicles v ON so.vehicle_id = v.id
                LEFT JOIN transactions t ON so.id = t.os_id AND t.type = 'income'
                WHERE so.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Ordem de Serviço não encontrada' });
            }

            res.json(rows[0]);
        } catch (error) {
            logger.error(`[OS:GET] Erro ao buscar OS por ID (${req.params.id}): ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar dados da OS' });
        }
    },

    /**
     * Listar histórico de Ordens de Serviço vinculadas a um veículo específico.
     * @param {Object} req - Param :vehicleId (UUID).
     */
    getByVehicle: async (req, res) => {
        try {
            const { vehicleId } = req.params;
            const query = `
                SELECT so.*, c.name as client_name, v.plate, v.brand, v.model as vehicle_model, v.km_cad as km 
                FROM service_orders so
                JOIN clients c ON so.client_id = c.id
                JOIN vehicles v ON so.vehicle_id = v.id
                WHERE so.vehicle_id = ?
                ORDER BY so.created_at DESC
            `;
            const [rows] = await db.query(query, [vehicleId]);
            res.json(rows);
        } catch (error) {
            logger.error(`[OS:VEHICLE] Erro ao buscar histórico do veículo (${req.params.vehicleId}): ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar histórico de OS do veículo' });
        }
    },

    /**
     * Criar uma nova Ordem de Serviço com Fluxo Transacional Completo.
     * Passos: Valida Estoque -> Insere OS -> Vincula Peças -> Baixa Estoque -> Lança Financeiro (se Entregue).
     */
    create: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            const osId = uuidv4();
            const {
                client_id, vehicle_id, mechanic_id, mechanic_name,
                problem_reported, service_provided, status, expected_delivery_date,
                labor_cost, parts_cost, total_cost,
                discount, invoice_number, vehicle_km,
                payment_date,
                parts 
            } = req.body;

            // 1. Validação de Disponibilidade de Estoque (Pré-venda)
            if (parts && parts.length > 0) {
                for (const p of parts) {
                    const [[inv]] = await connection.query('SELECT stock_quantity, name FROM inventory WHERE id = ?', [p.part_id]);
                    if (!inv || inv.stock_quantity < p.quantity) {
                        await connection.rollback();
                        return res.status(400).json({ 
                            success: false,
                            message: `Estoque insuficiente: ${inv?.name || 'Item desconhecido'}. Disponível: ${inv?.stock_quantity || 0}` 
                        });
                    }
                }
            }

            // 2. Persistência da OS Principal
            await connection.query(
                `INSERT INTO service_orders (
                    id, client_id, vehicle_id, mechanic_id, mechanic_name, 
                    problem_reported, service_provided, status, 
                    labor_cost, parts_cost, total_cost, 
                    expected_delivery_date, discount, invoice_number, vehicle_km
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    osId, client_id, vehicle_id, mechanic_id || null, mechanic_name ? mechanic_name.trim() : null,
                    problem_reported.trim(), service_provided ? service_provided.trim() : null,
                    status || 'Aberto', Number(labor_cost) || 0, Number(parts_cost) || 0, Number(total_cost) || 0,
                    expected_delivery_date || null, Number(discount) || 0,
                    invoice_number ? invoice_number.trim() : null, vehicle_km ? parseInt(vehicle_km, 10) : null
                ]
            );

            // 3. Processamento de Peças e Movimentação Sincronizada
            if (parts && parts.length > 0) {
                for (const p of parts) {
                    const ospId = uuidv4();
                    const total_price = Number(p.quantity) * Number(p.unit_price);
                    
                    // Vínculo OS <-> Peça
                    await connection.query(
                        'INSERT INTO os_parts (id, os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                        [ospId, osId, p.part_id, p.quantity, p.unit_price, total_price]
                    );

                    // Baixa real no estoque
                    await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [p.quantity, p.part_id]);
                    
                    // Registro de Auditoria de Inventário
                    await connection.query(
                        'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                        [uuidv4(), p.part_id, 'saida', p.quantity, `Venda via OS: #${osId.substring(0,8).toUpperCase()}`]
                    );
                }
            }

            // 4. Integração Financeira Automática (Apenas se finalizado na abertura)
            if (status === 'Entregue') {
                const valorTotal = Number(total_cost) || 0;
                if (valorTotal > 0) {
                    await connection.query(
                        "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id) VALUES (?, 'income', 'Serviço/OS', ?, ?, 'pendente', ?, ?)",
                        [uuidv4(), valorTotal, `OS #${osId.substring(0,8).toUpperCase()} - Entregue`, payment_date || new Date().toISOString().split('T')[0], osId]
                    );
                }
            }

            await connection.commit();
            logger.info(`[OS:CREATE] OS Gerada: ${osId} | Cliente: ${client_id}`);
            res.status(201).json({ success: true, id: osId, message: 'Ordem de Serviço registrada com sucesso!' });

        } catch (error) {
            await connection.rollback();
            logger.error(`[OS:CREATE] Falha ao criar OS: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro interno ao processar criação da OS' });
        } finally {
            connection.release();
        }
    },

    /**
     * Atualizar dados, status e sincronizar estoque de uma OS existente.
     * Fluxo COMPLEXO: Calcula a diferença (diff) de peças para ajustar o estoque (entrada/saída).
     */
    update: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const {
                status, problem_reported, service_provided, labor_cost, parts_cost, total_cost,
                mechanic_id, mechanic_name, expected_delivery_date,
                discount, invoice_number, vehicle_km,
                payment_method, payment_status, payment_date,
                parts 
            } = req.body;

            // 1. Verificação de existência
            const [[currentOS]] = await connection.query('SELECT status, total_cost FROM service_orders WHERE id = ?', [id]);
            if (!currentOS) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Ordem de Serviço não localizada' });
            }

            // 2. Sincronização Inteligente de Estoque (se houver alteração no array de peças)
            if (parts) {
                const [existingParts] = await connection.query('SELECT part_id, quantity FROM os_parts WHERE os_id = ?', [id]);
                
                // Trata Novas/Ajustadas
                for (const newPart of parts) {
                    const existing = existingParts.find(p => p.part_id === newPart.part_id);
                    const diff = existing ? (Number(newPart.quantity) - Number(existing.quantity)) : Number(newPart.quantity);

                    if (diff > 0) {
                        const [[inv]] = await connection.query('SELECT stock_quantity, name FROM inventory WHERE id = ?', [newPart.part_id]);
                        if (!inv || inv.stock_quantity < diff) {
                            await connection.rollback();
                            return res.status(400).json({ 
                                success: false,
                                message: `Estoque insuficiente para ajuste: ${inv?.name || 'Item'}. Falta: ${diff - (inv?.stock_quantity || 0)}` 
                            });
                        }
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [diff, newPart.part_id]);
                        
                        // Registro de Movimentação (Saída adicional)
                        await connection.query(
                            'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), newPart.part_id, 'saida', diff, `Ajuste de quantidade (acréscimo) na OS: ${id.substring(0,8)}`]
                        );
                    } else if (diff < 0) {
                        const refundQty = Math.abs(diff);
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [refundQty, newPart.part_id]);
                        
                        // Registro de Movimentação (Entrada p/ estorno)
                        await connection.query(
                            'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), newPart.part_id, 'entrada', refundQty, `Ajuste de quantidade (redução) na OS: ${id.substring(0,8)}`]
                        );
                    }
                }

                // Trata Peças Removidas completamente
                for (const oldPart of existingParts) {
                    const stillExists = parts.find(p => p.part_id === oldPart.part_id);
                    if (!stillExists) {
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [oldPart.quantity, oldPart.part_id]);
                        
                        // Registro de Movimentação (Entrada p/ estorno total)
                        await connection.query(
                            'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), oldPart.part_id, 'entrada', oldPart.quantity, `Item removido da OS: ${id.substring(0,8)}`]
                        );
                    }
                }

                // Reinserção do Mapa de Peças
                await connection.query('DELETE FROM os_parts WHERE os_id = ?', [id]);
                for (const p of parts) {
                    const total_price = Number(p.quantity) * Number(p.unit_price);
                    await connection.query(
                        'INSERT INTO os_parts (id, os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                        [uuidv4(), id, p.part_id, p.quantity, p.unit_price, total_price]
                    );
                }
            }

            // 3. Atualização dos Dados de Cabeçalho (Status e Valores)
            await connection.query(
                `UPDATE service_orders SET 
                 status = ?, problem_reported = ?, service_provided = ?, labor_cost = ?, parts_cost = ?, total_cost = ?, 
                 mechanic_id = ?, mechanic_name = ?, expected_delivery_date = ?, 
                 discount = ?, invoice_number = ?, vehicle_km = ?
                 WHERE id = ?`,
                [
                    status, problem_reported?.trim() || null, service_provided?.trim() || null, 
                    Number(labor_cost) || 0, Number(parts_cost) || 0, Number(total_cost) || 0,
                    mechanic_id || null, mechanic_name?.trim() || null, expected_delivery_date || null,
                    Number(discount) || 0, invoice_number?.trim() || null,
                    vehicle_km ? parseInt(vehicle_km, 10) : null,
                    id
                ]
            );

            // 4. Auditoria de Lançamentos Financeiros (Fluxo Dinâmico)
            const valorTotal = Number(total_cost) || 0;
            const isEntregue = status === 'Entregue';
            const wasEntregue = currentOS.status === 'Entregue';

            if (isEntregue) {
                // Sincroniza Receita
                const [[inc]] = await connection.query("SELECT id FROM transactions WHERE os_id = ? AND type = 'income'", [id]);
                if (inc) {
                    await connection.query(
                        "UPDATE transactions SET amount = ?, payment_method = ?, status = ?, payment_date = ? WHERE id = ?",
                        [valorTotal, payment_method || null, payment_status === 'pago' ? 'pago' : 'pendente', payment_date || new Date().toISOString().split('T')[0], inc.id]
                    );
                } else if (valorTotal > 0) {
                    await connection.query(
                        "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id, payment_method) VALUES (?, 'income', 'Serviço/OS', ?, ?, ?, ?, ?, ?)",
                        [uuidv4(), valorTotal, `OS #${id.substring(0,8)} - Entregue`, payment_status === 'pago' ? 'pago' : 'pendente', payment_date || new Date().toISOString().split('T')[0], id, payment_method || null]
                    );
                }
            } else if (wasEntregue) {
                // Se saiu do status Entregue, remove lançamentos financeiros vinculados para evitar duplicidade ou erro contábil
                await connection.query("DELETE FROM transactions WHERE os_id = ?", [id]);
            }

            await connection.commit();
            logger.info(`[OS:UPDATE] OS ${id} atualizada com sucesso. Status: ${status}`);
            res.json({ success: true, message: 'Ordem de Serviço atualizada com sucesso!' });

        } catch (error) {
            await connection.rollback();
            logger.error(`[OS:UPDATE] Erro na atualização da OS ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar atualização da OS' });
        } finally {
            connection.release();
        }
    },

    /**
     * Listar todas as peças e materiais vinculados a uma OS.
     */
    getParts: async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
                SELECT op.*, i.name as part_name, i.code as part_code
                FROM os_parts op
                JOIN inventory i ON op.part_id = i.id
                WHERE op.os_id = ?
            `;
            const [rows] = await db.query(query, [id]);
            res.json(rows);
        } catch (error) {
            logger.error(`[OS:PARTS] Erro ao buscar peças: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar listagem de peças' });
        }
    },

    /**
     * Adicionar uma nova peça a uma OS existente e atualizar custos.
     */
    addPart: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { part_id, quantity, unit_price } = req.body;

            const totalItem = Number(quantity) * Number(unit_price);

            // Inserção do item
            await connection.query(
                'INSERT INTO os_parts (id, os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                [uuidv4(), id, part_id, quantity, unit_price, totalItem]
            );

            // Baixa no estoque
            const [inv] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [part_id]);
            if (!inv[0] || inv[0].stock_quantity < quantity) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Estoque insuficiente no inventário' });
            }

            await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, part_id]);

            // Recálculo de Totais da OS
            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;
            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotal = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query(
                'UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?',
                [partsCost, newTotal, id]
            );

            await connection.commit();
            res.status(201).json({ success: true, message: 'Peça adicionada!', parts_cost: partsCost, total_cost: newTotal });
        } catch (error) {
            await connection.rollback();
            logger.error(`[OS:ADD_PART] Erro: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao adicionar peça' });
        } finally {
            connection.release();
        }
    },

    /**
     * Atualizar quantidade de um item de peça já existente na OS.
     */
    updatePartQuantity: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id, partId } = req.params;
            const { quantity } = req.body;

            const [[osPart]] = await connection.query('SELECT part_id, quantity, unit_price FROM os_parts WHERE id = ? AND os_id = ?', [partId, id]);
            if (!osPart) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Item não localizado na OS' });
            }

            const diff = Number(quantity) - Number(osPart.quantity);

            // Validação de estoque para acréscimo
            if (diff > 0) {
                const [[inv]] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [osPart.part_id]);
                if (inv.stock_quantity < diff) {
                    await connection.rollback();
                    return res.status(400).json({ success: false, message: 'Estoque insuficiente para este aumento' });
                }
            }

            await connection.query('UPDATE os_parts SET quantity = ?, total_price = ? WHERE id = ?', [quantity, quantity * osPart.unit_price, partId]);
            await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [diff, osPart.part_id]);

            // Atualização de custos na OS pai
            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;
            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotal = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query('UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?', [partsCost, newTotal, id]);

            await connection.commit();
            res.json({ success: true, message: 'Quantidade atualizada!', parts_cost: partsCost, total_cost: newTotal });
        } catch (error) {
            await connection.rollback();
            logger.error(`[OS:UPDATE_PART] Erro: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao atualizar quantidade' });
        } finally {
            connection.release();
        }
    },

    /**
     * Remover permanentemente uma peça de uma OS e devolver ao estoque.
     */
    removePart: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id, partId } = req.params;

            const [[osPart]] = await connection.query('SELECT part_id, quantity FROM os_parts WHERE id = ? AND os_id = ?', [partId, id]);
            if (!osPart) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Item de OS não localizado' });
            }

            await connection.query('DELETE FROM os_parts WHERE id = ?', [partId]);
            await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [osPart.quantity, osPart.part_id]);

            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;
            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotal = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query('UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?', [partsCost, newTotal, id]);

            await connection.commit();
            res.json({ success: true, message: 'Peça removida e estoque devolvido!', parts_cost: partsCost, total_cost: newTotal });
        } catch (error) {
            await connection.rollback();
            logger.error(`[OS:REMOVE_PART] Erro: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao remover peça da OS' });
        } finally {
            connection.release();
        }
    }

};

module.exports = osController;
