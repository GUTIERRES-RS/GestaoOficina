const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

/**
 * Controller de Inventário
 * Responsável pela gestão de peças, controle de estoque e histórico de movimentações.
 */
const inventoryController = {

    /**
     * Listar todos os itens do estoque.
     */
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM inventory ORDER BY name ASC');
            res.json({ success: true, data: rows });
        } catch (error) {
            logger.error(`[INVENTORY:LIST] Erro ao buscar estoque: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar catálogo de peças' });
        }
    },

    /**
     * Buscar detalhes de uma peça específica pelo ID.
     */
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Peça não encontrada no sistema' });
            }
            
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            logger.error(`[INVENTORY:GET] Erro ao buscar peça ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar consulta de peça' });
        }
    },

    /**
     * Criar novo item no estoque.
     * Inclui registro automático de movimentação inicial se houver estoque.
     */
    create: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const partId = uuidv4();
            const { code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price, unit, brand } = req.body;

            await connection.query(
                `INSERT INTO inventory (
                    id, code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price, unit, brand
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    unit || 'un',
                    brand || null
                ]
            );

            // LOG DE MOVIMENTAÇÃO: Entrada Inicial
            if (Number(stock_quantity) > 0) {
                await connection.query(
                    'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), partId, 'entrada', Number(stock_quantity), 'Saldo inicial de cadastro']
                );
            }

            await connection.commit();
            logger.info(`[INVENTORY:CREATE] Item criado: ${partId} (${name})`);
            
            res.status(201).json({ 
                success: true, 
                id: partId, 
                message: 'Peça cadastrada com sucesso e saldo inicial registrado!' 
            });
        } catch (error) {
            await connection.rollback();
            logger.error(`[INVENTORY:CREATE] Falha no cadastro: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao cadastrar peça no estoque' });
        } finally {
            connection.release();
        }
    },

    /**
     * Atualizar dados da peça e ajustar estoque se houver divergência manual.
     */
    update: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { code, name, description, category, supplier, stock_quantity, min_stock, cost_price, sale_price, unit, brand } = req.body;

            // Comparar estoque atual para log de auditoria
            const [[current]] = await connection.query('SELECT stock_quantity FROM inventory WHERE id = ?', [id]);
            if (!current) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Item não localizado para atualização' });
            }

            const diff = Number(stock_quantity) - current.stock_quantity;
            if (diff !== 0) {
                await connection.query(
                    'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), id, diff > 0 ? 'entrada' : 'saida', Math.abs(diff), 'Ajuste manual via edição de produto']
                );
                logger.warn(`[INVENTORY:ADJUST] Ajuste de estoque detectado na edição: ${id} (Dif: ${diff})`);
            }

            await connection.query(
                `UPDATE inventory SET 
                    code = ?, name = ?, description = ?, category = ?, supplier = ?, 
                    stock_quantity = ?, min_stock = ?, cost_price = ?, sale_price = ?, unit = ?, brand = ? 
                WHERE id = ?`,
                [
                    code ? code.trim() : null, name.trim(), description ? description.trim() : null,
                    category ? category.trim() : null, supplier ? supplier.trim() : null,
                    Number(stock_quantity) || 0, Number(min_stock) || 0, Number(cost_price) || 0,
                    Number(sale_price) || 0, unit || 'un', brand || null, id
                ]
            );

            await connection.commit();
            logger.info(`[INVENTORY:UPDATE] Item editado: ${id}`);
            res.json({ success: true, message: 'Dados da peça atualizados com sucesso!' });
        } catch (error) {
            await connection.rollback();
            logger.error(`[INVENTORY:UPDATE] Erro na edição de ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao atualizar dados do estoque' });
        } finally {
            connection.release();
        }
    },

    /**
     * Consultar histórico de movimentações (Entradas/Saídas).
     */
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
            res.json({ success: true, data: rows });
        } catch (error) {
            logger.error(`[INVENTORY:MOVEMENTS] Erro ao buscar histórico: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar histórico de movimentações' });
        }
    },

    /**
     * Ajuste rápido de estoque (Entrada/Saída pontual).
     */
    adjust: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;
            const { quantity, type, obs } = req.body;

            const [[item]] = await connection.query('SELECT stock_quantity, name FROM inventory WHERE id = ?', [id]);
            if (!item) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Item não encontrado' });
            }

            const currentStock = item.stock_quantity;
            const qty = Number(quantity);
            const newStock = type === 'entrada' ? currentStock + qty : currentStock - qty;

            if (newStock < 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: `Estoque insuficiente para essa saída (Atual: ${currentStock})` });
            }

            // Atualização do Saldo
            await connection.query('UPDATE inventory SET stock_quantity = ? WHERE id = ?', [newStock, id]);

            // Registro no Histórico
            const moveId = uuidv4();
            await connection.query(
                'INSERT INTO inventory_movements (id, part_id, type, quantity, obs) VALUES (?, ?, ?, ?, ?)',
                [moveId, id, type, qty, obs || `Ajuste manual (${type})`]
            );

            await connection.commit();
            logger.info(`[INVENTORY:ADJUST] ${type.toUpperCase()} de ${qty} un em ${id} (${item.name}). Novo saldo: ${newStock}`);
            
            res.json({ 
                success: true, 
                message: 'Estoque ajustado com sucesso!', 
                data: { newStock, movement_id: moveId } 
            });
        } catch (error) {
            await connection.rollback();
            logger.error(`[INVENTORY:ADJUST] Erro ao ajustar estoque ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Falha ao processar ajuste de estoque' });
        } finally {
            connection.release();
        }
    },

    /**
     * Remover item do catálogo.
     * Bloqueado se houver referências em movimentações de OS.
     */
    remove: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Peça não encontrada para exclusão' });
            }
            
            logger.info(`[INVENTORY:DELETE] Item removido: ${id}`);
            res.json({ success: true, message: 'Item removido do estoque com sucesso!' });
        } catch (error) {
            // Tratamento de integridade referencial do MySQL
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ success: false, message: 'Impossível excluir: Esta peça já foi utilizada em Ordens de Serviço.' });
            }
            logger.error(`[INVENTORY:DELETE] Erro ao remover ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao excluir item do estoque' });
        }
    }
};

module.exports = inventoryController;
