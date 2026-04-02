const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

/**
 * Controller de Clientes
 * Gerencia todas as operações de CRUD para a entidade de clientes.
 * NOTA: Utiliza UUID v4 como identificador primário para todas as operações.
 */
const clientController = {
    
    /**
     * Obter lista completa de clientes com seus respectivos veículos.
     * @param {Object} req - Request do Express.
     * @param {Object} res - Response do Express.
     */
    getAll: async (req, res) => {
        try {
            const query = `
                SELECT c.*, 
                GROUP_CONCAT(CONCAT(v.id, '::', v.brand, '::', v.model, '::', v.plate, '::', IFNULL(v.year, ''), '::', IFNULL(v.color, ''), '::', IFNULL(v.km_cad, '')) SEPARATOR '|') as vehicles
                FROM clients c
                LEFT JOIN vehicles v ON c.id = v.client_id
                GROUP BY c.id
                ORDER BY c.name ASC
            `;
            const [rows] = await db.query(query);

            // Converter a string do GROUP_CONCAT em array de objetos (Parseamento de veículos)
            const clients = rows.map(client => {
                let parsedVehicles = [];
                if (client.vehicles) {
                    parsedVehicles = client.vehicles.split('|').map(v => {
                        const [id, brand, model, plate, year, color, km_cad] = v.split('::');
                        return { id, brand, model, plate, year, color, km_cad: km_cad ? parseInt(km_cad, 10) : null };
                    });
                }
                return {
                    ...client,
                    vehicles: parsedVehicles
                };
            });

            res.json(clients);
        } catch (error) {
            logger.error(`[CLIENTS] Erro ao buscar lista completa: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar clientes' });
        }
    },

    /**
     * Obter um cliente específico pelo seu identificador UUID.
     * @param {Object} req - Request contendo :id (UUID) nos parâmetros.
     */
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
            }

            res.json(rows[0]);
        } catch (error) {
            logger.error(`[CLIENTS] Erro ao buscar cliente por ID (${req.params.id}): ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao buscar dados do cliente' });
        }
    },

    /**
     * Cadastrar um novo cliente gerando um ID UUID v4 único.
     * @param {Object} req - Request contendo dados do cliente no body.
     */
    create: async (req, res) => {
        try {
            // Geração obrigatória de identificador UUID (Nenhum ID sequencial exposto)
            const clientId = uuidv4();
            const { name, phone, email, document, address, notes } = req.body;

            await db.query(
                'INSERT INTO clients (id, name, phone, email, document, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    clientId,
                    name.trim(),
                    phone.trim(),
                    email ? email.trim() : null,
                    document ? document.trim() : null,
                    address ? address.trim() : null,
                    notes ? notes.trim() : null
                ]
            );

            logger.info(`DATABASE: Cliente criado com UUID: ${clientId}`);
            res.status(201).json({ 
                success: true,
                id: clientId, 
                message: 'Cliente criado com sucesso!' 
            });
        } catch (error) {
            logger.error(`[CLIENTS] Erro na criação de cliente: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar criação de cliente' });
        }
    },

    /**
     * Atualizar dados cadastrais de um cliente existente.
     * @param {Object} req - Request contendo :id (UUID) e novos dados.
     */
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, email, document, address, notes } = req.body;

            const [result] = await db.query(
                'UPDATE clients SET name = ?, phone = ?, email = ?, document = ?, address = ?, notes = ? WHERE id = ?',
                [
                    name.trim(),
                    phone.trim(),
                    email ? email.trim() : null,
                    document ? document.trim() : null,
                    address ? address.trim() : null,
                    notes ? notes.trim() : null,
                    id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado para atualização' });
            }

            logger.info(`DATABASE: Cliente atualizado: ${id}`);
            res.json({ success: true, message: 'Cliente atualizado com sucesso!' });
        } catch (error) {
            logger.error(`[CLIENTS] Erro na atualização de cliente: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao atualizar dados do cliente' });
        }
    },

    /**
     * Excluir um cliente e seus registros vinculados (Veículos e OS).
     * @param {Object} req - Request contendo :id (UUID).
     */
    delete: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;

            // Limpeza manual para garantir integridade (Algumas FKs podem não ter ON DELETE CASCADE)
            await connection.query('DELETE FROM service_orders WHERE client_id = ?', [id]);
            await connection.query('DELETE FROM vehicles WHERE client_id = ?', [id]);
            const [result] = await connection.query('DELETE FROM clients WHERE id = ?', [id]);

            await connection.commit();

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado para exclusão' });
            }

            logger.info(`DATABASE: Cliente removido permanentemente: ${id}`);
            res.json({ success: true, message: 'Cliente e todos os seus registros excluídos com sucesso!' });
        } catch (error) {
            await connection.rollback();
            logger.error(`[CLIENTS] Erro na exclusão de cliente: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Falha ao processar exclusão do cliente e registros vinculados.' });
        } finally {
            connection.release();
        }
    }
};

module.exports = clientController;
