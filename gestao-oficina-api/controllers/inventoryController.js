const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

const inventoryController = {
    // Obter todo o estoque
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM inventory ORDER BY name ASC');
            res.json(rows);
        } catch (error) {
            logger.error(`FETCH INVENTORY ERROR: ${error.stack}`);
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
            logger.error(`GET OS PART ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao buscar peça' });
        }
    },

    // Criar nova peça
    create: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const partId = uuidv4();
            const { code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price, unit } = req.body;

            await connection.query(
                'INSERT INTO inventory (id, code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    partId,
                    code ? code.trim() : null,
                    name.trim(),
                    description ? description.trim() : null,
                    category ? category.trim() : null,
                    supplier ? supplier.trim() : null,
                    Number(stock_quantity) || 0,
                    Number(min_stock) || 0,
                    Number(cost_price) || 0,
                    Number(sale_price) || 0,
                    unit || 'un'
                ]
            );

            // Registrar movimento inicial caso stock_quantity > 0
            if (Number(stock_quantity) > 0) {
                await connection.query(
                    'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), partId, 'entrada', Number(stock_quantity), 'Estoque inicial']
                );
            }

            await connection.commit();
            logger.info(`Inventory Item Created: ${partId} - ${name}`);
            res.status(201).json({ id: partId, message: 'Peça cadastrada com sucesso!' });
        } catch (error) {
            await connection.rollback();
            logger.error(`CREATE INVENTORY ITEM ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao cadastrar peça' });
        } finally {
            connection.release();
        }
    },

    // Atualizar peça
    update: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price, unit } = req.body;

            // Verifica diferença de estoque para lançar movimentação
            const [[currentPart]] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [id]);
            if (currentPart) {
                const diff = Number(stock_quantity) - currentPart.stock_quantity;
                if (diff !== 0) {
                    await connection.query(
                        'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                        [uuidv4(), id, diff > 0 ? 'entrada' : 'saida', Math.abs(diff), 'Ajuste manual de estoque']
                    );
                }
            }

            const [result] = await connection.query(
                'UPDATE inventory SET code = ?, name = ?, description = ?, category = ?, supplier = ?, stock_quantity = ?, min_stock = ?, cost_price = ?, sale_price = ?, unit = ? WHERE id = ?',
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
                    unit || 'un',
                    id
                ]
            );

            await connection.commit();
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Peça não encontrada' });
            logger.info(`Inventory Item Updated: ${id}`);
            res.json({ message: 'Peça atualizada com sucesso!' });
        } catch (error) {
            await connection.rollback();
            logger.error(`UPDATE INVENTORY ITEM ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao atualizar peça' });
        } finally {
            connection.release();
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
            logger.error(`GET MOVEMENTS ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao buscar movimentações' });
        }
    },

    // Ajustar estoque (entrada/saída)
    adjust: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { quantity, type, obs } = req.body;

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
                'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), id, type, Number(quantity), obs || 'Ajuste rápido']
            );

            await connection.commit();
            logger.info(`Inventory Adjusted: ${id} - ${type}: ${quantity}`);
            res.json({ message: 'Estoque ajustado com sucesso!', newStock });
        } catch (error) {
            await connection.rollback();
            logger.error(`ADJUST STOCK ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao ajustar estoque' });
        } finally {
            connection.release();
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
            logger.info(`Inventory Item Deleted: ${id}`);
            res.json({ message: 'Peça excluída com sucesso!' });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: 'Não é possível excluir esta peça pois ela está sendo usada em Ordens de Serviço.' });
            }
            logger.error(`DELETE INVENTORY ITEM ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao excluir peça' });
        }
    }
};

module.exports = inventoryController;
