const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

/**
 * Controller Financeiro
 * Gerencia o fluxo de caixa (receitas/despesas), resumos estatísticos,
 * lembretes de contas a pagar/receber e integração com Ordens de Serviço.
 */
const financeController = {

    /**
     * Listar transações com filtro de data.
     * @param {Object} req - Query: start_date, end_date (YYYY-MM-DD).
     */
    getAll: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            let query = 'SELECT * FROM transactions';
            let params = [];

            if (start_date && end_date) {
                query += ' WHERE payment_date BETWEEN ? AND ?';
                params = [start_date, end_date];
            } else {
                // Filtro padrão: Mês atual
                query += ' WHERE MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())';
            }

            query += ' ORDER BY payment_date DESC, created_at DESC';
            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            logger.error(`[FINANCE:LIST] Erro ao buscar transações: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar transações financeiras' });
        }
    },

    /**
     * Obter Resumo Financeiro consolidado (Saldo, Receitas, Despesas, Pendentes).
     * @param {Object} req - Query: start_date, end_date.
     */
    getSummary: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            let whereClause = "WHERE status = 'pago'";
            let params = [];

            if (start_date && end_date) {
                whereClause += " AND payment_date BETWEEN ? AND ?";
                params = [start_date, end_date];
            } else {
                whereClause += " AND MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())";
            }

            // Receitas Efetivadas
            const [[{ total_income }]] = await db.query(
                `SELECT SUM(amount) as total_income FROM transactions ${whereClause} AND type = 'income'`,
                params
            );

            // Despesas Efetivadas
            const [[{ total_expense }]] = await db.query(
                `SELECT SUM(amount) as total_expense FROM transactions ${whereClause} AND type = 'expense'`,
                params
            );

            // Faturamento Pendente (independente de ser receita ou despesa pendente, foca no income aqui)
            let pendingWhere = "WHERE status = 'pendente'";
            let pParams = [];
            if (start_date && end_date) {
                pendingWhere += " AND payment_date BETWEEN ? AND ?";
                pParams = [start_date, end_date];
            } else {
                pendingWhere += " AND MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())";
            }

            const [[{ total_pending_income }]] = await db.query(
                `SELECT SUM(amount) as total_pending_income FROM transactions ${pendingWhere} AND type = 'income'`,
                pParams
            );

            const income = Number(total_income) || 0;
            const expense = Number(total_expense) || 0;
            const pendingIncome = Number(total_pending_income) || 0;
            const balance = income - expense;

            res.json({ 
                success: true,
                data: { balance, income, expense, pending_income: pendingIncome } 
            });
        } catch (error) {
            logger.error(`[FINANCE:SUMMARY] Erro ao gerar resumo: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao gerar resumo financeiro' });
        }
    },

    /**
     * Criar uma nova movimentação financeira manual.
     * Gera UUID automaticamente para persistência segura.
     */
    create: async (req, res) => {
        try {
            const { type, category, amount, description, payment_date, status, payment_method, os_id } = req.body;
            const transactionId = uuidv4();

            const pDate = payment_date || req.body.date || null;

            await db.query(
                `INSERT INTO transactions (
                    id, type, category, amount, description, payment_date, status, payment_method, os_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    transactionId, type, category, Number(amount), description.trim(), 
                    pDate, status || 'pendente', payment_method || null, os_id || null
                ]
            );

            logger.info(`[FINANCE:CREATE] Transação ${transactionId} criada (${type})`);
            res.status(201).json({ 
                success: true, 
                id: transactionId, 
                message: 'Movimentação financeira registrada com sucesso!' 
            });
        } catch (error) {
            logger.error(`[FINANCE:CREATE] Erro ao cadastrar: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao cadastrar transação' });
        }
    },

    /**
     * Atualizar dados de uma transação existente.
     */
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { type, category, amount, description, payment_date, status, payment_method, os_id } = req.body;

            const pDate = payment_date || req.body.date || null;

            const [result] = await db.query(
                `UPDATE transactions SET 
                    type = ?, category = ?, amount = ?, description = ?, 
                    payment_date = ?, status = ?, payment_method = ?, os_id = ? 
                 WHERE id = ?`,
                [
                    type, category, Number(amount), description?.trim(), 
                    pDate, status, payment_method || null, os_id || null, id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Transação não localizada' });
            }

            logger.info(`[FINANCE:UPDATE] Transação ${id} atualizada.`);
            res.json({ success: true, message: 'Transação financeira atualizada!' });
        } catch (error) {
            logger.error(`[FINANCE:UPDATE] Erro na transação ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao atualizar dados financeiros' });
        }
    },

    /**
     * Obter lembretes segmentados por status (Atrasados vs Pendentes).
     */
    getReminders: async (req, res) => {
        try {
            const [rows] = await db.query(
                "SELECT * FROM transactions WHERE status = 'pendente' ORDER BY payment_date ASC"
            );

            const today = new Date().toISOString().split('T')[0];
            
            const overdue = rows.filter(t => {
                if (!t.payment_date) return false;
                const d = new Date(t.payment_date).toISOString().split('T')[0];
                return d < today;
            });
            
            const pending = rows.filter(t => {
                if (!t.payment_date) return true;
                const d = new Date(t.payment_date).toISOString().split('T')[0];
                return d >= today;
            });

            res.json({
                success: true,
                total: rows.length,
                pending: pending,
                overdue: overdue
            });
        } catch (error) {
            logger.error(`[FINANCE:REMINDERS] Erro ao buscar lembretes: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar lembretes' });
        }
    },

    /**
     * Excluir uma transação financeira.
     */
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM transactions WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Transação não encontrada' });
            }

            logger.info(`[FINANCE:DELETE] Transação ${id} removida.`);
            res.json({ success: true, message: 'Transação excluída com sucesso!' });
        } catch (error) {
            logger.error(`[FINANCE:DELETE] Erro ao remover ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao excluir lançamento' });
        }
    }
};

module.exports = financeController;
