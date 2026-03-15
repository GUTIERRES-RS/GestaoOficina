const db = require('../config/database');

const inventoryController = {
    // Obter todo o estoque
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM inventory ORDER BY name ASC');
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar estoque' });
        }
    },

    // Obter peça por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Peça não encontrada' });
            res.json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar peça' });
        }
    },

    // Criar nova peça
    create: async (req, res) => {
        try {
            const { code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Nome da peça é obrigatório' });
            }

            const [result] = await db.query(
                'INSERT INTO inventory (code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    code ? code.trim() : null,
                    name.trim(),
                    description ? description.trim() : null,
                    category ? category.trim() : null,
                    supplier ? supplier.trim() : null,
                    Number(stock_quantity) || 0,
                    Number(min_stock) || 0,
                    Number(cost_price) || 0,
                    Number(sale_price) || 0
                ]
            );

            // Registrar movimento inicial caso stock_quantity > 0
            if (Number(stock_quantity) > 0) {
                await db.query(
                    'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                    [result.insertId, 'entrada', Number(stock_quantity), 'Estoque inicial']
                );
            }

            res.status(201).json({ id: result.insertId, message: 'Peça cadastrada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao cadastrar peça' });
        }
    },

    // Atualizar peça
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Nome da peça é obrigatório' });
            }

            // Verifica diferença de estoque para lançar movimentação
            const [currentRows] = await db.query('SELECT stock_quantity FROM inventory WHERE id = ?', [id]);
            if (currentRows.length > 0) {
                const diff = Number(stock_quantity) - currentRows[0].stock_quantity;
                if (diff !== 0) {
                    await db.query(
                        'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                        [id, diff > 0 ? 'entrada' : 'saida', Math.abs(diff), 'Ajuste manual de estoque']
                    );
                }
            }

            const [result] = await db.query(
                'UPDATE inventory SET code = ?, name = ?, description = ?, category = ?, supplier = ?, stock_quantity = ?, min_stock = ?, cost_price = ?, sale_price = ? WHERE id = ?',
                [
                    code ? code.trim() : null,
                    name.trim(),
                    description ? description.trim() : null,
                    category ? category.trim() : null,
                    supplier ? supplier.trim() : null,
                    Number(stock_quantity) || 0,
                    Number(min_stock) || 0,
                    Number(cost_price) || 0,
                    Number(sale_price) || 0,
                    id
                ]
            );
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Peça não encontrada' });
            res.json({ message: 'Peça atualizada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar peça' });
        }
    },

    // Buscar histórico de movimentações da peça ou de todas
    getMovements: async (req, res) => {
        try {
            const { part_id } = req.query;
            let query = `
                SELECT m.*, i.name as part_name, i.code as part_code 
                FROM inventory_movements m
                JOIN inventory i ON m.part_id = i.id
            `;
            const params = [];

            if (part_id) {
                query += ' WHERE m.part_id = ?';
                params.push(part_id);
            }

            query += ' ORDER BY m.created_at DESC LIMIT 100';

            const [rows] = await db.query(query, params);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar movimentações' });
        }
    },

    // Ajustar estoque (entrada/saída)
    adjust: async (req, res) => {
        try {
            const { id } = req.params;
            const { quantity, type, obs } = req.body;

            if (!quantity || !type) {
                return res.status(400).json({ message: 'Quantidade e tipo são obrigatórios' });
            }

            // Iniciar transação
            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                // Obter estoque atual
                const [rows] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [id]);
                if (rows.length === 0) {
                    await connection.rollback();
                    return res.status(404).json({ message: 'Peça não encontrada' });
                }

                const currentStock = rows[0].stock_quantity;
                const newStock = type === 'entrada' ? currentStock + Number(quantity) : currentStock - Number(quantity);

                if (newStock < 0) {
                    await connection.rollback();
                    return res.status(400).json({ message: 'Estoque insuficiente' });
                }

                // Atualizar estoque
                await connection.query('UPDATE inventory SET stock_quantity = ? WHERE id = ?', [newStock, id]);

                // Registrar movimento
                await connection.query(
                    'INSERT INTO inventory_movements (part_id, type, quantity, obs) VALUES (?, ?, ?, ?)',
                    [id, type, Number(quantity), obs || 'Ajuste rápido']
                );

                await connection.commit();
                res.json({ message: 'Estoque ajustado com sucesso!', newStock });
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao ajustar estoque' });
        }
    },

    // Excluir peça
    remove: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Peça não encontrada' });
            }
            
            res.json({ message: 'Peça excluída com sucesso!' });
        } catch (error) {
            console.error(error);
            // Verifica se é erro de chave estrangeira
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: 'Não é possível excluir esta peça pois ela está sendo usada em Ordens de Serviço.' });
            }
            res.status(500).json({ message: 'Erro ao excluir peça' });
        }
    }
};

module.exports = inventoryController;
