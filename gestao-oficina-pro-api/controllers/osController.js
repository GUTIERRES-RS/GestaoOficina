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
        try {
            const {
                client_id, vehicle_id, mechanic_id, mechanic_name,
                problem_reported, service_provided, status, expected_delivery_date,
                labor_cost, parts_cost, total_cost,
                discount, invoice_number, vehicle_km
            } = req.body;

            if (!client_id || !vehicle_id || !problem_reported) {
                return res.status(400).json({ message: 'Cliente, veículo e problema relatado são obrigatórios' });
            }

            const [result] = await db.query(
                'INSERT INTO service_orders (client_id, vehicle_id, mechanic_id, mechanic_name, problem_reported, service_provided, status, labor_cost, parts_cost, total_cost, expected_delivery_date, discount, invoice_number, vehicle_km) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    client_id,
                    vehicle_id,
                    mechanic_id || null,
                    mechanic_name ? mechanic_name.trim() : null,
                    problem_reported.trim(),
                    service_provided ? service_provided.trim() : null,
                    status || 'Aberto',
                    labor_cost || 0,
                    parts_cost || 0,
                    total_cost || 0,
                    expected_delivery_date || null,
                    Number(discount) || 0,
                    invoice_number ? invoice_number.trim() : null,
                    vehicle_km ? parseInt(vehicle_km) : null
                ]
            );

            // Sync with Finances
            const valorTotal = Number(total_cost) || 0;
            if (status === 'Entregue' && valorTotal > 0) {
                await db.query(
                    "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id, payment_method) VALUES ('income', 'Serviço/OS', ?, ?, ?, CURDATE(), ?, ?)",
                    [
                        valorTotal,
                        `OS #${result.insertId} - Entregue`,
                        'pendente', // Default to pending as it's no longer determined from the OS
                        result.insertId,
                        null // Method managed in Finances
                    ]
                );
            }

            res.status(201).json({ id: result.insertId, message: 'OS criada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao criar OS' });
        }
    },

    // Atualizar Status/Valores da OS
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                status, problem_reported, service_provided, labor_cost, parts_cost, total_cost,
                mechanic_id, mechanic_name, expected_delivery_date,
                discount, invoice_number, vehicle_km,
                payment_method, payment_status
            } = req.body;

            // Buscar status atual da OS antes de atualizar
            const [[currentOS]] = await db.query('SELECT status, total_cost FROM service_orders WHERE id = ?', [id]);
            if (!currentOS) return res.status(404).json({ message: 'OS não encontrada' });

            const [result] = await db.query(
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
            if (result.affectedRows === 0) return res.status(404).json({ message: 'OS não encontrada' });

            // FINANCE SYNC LOGIC
            const valorTotal = Number(total_cost) || 0;
            const isEntregue = status === 'Entregue';
            const wasEntregue = currentOS.status === 'Entregue';

            if (isEntregue) {
                // If it IS "Entregue", ensure a transaction exists and is up to date
                const [[transaction]] = await db.query("SELECT id FROM transactions WHERE os_id = ?", [id]);

                if (transaction) {
                    // Update existing transaction
                    await db.query(
                        "UPDATE transactions SET amount = ?, payment_method = ?, status = ?, description = ? WHERE id = ?",
                        [
                            valorTotal,
                            payment_method || null,
                            payment_status === 'pago' ? 'pago' : 'pendente',
                            `OS #${id} - Entregue`,
                            transaction.id
                        ]
                    );
                } else if (valorTotal > 0) {
                    // Create new transaction
                    await db.query(
                        "INSERT INTO transactions (type, category, amount, description, status, payment_date, os_id, payment_method) VALUES ('income', 'Serviço/OS', ?, ?, ?, CURDATE(), ?, ?)",
                        [
                            valorTotal,
                            `OS #${id} - Entregue`,
                            'pendente', // Safe default
                            id,
                            null
                        ]
                    );
                }
            } else if (wasEntregue) {
                // If it WAS "Entregue" but NO LONGER is, delete the associated transaction
                await db.query("DELETE FROM transactions WHERE os_id = ?", [id]);
            }

            res.json({ message: 'OS atualizada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar OS' });
        }
    }

};

module.exports = osController;
