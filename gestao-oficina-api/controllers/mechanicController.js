const db = require('../config/database');

const mechanicController = {
    // Listar todos os mecânicos
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM mechanics ORDER BY name ASC'
            );
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar mecânicos' });
        }
    },

    // Obter mecânico por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query('SELECT * FROM mechanics WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Mecânico não encontrado' });
            res.json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar mecânico' });
        }
    },

    // Criar mecânico
    create: async (req, res) => {
        try {
            const { name, phone, document, specialty, commission_rate, status, hire_date, notes } = req.body;
            if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });

            const [result] = await db.query(
                `INSERT INTO mechanics (name, phone, document, specialty, commission_rate, status, hire_date, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name.trim(),
                    phone || null,
                    document || null,
                    specialty || null,
                    commission_rate || 0,
                    status || 'Ativo',
                    hire_date || null,
                    notes || null
                ]
            );
            res.status(201).json({ id: result.insertId, message: 'Mecânico cadastrado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao cadastrar mecânico' });
        }
    },

    // Atualizar mecânico
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, document, specialty, commission_rate, status, hire_date, notes } = req.body;

            const [result] = await db.query(
                `UPDATE mechanics SET name = ?, phone = ?, document = ?, specialty = ?,
                 commission_rate = ?, status = ?, hire_date = ?, notes = ?
                 WHERE id = ?`,
                [name, phone, document, specialty, commission_rate, status, hire_date, notes, id]
            );

            if (result.affectedRows === 0) return res.status(404).json({ message: 'Mecânico não encontrado' });
            res.json({ message: 'Mecânico atualizado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar mecânico' });
        }
    },

    // Deletar mecânico
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM mechanics WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Mecânico não encontrado' });
            res.json({ message: 'Mecânico removido com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao remover mecânico' });
        }
    },

    // Relatório de comissão por mecânico (com filtro de período)
    getCommissionReport: async (req, res) => {
        try {
            const { start_date, end_date, mechanic_id } = req.query;

            let whereClauses = ["so.status NOT IN ('Cancelado')", "so.expected_delivery_date IS NOT NULL"];
            const params = [];

            if (start_date) {
                whereClauses.push('DATE(so.expected_delivery_date) >= ?');
                params.push(start_date);
            }
            if (end_date) {
                whereClauses.push('DATE(so.expected_delivery_date) <= ?');
                params.push(end_date);
            }
            if (mechanic_id) {
                whereClauses.push('m.id = ?');
                params.push(mechanic_id);
            }

            const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

            const query = `
                SELECT
                    m.id AS mechanic_id,
                    m.name AS mechanic_name,
                    m.commission_rate,
                    m.specialty,
                    COUNT(so.id) AS total_os,
                    COALESCE(SUM(so.labor_cost), 0) AS total_labor,
                    COALESCE(SUM(so.total_cost), 0) AS total_revenue,
                    COALESCE(ROUND(SUM(so.labor_cost * m.commission_rate / 100), 2), 0) AS total_commission
                FROM mechanics m
                LEFT JOIN service_orders so ON so.mechanic_id = m.id
                ${whereSQL}
                GROUP BY m.id, m.name, m.commission_rate, m.specialty
                ORDER BY total_commission DESC
            `;

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao gerar relatório de comissão' });
        }
    },

    // Detalhe de OS de um mecânico específico (para drill-down)
    getMechanicOsList: async (req, res) => {
        try {
            const { id } = req.params;
            const { start_date, end_date } = req.query;

            let whereClauses = ['so.mechanic_id = ?', "so.status NOT IN ('Cancelado')", "so.expected_delivery_date IS NOT NULL"];
            const params = [id];

            if (start_date) { whereClauses.push('DATE(so.expected_delivery_date) >= ?'); params.push(start_date); }
            if (end_date)   { whereClauses.push('DATE(so.expected_delivery_date) <= ?'); params.push(end_date);   }

            const query = `
                SELECT so.id, so.status, so.labor_cost, so.total_cost, so.created_at, so.expected_delivery_date,
                       c.name AS client_name, v.plate, v.brand, v.model,
                       ROUND(so.labor_cost * m.commission_rate / 100, 2) AS commission_value
                FROM service_orders so
                JOIN clients c ON c.id = so.client_id
                JOIN vehicles v ON v.id = so.vehicle_id
                JOIN mechanics m ON m.id = so.mechanic_id
                WHERE ${whereClauses.join(' AND ')}
                ORDER BY so.expected_delivery_date DESC
            `;

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar OS do mecânico' });
        }
    }
};

module.exports = mechanicController;
