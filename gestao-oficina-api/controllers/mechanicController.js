const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

/**
 * Controller de Mecânicos
 * Responsável pela gestão da equipe técnica, acompanhamento de produtividade
 * e geração de relatórios de comissões por período.
 */
const mechanicController = {

    /**
     * Listar todos os mecânicos cadastrados.
     * @route GET /mechanics
     */
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM mechanics ORDER BY name ASC'
            );
            res.json({ success: true, data: rows });
        } catch (error) {
            logger.error(`[MECHANIC:LIST] Erro ao buscar lista: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar equipe técnica' });
        }
    },

    /**
     * Obter detalhes técnicos de um mecânico específico.
     */
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query('SELECT * FROM mechanics WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Mecânico não localizado' });
            }
            
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            logger.error(`[MECHANIC:GET] Erro ao buscar ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar consulta de mecânico' });
        }
    },

    /**
     * Cadastrar novo mecânico na plataforma.
     * Gera UUID automaticamente.
     */
    create: async (req, res) => {
        try {
            const mechanicId = uuidv4();
            const { name, phone, document, specialty, commission_rate, status, hire_date, notes } = req.body;

            await db.query(
                `INSERT INTO mechanics (id, name, phone, document, specialty, commission_rate, status, hire_date, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    mechanicId,
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

            logger.info(`[MECHANIC:CREATE] Mecânico cadastrado: ${mechanicId} (${name})`);
            res.status(201).json({ 
                success: true, 
                id: mechanicId, 
                message: 'Novo técnico integrado com sucesso!' 
            });
        } catch (error) {
            logger.error(`[MECHANIC:CREATE] Erro no cadastro: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao registrar mecânico' });
        }
    },

    /**
     * Atualizar dados cadastrais ou técnicos do mecânico.
     */
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, document, specialty, commission_rate, status, hire_date, notes } = req.body;

            const [result] = await db.query(
                `UPDATE mechanics SET 
                    name = ?, phone = ?, document = ?, specialty = ?,
                    commission_rate = ?, status = ?, hire_date = ?, notes = ?
                 WHERE id = ?`,
                [name.trim(), phone, document, specialty, commission_rate, status, hire_date, notes, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Registro não localizado para edição' });
            }

            logger.info(`[MECHANIC:UPDATE] Mecânico atualizado: ${id}`);
            res.json({ success: true, message: 'Cadastro do técnico atualizado com sucesso!' });
        } catch (error) {
            logger.error(`[MECHANIC:UPDATE] Erro na atualização ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao atualizar dados do mecânico' });
        }
    },

    /**
     * Remover um mecânico do sistema.
     * Restrição: Mecânicos com OS vinculadas não podem ser excluídos.
     */
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM mechanics WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Mecânico não encontrado para exclusão' });
            }

            logger.info(`[MECHANIC:DELETE] Mecânico removido: ${id}`);
            res.json({ success: true, message: 'Técnico removido do catálogo com sucesso!' });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ success: false, message: 'Impossível excluir: Este técnico possui Ordens de Serviço vinculadas.' });
            }
            logger.error(`[MECHANIC:DELETE] Erro ao remover ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro técnico ao tentar excluir o mecânico' });
        }
    },

    /**
     * Gerar relatório consolidado de comensões por período e mecânico.
     * @param {Object} req - Query: start_date, end_date (YYYY-MM-DD), mechanic_id (opcional).
     */
    getCommissionReport: async (req, res) => {
        try {
            const { start_date, end_date, mechanic_id } = req.query;
            const params = [];

            let joinConditions = "so.status NOT IN ('Cancelado') AND so.expected_delivery_date IS NOT NULL";
            
            if (start_date) {
                joinConditions += " AND DATE(so.expected_delivery_date) >= ?";
                params.push(start_date);
            }
            if (end_date) {
                joinConditions += " AND DATE(so.expected_delivery_date) <= ?";
                params.push(end_date);
            }

            let whereClause = "";
            if (mechanic_id) {
                whereClause = " WHERE m.id = ?";
                params.push(mechanic_id);
            }

            const query = `
                SELECT
                    m.id AS mechanic_id,
                    m.name AS mechanic_name,
                    m.commission_rate,
                    m.specialty,
                    COALESCE(COUNT(DISTINCT so.id), 0) AS total_os,
                    COALESCE(SUM(so.labor_cost), 0) AS total_labor,
                    COALESCE(SUM(so.total_cost), 0) AS total_revenue,
                    COALESCE(ROUND(SUM(so.labor_cost * m.commission_rate / 100), 2), 0) AS total_commission
                FROM mechanics m
                LEFT JOIN service_orders so ON so.mechanic_id = m.id AND ${joinConditions}
                ${whereClause}
                GROUP BY m.id, m.name, m.commission_rate, m.specialty
                ORDER BY total_commission DESC
            `;

            const [rows] = await db.query(query, params);
            res.json({ success: true, data: rows });
        } catch (error) {
            logger.error(`[MECHANIC:COMMISSION] Falha ao gerar relatório: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar relatório de comissões' });
        }
    },

    /**
     * Listar histórico detalhado de OS finalizadas por um mecânico no período.
     */
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
            res.json({ success: true, data: rows });
        } catch (error) {
            logger.error(`[MECHANIC:OS_LIST] Erro ao listar OS do técnico ${id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao recuperar histórico de atendimentos' });
        }
    }
};

module.exports = mechanicController;
