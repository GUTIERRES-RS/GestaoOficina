const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const osController = {
    // Obter todas as Ordens de Serviço
    getAll: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            let query = `
                SELECT so.*, c.name as client_name, c.document as client_document, v.plate, v.brand, v.model as vehicle_model, v.km_cad as km 
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

            console.log('Fetching OS with params:', queryParams);
            const [rows] = await db.query(query, queryParams);
            res.json(rows);
        } catch (error) {
            console.error('FETCH OS ERROR:', error);
            const logMsg = `\n--- FETCH OS ERROR at ${new Date().toISOString()} ---\nError: ${error.stack}\nQuery: ${query}\nParams: ${JSON.stringify(queryParams)}\n`;
            fs.appendFileSync(path.join(__dirname, '../error_log.txt'), logMsg);
            res.status(500).json({ message: 'Erro ao buscar OS', error: error.message });
        }
    },

    // Obter OS por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const query = `
        SELECT so.*, c.name as client_name, c.phone as client_phone, v.plate, v.brand, v.model, v.km_cad as km
        FROM service_orders so
        JOIN clients c ON so.client_id = c.id
        JOIN vehicles v ON so.vehicle_id = v.id
        WHERE so.id = ?
      `;
            const [rows] = await db.query(query, [id]);
            if (rows.length === 0) return res.status(404).json({ message: 'OS não encontrada' });
            res.json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar OS' });
        }
    },

    // Obter OS por Veículo
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
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar OS' });
        }
    },

    // Criar nova OS
    create: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const {
                client_id, vehicle_id, mechanic_id, mechanic_name,
                problem_reported, service_provided, status, expected_delivery_date,
                labor_cost, parts_cost, total_cost,
                discount, invoice_number, vehicle_km,
                parts // Array de peças [{part_id, quantity, unit_price}]
            } = req.body;

            if (!client_id || !vehicle_id || !problem_reported) {
                await connection.rollback();
                return res.status(400).json({ message: 'Cliente, veículo e problema relatado são obrigatórios' });
            }

            // 1. Verificar estoque se houver peças
            if (parts && parts.length > 0) {
                for (const p of parts) {
                    const [[inv]] = await connection.query('SELECT stock_quantity, name FROM inventory WHERE id = ?', [p.part_id]);
                    if (!inv || inv.stock_quantity < p.quantity) {
                        await connection.rollback();
                        return res.status(400).json({ 
                            message: `Estoque insuficiente para a peça: ${inv?.name || 'ID ' + p.part_id}. Disponível: ${inv?.stock_quantity || 0}, Necessário: ${p.quantity}` 
                        });
                    }
                }
            }

            // 2. Inserir a OS
            const [result] = await connection.query(
                'INSERT INTO service_orders (client_id, vehicle_id, mechanic_id, mechanic_name, problem_reported, service_provided, status, labor_cost, parts_cost, total_cost, expected_delivery_date, discount, invoice_number, vehicle_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    client_id, vehicle_id, mechanic_id || null, mechanic_name ? mechanic_name.trim() : null,
                    problem_reported.trim(), service_provided ? service_provided.trim() : null,
                    status || 'Aberto', labor_cost || 0, parts_cost || 0, total_cost || 0,
                    expected_delivery_date || null, Number(discount) || 0,
                    invoice_number ? invoice_number.trim() : null, vehicle_km ? parseInt(vehicle_km) : null
                ]
            );
            const osId = result.insertId;

            // 3. Inserir peças e atualizar estoque
            if (parts && parts.length > 0) {
                for (const p of parts) {
                    const total_price = p.quantity * p.unit_price;
                    await connection.query(
                        'INSERT INTO os_parts (os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                        [osId, p.part_id, p.quantity, p.unit_price, total_price]
                    );
                    await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [p.quantity, p.part_id]);
                    await connection.query(
                        'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                        [p.part_id, 'saida', p.quantity, `Saída transacional na criação da OS #${osId}`]
                    );
                }
            }

            // 4. Finanças
            const valorTotal = Number(total_cost) || 0;
            if (status === 'Entregue') {
                // Entrada (Faturamento)
                if (valorTotal > 0) {
                    await connection.query(
                        "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id, payment_method) VALUES ('income', 'Serviço/OS', ?, ?, ?, CURDATE(), ?, ?)",
                        [valorTotal, `OS #${osId} - Entregue`, 'pendente', osId, null]
                    );
                }

                // Saída (Custo das Peças)
                const [[costResult]] = await connection.query(`
                    SELECT SUM(op.quantity * i.cost_price) as total_parts_cost
                    FROM os_parts op
                    JOIN inventory i ON op.part_id = i.id
                    WHERE op.os_id = ?
                `, [osId]);
                const totalPartsCost = Number(costResult.total_parts_cost) || 0;

                if (totalPartsCost > 0) {
                    await connection.query(
                        "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id) VALUES ('expense', 'Peças/Insumos', ?, ?, 'pago', CURDATE(), ?)",
                        [totalPartsCost, `Custo de Peças - OS #${osId}`, osId]
                    );
                }

                // C. Saída (Comissão do Mecânico se houver)
                if (mechanic_id && Number(labor_cost) > 0) {
                    const [[mech]] = await connection.query('SELECT commission_rate FROM mechanics WHERE id = ?', [mechanic_id]);
                    if (mech && Number(mech.commission_rate) > 0) {
                        const commissionAmount = (Number(labor_cost) * Number(mech.commission_rate)) / 100;
                        await connection.query(
                            "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id) VALUES ('expense', 'Comissão', ?, ?, 'pendente', CURDATE(), ?)",
                            [commissionAmount, `Comissão OS #${osId} - ${mechanic_name || 'Mecânico'}`, osId]
                        );
                    }
                }
            }

            await connection.commit();
            res.status(201).json({ id: osId, message: 'OS criada com sucesso!' });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Erro ao criar OS' });
        } finally {
            connection.release();
        }
    },

    // Atualizar Status/Valores da OS
    update: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const {
                status, problem_reported, service_provided, labor_cost, parts_cost, total_cost,
                mechanic_id, mechanic_name, expected_delivery_date,
                discount, invoice_number, vehicle_km,
                payment_method, payment_status,
                parts // Array de peças [{part_id, quantity, unit_price}]
            } = req.body;

            // 1. Buscar status atual da OS
            const [[currentOS]] = await connection.query('SELECT status, total_cost FROM service_orders WHERE id = ?', [id]);
            if (!currentOS) {
                await connection.rollback();
                return res.status(404).json({ message: 'OS não encontrada' });
            }

            // 2. Se houver array de peças, sincronizar (Abordagem Transacional)
            if (parts) {
                // A. Buscar peças atuais da OS para calcular a diferença de estoque
                const [existingParts] = await connection.query('SELECT part_id, quantity FROM os_parts WHERE os_id = ?', [id]);
                
                // B/C. Sincronizar Estoque e Registrar Movimentações
                // Primeiro: Tratar peças novas e aumentos (saídas)
                for (const newPart of parts) {
                    const existing = existingParts.find(p => p.part_id === newPart.part_id);
                    const diff = existing ? (newPart.quantity - existing.quantity) : newPart.quantity;

                    if (diff > 0) {
                        // Verificar estoque
                        const [[inv]] = await connection.query('SELECT stock_quantity, name FROM inventory WHERE id = ?', [newPart.part_id]);
                        if (!inv || inv.stock_quantity < diff) {
                            await connection.rollback();
                            return res.status(400).json({ 
                                message: `Estoque insuficiente para a peça: ${inv?.name || 'ID ' + newPart.part_id}. Disponível: ${inv?.stock_quantity || 0}, Necessário adicional: ${diff}` 
                            });
                        }

                        // Deduzir estoque
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [diff, newPart.part_id]);
                        
                        // Registrar saída
                        await connection.query(
                            'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                            [newPart.part_id, 'saida', diff, existing ? `Ajuste (aumento) na OS #${id}` : `Adição na OS #${id}`]
                        );
                    } else if (diff < 0) {
                        // Devolver estoque (diminuição de quantidade)
                        const refundQty = Math.abs(diff);
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [refundQty, newPart.part_id]);
                        
                        // Registrar entrada
                        await connection.query(
                            'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                            [newPart.part_id, 'entrada', refundQty, `Ajuste (redução) na OS #${id}`]
                        );
                    }
                }

                // Terceiro: Tratar peças removidas completamente
                for (const oldPart of existingParts) {
                    const stillExists = parts.find(p => p.part_id === oldPart.part_id);
                    if (!stillExists) {
                        // Devolver todo o estoque
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [oldPart.quantity, oldPart.part_id]);
                        
                        // Registrar entrada (devolução)
                        await connection.query(
                            'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                            [oldPart.part_id, 'entrada', oldPart.quantity, `Remoção/Devolução da OS #${id}`]
                        );
                    }
                }

                // D. Limpar e Reinserir peças da OS
                await connection.query('DELETE FROM os_parts WHERE os_id = ?', [id]);
                for (const p of parts) {
                    const total_price = Number(p.quantity) * Number(p.unit_price);
                    await connection.query(
                        'INSERT INTO os_parts (os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                        [id, p.part_id, p.quantity, p.unit_price, total_price]
                    );
                }
            }

            // 3. Atualizar dados principais da OS
            const [result] = await connection.query(
                `UPDATE service_orders SET 
                 status = ?, problem_reported = ?, service_provided = ?, labor_cost = ?, parts_cost = ?, total_cost = ?, 
                 mechanic_id = ?, mechanic_name = ?, expected_delivery_date = ?, 
                 discount = ?, invoice_number = ?, vehicle_km = ?
                 WHERE id = ?`,
                [
                    status, problem_reported ? problem_reported.trim() : null, service_provided || null, labor_cost, parts_cost, total_cost,
                    mechanic_id || null, mechanic_name, expected_delivery_date || null,
                    Number(discount) || 0, invoice_number ? invoice_number.trim() : null,
                    vehicle_km ? parseInt(vehicle_km) : null,
                    id
                ]
            );

            // 4. Lógica de Finanças
            const valorTotal = Number(total_cost) || 0;
            const isEntregue = status === 'Entregue';
            const wasEntregue = currentOS.status === 'Entregue';

            if (isEntregue) {
                // A. Sincronizar Entrada (Faturamento)
                const [[incomeTran]] = await connection.query("SELECT id FROM transactions WHERE os_id = ? AND type = 'income'", [id]);
                if (incomeTran) {
                    await connection.query(
                        "UPDATE transactions SET amount = ?, payment_method = ?, status = ?, description = ? WHERE id = ?",
                        [valorTotal, payment_method || null, payment_status === 'pago' ? 'pago' : 'pendente', `OS #${id} - Entregue`, incomeTran.id]
                    );
                } else if (valorTotal > 0) {
                    await connection.query(
                        "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id, payment_method) VALUES ('income', 'Serviço/OS', ?, ?, ?, CURDATE(), ?, ?)",
                        [valorTotal, `OS #${id} - Entregue`, 'pendente', id, null]
                    );
                }

                // B. Sincronizar Saída (Custo das Peças)
                const [[costResult]] = await connection.query(`
                    SELECT SUM(op.quantity * i.cost_price) as total_parts_cost
                    FROM os_parts op
                    JOIN inventory i ON op.part_id = i.id
                    WHERE op.os_id = ?
                `, [id]);
                const totalPartsCost = Number(costResult.total_parts_cost) || 0;

                const [[expenseTran]] = await connection.query("SELECT id FROM transactions WHERE os_id = ? AND type = 'expense'", [id]);
                if (expenseTran) {
                    await connection.query(
                        "UPDATE transactions SET amount = ?, description = ? WHERE id = ?",
                        [totalPartsCost, `Custo de Peças - OS #${id}`, expenseTran.id]
                    );
                } else if (totalPartsCost > 0) {
                    await connection.query(
                        "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id) VALUES ('expense', 'Peças/Insumos', ?, ?, 'pago', CURDATE(), ?)",
                        [totalPartsCost, `Custo de Peças - OS #${id}`, id]
                    );
                }

                // C. Sincronizar Saída (Comissão do Mecânico se houver)
                if (mechanic_id && Number(labor_cost) > 0) {
                    const [[mech]] = await connection.query('SELECT commission_rate FROM mechanics WHERE id = ?', [mechanic_id]);
                    if (mech && Number(mech.commission_rate) > 0) {
                        const commissionAmount = (Number(labor_cost) * Number(mech.commission_rate)) / 100;
                        const [[commTran]] = await connection.query("SELECT id FROM transactions WHERE os_id = ? AND category = 'Comissão'", [id]);
                        
                        if (commTran) {
                            await connection.query(
                                "UPDATE transactions SET amount = ?, description = ? WHERE id = ?",
                                [commissionAmount, `Comissão OS #${id} - ${mechanic_name || 'Mecânico'}`, commTran.id]
                            );
                        } else {
                            await connection.query(
                                "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id) VALUES ('expense', 'Comissão', ?, ?, 'pendente', CURDATE(), ?)",
                                [commissionAmount, `Comissão OS #${id} - ${mechanic_name || 'Mecânico'}`, id]
                            );
                        }
                    } else {
                        // Se não tem comissão ou mecânico, remove se existir lançamento
                        await connection.query("DELETE FROM transactions WHERE os_id = ? AND category = 'Comissão'", [id]);
                    }
                } else {
                    // Remove se a mão de obra zerou ou mecânico foi removido
                    await connection.query("DELETE FROM transactions WHERE os_id = ? AND category = 'Comissão'", [id]);
                }
            } else if (wasEntregue) {
                // Se saiu de "Entregue", remove todos os lançamentos financeiros daquela OS
                await connection.query("DELETE FROM transactions WHERE os_id = ?", [id]);
            }

            await connection.commit();
            res.json({ message: 'OS atualizada com sucesso!' });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar OS' });
        } finally {
            connection.release();
        }
    },
    // Obter peças de uma OS
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
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar peças da OS' });
        }
    },

    // Adicionar peça à OS
    addPart: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params; // os_id
            const { part_id, quantity, unit_price } = req.body;

            if (!part_id || !quantity || !unit_price) {
                await connection.rollback();
                return res.status(400).json({ message: 'Dados incompletos para adicionar peça' });
            }

            const total_price = quantity * unit_price;

            // 1. Inserir na tabela os_parts
            await connection.query(
                'INSERT INTO os_parts (os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                [id, part_id, quantity, unit_price, total_price]
            );

            // 2. Decrementar estoque
            const [inventory] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [part_id]);
            if (inventory.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Peça não encontrada no inventário' });
            }

            const newStock = inventory[0].stock_quantity - quantity;
            if (newStock < 0) {
                await connection.rollback();
                return res.status(400).json({ message: 'Estoque insuficiente' });
            }

            await connection.query('UPDATE inventory SET stock_quantity = ? WHERE id = ?', [newStock, part_id]);

            // 3. Registrar movimentação de saída
            await connection.query(
                'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                [part_id, 'saida', quantity, `Adicionado à OS #${id}`]
            );

            // 4. Atualizar parts_cost e total_cost na Ordem de Serviço
            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;

            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotalCost = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query(
                'UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?',
                [partsCost, newTotalCost, id]
            );

            await connection.commit();
            res.status(201).json({ message: 'Peça adicionada com sucesso!', parts_cost: partsCost, total_cost: newTotalCost });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Erro ao adicionar peça à OS' });
        } finally {
            connection.release();
        }
    },

    // Atualizar quantidade de uma peça na OS
    updatePartQuantity: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id, partId } = req.params; // os_id e partId (id da tabela os_parts)
            const { quantity } = req.body;

            if (!quantity || quantity <= 0) {
                await connection.rollback();
                return res.status(400).json({ message: 'A quantidade deve ser maior que zero' });
            }

            // 1. Buscar detalhes atuais
            const [[osPart]] = await connection.query('SELECT part_id, quantity, unit_price FROM os_parts WHERE id = ? AND os_id = ?', [partId, id]);
            if (!osPart) {
                await connection.rollback();
                return res.status(404).json({ message: 'Registro de peça não encontrado na OS' });
            }

            const diff = quantity - osPart.quantity;
            const totalPrice = quantity * osPart.unit_price;

            // 2. Verificar estoque se estiver aumentando
            if (diff > 0) {
                const [[inventory]] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [osPart.part_id]);
                if (inventory.stock_quantity < diff) {
                    await connection.rollback();
                    return res.status(400).json({ message: 'Estoque insuficiente' });
                }
            }

            // 3. Atualizar os_parts
            await connection.query('UPDATE os_parts SET quantity = ?, total_price = ? WHERE id = ?', [quantity, totalPrice, partId]);

            // 4. Ajustar estoque
            await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [diff, osPart.part_id]);

            // 5. Registrar movimentação
            await connection.query(
                'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                [osPart.part_id, diff > 0 ? 'saida' : 'entrada', Math.abs(diff), `Ajuste de quantidade na OS #${id}`]
            );

            // 6. Recalcular totais da OS
            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;

            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotalCost = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query(
                'UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?',
                [partsCost, newTotalCost, id]
            );

            await connection.commit();
            res.json({ message: 'Quantidade atualizada com sucesso!', parts_cost: partsCost, total_cost: newTotalCost });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar quantidade da peça' });
        } finally {
            connection.release();
        }
    },

    // Remover peça da OS
    removePart: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id, partId } = req.params; // os_id e partId (id da tabela os_parts)

            // 1. Buscar detalhes da peça antes de remover
            const [[osPart]] = await connection.query('SELECT part_id, quantity FROM os_parts WHERE id = ? AND os_id = ?', [partId, id]);
            if (!osPart) {
                await connection.rollback();
                return res.status(404).json({ message: 'Registro de peça não encontrado na OS' });
            }

            // 2. Remover da OS
            await connection.query('DELETE FROM os_parts WHERE id = ?', [partId]);

            // 3. Devolver estoque
            await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [osPart.quantity, osPart.part_id]);

            // 4. Registrar movimentação de entrada (devolução)
            await connection.query(
                'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                [osPart.part_id, 'entrada', osPart.quantity, `Removido da OS #${id} (Devolução)`]
            );

            // 5. Recalcular totais da OS
            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;

            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotalCost = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query(
                'UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?',
                [partsCost, newTotalCost, id]
            );

            await connection.commit();
            res.json({ message: 'Peça removida com sucesso!', parts_cost: partsCost, total_cost: newTotalCost });
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: 'Erro ao remover peça da OS' });
        } finally {
            connection.release();
        }
    }

};

module.exports = osController;
