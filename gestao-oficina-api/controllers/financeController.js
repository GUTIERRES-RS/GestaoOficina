const db = require('../config/database');

const financeController = {
    // Obter todas as transações
    getAll: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;
            let query = 'SELECT * FROM transactions';
            let params = [];

            if (start_date && end_date) {
                query += ' WHERE payment_date BETWEEN ? AND ?';
                params = [start_date, end_date];
            } else {
                query += ' WHERE MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())';
            }

            query += ' ORDER BY payment_date DESC, created_at DESC';
            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar transações financeiras' });
        }
    },

    // Obter Resumo Financeiro (Cards Superiores)
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

            const [[{ total_income }]] = await db.query(
                `SELECT SUM(amount) as total_income FROM transactions ${whereClause} AND type = 'income'`,
                params
            );
            // Despesas
            const [[{ total_expense }]] = await db.query(
                `SELECT SUM(amount) as total_expense FROM transactions ${whereClause} AND type = 'expense'`,
                params
            );

            const income = Number(total_income) || 0;
            const expense = Number(total_expense) || 0;
            const balance = income - expense;

            res.json({ balance, income, expense });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao gerar resumo financeiro' });
        }
    },

    // Criar nova transação
    create: async (req, res) => {
        try {
            const { type, category, amount, description, date, status, payment_method } = req.body;

            if (!type || !description || !amount) {
                return res.status(400).json({ message: 'Tipo, descrição e valor são obrigatórios' });
            }

            const [result] = await db.query(
                'INSERT INTO transactions (type, category, amount, description, payment_date, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [type, category, amount, description, date || null, status || 'pendente', payment_method || null]
            );
            res.status(201).json({ id: result.insertId, message: 'Transação cadastrada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao cadastrar transação' });
        }
    },

    // Atualizar transação
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { type, category, amount, description, date, status, payment_method } = req.body;

            const [result] = await db.query(
                'UPDATE transactions SET type = ?, category = ?, amount = ?, description = ?, payment_date = ?, status = ?, payment_method = ? WHERE id = ?',
                [type, category, amount, description, date || null, status, payment_method || null, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Transação não encontrada' });
            }

            res.json({ message: 'Transação atualizada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar transação' });
        }
    },

    // Obter Lembretes (Pendentes e Vencidos)
    getReminders: async (req, res) => {
        try {
            // Busca transações pendentes
            const [rows] = await db.query(
                `SELECT * FROM transactions 
                 WHERE status = 'pendente' 
                 ORDER BY payment_date ASC`
            );

            const today = new Date().toISOString().split('T')[0];
            
            const overdue = rows.filter(t => {
                if (!t.payment_date) return false;
                const dateStr = new Date(t.payment_date).toISOString().split('T')[0];
                return dateStr < today;
            });
            
            const pending = rows.filter(t => {
                if (!t.payment_date) return true;
                const dateStr = new Date(t.payment_date).toISOString().split('T')[0];
                return dateStr >= today;
            });

            res.json({
                total: rows.length,
                pending: pending,
                overdue: overdue
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar lembretes de pagamento' });
        }
    },

    // Excluir transação
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await db.query('DELETE FROM transactions WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Transação não encontrada' });
            }

            res.json({ message: 'Transação excluída com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao excluir transação' });
        }
    }
};

module.exports = financeController;
