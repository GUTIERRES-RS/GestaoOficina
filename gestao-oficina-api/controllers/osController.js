const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

const osController = {
    // Obter todas as Ordens de Serviço
    getAll: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            let query = `
                SELECT so.*, c.name as client_name, c.document as client_document, c.phone as client_phone, v.plate, v.brand, v.model as vehicle_model, v.km_cad as km 
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
            logger.error(`FETCH OS ERROR: ${error.stack}`);
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
            logger.error(`GET OS BY ID ERROR: ${error.stack}`);
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
            logger.error(`GET OS BY VEHICLE ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao buscar OS' });
        }
    },

    // Criar nova OS
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
                parts 
            } = req.body;

            // 1. Verificar estoque se houver peças
            if (parts && parts.length > 0) {
                for (const p of parts) {
                    const [[inv]] = await connection.query('SELECT stock_quantity, name FROM inventory WHERE id = ?', [p.part_id]);
                    if (!inv || inv.stock_quantity < p.quantity) {
                        await connection.rollback();
                        return res.status(400).json({ 
                            message: `Estoque insuficiente para: ${inv?.name || 'ID ' + p.part_id}. Disponível: ${inv?.stock_quantity || 0}` 
                        });
                    }
                }
            }

            // 2. Inserir a OS com ID UUID gerado
            await connection.query(
                'INSERT INTO service_orders (id, client_id, vehicle_id, mechanic_id, mechanic_name, problem_reported, service_provided, status, labor_cost, parts_cost, total_cost, expected_delivery_date, discount, invoice_number, vehicle_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    osId, client_id, vehicle_id, mechanic_id || null, mechanic_name ? mechanic_name.trim() : null,
                    problem_reported.trim(), service_provided ? service_provided.trim() : null,
                    status || 'Aberto', labor_cost || 0, parts_cost || 0, total_cost || 0,
                    expected_delivery_date || null, Number(discount) || 0,
                    invoice_number ? invoice_number.trim() : null, vehicle_km ? parseInt(vehicle_km) : null
                ]
            );

            // 3. Inserir peças e atualizar estoque
            if (parts && parts.length > 0) {
                for (const p of parts) {
                    const ospId = uuidv4();
                    const total_price = p.quantity * p.unit_price;
                    await connection.query(
                        'INSERT INTO os_parts (id, os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                        [ospId, osId, p.part_id, p.quantity, p.unit_price, total_price]
                    );
                    await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [p.quantity, p.part_id]);
                    
                    const movId = uuidv4();
                    await connection.query(
                        'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                        [movId, p.part_id, 'saida', p.quantity, `Saída transacional OS: ${osId}`]
                    );
                }
            }

            // 4. Finanças
            const valorTotal = Number(total_cost) || 0;
            if (status === 'Entregue') {
                if (valorTotal > 0) {
                    await connection.query(
                        "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id, payment_method) VALUES (?, 'income', 'Serviço/OS', ?, ?, ?, CURDATE(), ?, ?)",
                        [uuidv4(), valorTotal, `OS #${osId.substring(0,8)} - Entregue`, 'pendente', osId, null]
                    );
                }

                const [[costResult]] = await connection.query(`
                    SELECT SUM(op.quantity * i.cost_price) as total_parts_cost
                    FROM os_parts op
                    JOIN inventory i ON op.part_id = i.id
                    WHERE op.os_id = ?
                `, [osId]);
                const totalPartsCost = Number(costResult.total_parts_cost) || 0;

                if (totalPartsCost > 0) {
                    await connection.query(
                        "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id) VALUES (?, 'expense', 'Peças/Insumos', ?, ?, 'pago', CURDATE(), ?)",
                        [uuidv4(), totalPartsCost, `Custo Peças - OS: ${osId.substring(0,8)}`, osId]
                    );
                }

                if (mechanic_id && Number(labor_cost) > 0) {
                    const [[mech]] = await connection.query('SELECT commission_rate FROM mechanics WHERE id = ?', [mechanic_id]);
                    if (mech && Number(mech.commission_rate) > 0) {
                        const commissionAmount = (Number(labor_cost) * Number(mech.commission_rate)) / 100;
                        await connection.query(
                            "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id) VALUES (?, 'expense', 'Comissão', ?, ?, 'pendente', CURDATE(), ?)",
                            [uuidv4(), commissionAmount, `Comissão OS: ${osId.substring(0,8)} - ${mechanic_name || 'Mecânico'}`, osId]
                        );
                    }
                }
            }

            await connection.commit();
            logger.info(`OS Created: ${osId} for Client: ${client_id}`);
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
                parts 
            } = req.body;

            // 1. Buscar status atual da OS
            const [[currentOS]] = await connection.query('SELECT status, total_cost FROM service_orders WHERE id = ?', [id]);
            if (!currentOS) {
                await connection.rollback();
                return res.status(404).json({ message: 'OS não encontrada' });
            }

            // 2. Se houver array de peças, sincronizar (Abordagem Transacional)
            if (parts) {
                const [existingParts] = await connection.query('SELECT part_id, quantity FROM os_parts WHERE os_id = ?', [id]);
                
                for (const newPart of parts) {
                    const existing = existingParts.find(p => p.part_id === newPart.part_id);
                    const diff = existing ? (newPart.quantity - existing.quantity) : newPart.quantity;

                    if (diff > 0) {
                        const [[inv]] = await connection.query('SELECT stock_quantity, name FROM inventory WHERE id = ?', [newPart.part_id]);
                        if (!inv || inv.stock_quantity < diff) {
                            await connection.rollback();
                            return res.status(400).json({ 
                                message: `Estoque insuficiente: ${inv?.name || 'ID ' + newPart.part_id}. Disponível: ${inv?.stock_quantity || 0}` 
                            });
                        }
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [diff, newPart.part_id]);
                        await connection.query(
                            'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), newPart.part_id, 'saida', diff, `Ajuste OS: ${id.substring(0,8)}`]
                        );
                    } else if (diff < 0) {
                        const refundQty = Math.abs(diff);
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [refundQty, newPart.part_id]);
                        await connection.query(
                            'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), newPart.part_id, 'entrada', refundQty, `Retorno OS: ${id.substring(0,8)}`]
                        );
                    }
                }

                for (const oldPart of existingParts) {
                    const stillExists = parts.find(p => p.part_id === oldPart.part_id);
                    if (!stillExists) {
                        await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [oldPart.quantity, oldPart.part_id]);
                        await connection.query(
                            'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                            [uuidv4(), oldPart.part_id, 'entrada', oldPart.quantity, `Remoção OS: ${id.substring(0,8)}`]
                        );
                    }
                }

                await connection.query('DELETE FROM os_parts WHERE os_id = ?', [id]);
                for (const p of parts) {
                    const total_price = Number(p.quantity) * Number(p.unit_price);
                    await connection.query(
                        'INSERT INTO os_parts (id, os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                        [uuidv4(), id, p.part_id, p.quantity, p.unit_price, total_price]
                    );
                }
            }

            // 3. Atualizar dados principais
            await connection.query(
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
                const [[incomeTran]] = await connection.query("SELECT id FROM transactions WHERE os_id = ? AND type = 'income'", [id]);
                if (incomeTran) {
                    await connection.query(
                        "UPDATE transactions SET amount = ?, payment_method = ?, status = ?, description = ? WHERE id = ?",
                        [valorTotal, payment_method || null, payment_status === 'pago' ? 'pago' : 'pendente', `OS #${id.substring(0,8)} - Entregue`, incomeTran.id]
                    );
                } else if (valorTotal > 0) {
                    await connection.query(
                        "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id, payment_method) VALUES (?, 'income', 'Serviço/OS', ?, ?, ?, CURDATE(), ?, ?)",
                        [uuidv4(), valorTotal, `OS #${id.substring(0,8)} - Entregue`, 'pendente', id, null]
                    );
                }

                const [[costResult]] = await connection.query(`
                    SELECT SUM(op.quantity * i.cost_price) as total_parts_cost
                    FROM os_parts op
                    JOIN inventory i ON op.part_id = i.id
                    WHERE op.os_id = ?
                `, [id]);
                const totalPartsCost = Number(costResult.total_parts_cost) || 0;

                const [[expenseTran]] = await connection.query("SELECT id FROM transactions WHERE os_id = ? AND type = 'expense' AND category = 'Peças/Insumos'", [id]);
                if (expenseTran) {
                    await connection.query(
                        "UPDATE transactions SET amount = ?, description = ? WHERE id = ?",
                        [totalPartsCost, `Custo Peças - OS: ${id.substring(0,8)}`, expenseTran.id]
                    );
                } else if (totalPartsCost > 0) {
                    await connection.query(
                        "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id) VALUES (?, 'expense', 'Peças/Insumos', ?, ?, 'pago', CURDATE(), ?)",
                        [uuidv4(), totalPartsCost, `Custo Peças - OS: ${id.substring(0,8)}`, id]
                    );
                }

                if (mechanic_id && Number(labor_cost) > 0) {
                    const [[mech]] = await connection.query('SELECT commission_rate FROM mechanics WHERE id = ?', [mechanic_id]);
                    if (mech && Number(mech.commission_rate) > 0) {
                        const commissionAmount = (Number(labor_cost) * Number(mech.commission_rate)) / 100;
                        const [[commTran]] = await connection.query("SELECT id FROM transactions WHERE os_id = ? AND category = 'Comissão'", [id]);
                        
                        if (commTran) {
                            await connection.query(
                                "UPDATE transactions SET amount = ?, description = ? WHERE id = ?",
                                [commissionAmount, `Comissão OS: ${id.substring(0,8)} - ${mechanic_name || 'Mecânico'}`, commTran.id]
                            );
                        } else {
                            await connection.query(
                                "INSERT INTO transactions (id, type, category, amount, description, status, payment_date, os_id) VALUES (?, 'expense', 'Comissão', ?, ?, 'pendente', CURDATE(), ?)",
                                [uuidv4(), commissionAmount, `Comissão OS: ${id.substring(0,8)} - ${mechanic_name || 'Mecânico'}`, id]
                            );
                        }
                    } else {
                        await connection.query("DELETE FROM transactions WHERE os_id = ? AND category = 'Comissão'", [id]);
                    }
                } else {
                    await connection.query("DELETE FROM transactions WHERE os_id = ? AND category = 'Comissão'", [id]);
                }
            } else if (wasEntregue) {
                await connection.query("DELETE FROM transactions WHERE os_id = ?", [id]);
            }

            await connection.commit();
            logger.info(`OS Updated: ${id} to Status: ${status}`);
            res.json({ message: 'OS atualizada com sucesso!' });
        } catch (error) {
            await connection.rollback();
            logger.error(`UPDATE OS ERROR: ${error.stack}`);
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
            logger.error(`GET OS PARTS ERROR: ${error.stack}`);
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

            const total_price = quantity * unit_price;

            await connection.query(
                'INSERT INTO os_parts (id, os_id, part_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
                [uuidv4(), id, part_id, quantity, unit_price, total_price]
            );

            const [inventory] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [part_id]);
            const newStock = inventory[0].stock_quantity - quantity;
            if (newStock < 0) {
                await connection.rollback();
                return res.status(400).json({ message: 'Estoque insuficiente' });
            }

            await connection.query('UPDATE inventory SET stock_quantity = ? WHERE id = ?', [newStock, part_id]);
            await connection.query(
                'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), part_id, 'saida', quantity, `Adicionado OS: ${id.substring(0,8)}`]
            );

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
            logger.error(`ADD PART ERROR: ${error.stack}`);
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

            const [[osPart]] = await connection.query('SELECT part_id, quantity, unit_price FROM os_parts WHERE id = ? AND os_id = ?', [partId, id]);
            if (!osPart) {
                await connection.rollback();
                return res.status(404).json({ message: 'Registro não encontrado' });
            }

            const diff = quantity - osPart.quantity;
            const totalPrice = quantity * osPart.unit_price;

            if (diff > 0) {
                const [[inventory]] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [osPart.part_id]);
                if (inventory.stock_quantity < diff) {
                    await connection.rollback();
                    return res.status(400).json({ message: 'Estoque insuficiente' });
                }
            }

            await connection.query('UPDATE os_parts SET quantity = ?, total_price = ? WHERE id = ?', [quantity, totalPrice, partId]);
            await connection.query('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE id = ?', [diff, osPart.part_id]);
            await connection.query(
                'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), osPart.part_id, diff > 0 ? 'saida' : 'entrada', Math.abs(diff), `Ajuste qtd OS: ${id.substring(0,8)}`]
            );

            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;
            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotalCost = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query(
                'UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?',
                [partsCost, newTotalCost, id]
            );

            await connection.commit();
            res.json({ message: 'Quantidade atualizada!', parts_cost: partsCost, total_cost: newTotalCost });
        } catch (error) {
            await connection.rollback();
            logger.error(`UPDATE PART QTY ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao atualizar quantidade' });
        } finally {
            connection.release();
        }
    },

    // Remover peça da OS
    removePart: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id, partId } = req.params;

            const [[osPart]] = await connection.query('SELECT part_id, quantity FROM os_parts WHERE id = ? AND os_id = ?', [partId, id]);
            if (!osPart) {
                await connection.rollback();
                return res.status(404).json({ message: 'Registro não encontrado' });
            }

            await connection.query('DELETE FROM os_parts WHERE id = ?', [partId]);
            await connection.query('UPDATE inventory SET stock_quantity = stock_quantity + ? WHERE id = ?', [osPart.quantity, osPart.part_id]);
            await connection.query(
                'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), osPart.part_id, 'entrada', osPart.quantity, `Removido OS: ${id.substring(0,8)}`]
            );

            const [[totals]] = await connection.query('SELECT SUM(total_price) as total_parts FROM os_parts WHERE os_id = ?', [id]);
            const partsCost = Number(totals.total_parts) || 0;
            const [[os]] = await connection.query('SELECT labor_cost, discount FROM service_orders WHERE id = ?', [id]);
            const newTotalCost = Number(os.labor_cost || 0) + partsCost - Number(os.discount || 0);

            await connection.query(
                'UPDATE service_orders SET parts_cost = ?, total_cost = ? WHERE id = ?',
                [partsCost, newTotalCost, id]
            );

            await connection.commit();
            res.json({ message: 'Peça removida!', parts_cost: partsCost, total_cost: newTotalCost });
        } catch (error) {
            await connection.rollback();
            logger.error(`REMOVE PART ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao remover peça' });
        } finally {
            connection.release();
        }
    }

};

module.exports = osController;
