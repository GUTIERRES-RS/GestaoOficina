const db = require('../config/database');

const clientController = {
    // Obter todos os clientes
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

            // Converter a string do GROUP_CONCAT em array de objetos
            const clients = rows.map(client => {
                let parsedVehicles = [];
                if (client.vehicles) {
                    parsedVehicles = client.vehicles.split('|').map(v => {
                        const [id, brand, model, plate, year, color, km_cad] = v.split('::');
                        return { id: parseInt(id, 10), brand, model, plate, year, color, km_cad: km_cad ? parseInt(km_cad, 10) : null };
                    });
                }
                return {
                    ...client,
                    vehicles: parsedVehicles
                };
            });

            res.json(clients);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar clientes' });
        }
    },

    // Obter um cliente por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Cliente não encontrado' });
            res.json(rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar cliente' });
        }
    },

    // Criar novo cliente
    create: async (req, res) => {
        try {
            const { name, phone, email, document, address, notes } = req.body;

            // Validação básica
            if (!name || !phone) {
                return res.status(400).json({ message: 'Nome e telefone são obrigatórios' });
            }

            const [result] = await db.query(
                'INSERT INTO clients (name, phone, email, document, address, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    name.trim(),
                    phone.trim(),
                    email ? email.trim() : null,
                    document ? document.trim() : null,
                    address ? address.trim() : null,
                    notes ? notes.trim() : null
                ]
            );
            res.status(201).json({ id: result.insertId, message: 'Cliente criado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao criar cliente' });
        }
    },

    // Atualizar cliente
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, email, document, address, notes } = req.body;

            if (!name || !phone) {
                return res.status(400).json({ message: 'Nome e telefone são obrigatórios' });
            }

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
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente não encontrado' });
            res.json({ message: 'Cliente atualizado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar cliente' });
        }
    },

    // Deletar cliente e dependências
    delete: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;

            // 1. Deletar transações atreladas às OS deste cliente (opcional base dependendo da modelagem)
            // Aqui assumimos que a tabela service_orders tem client_id

            // 2. Deletar Ordens de Serviço vinculadas ao cliente
            await connection.query('DELETE FROM service_orders WHERE client_id = ?', [id]);

            // 3. Deletar Veículos vinculados ao cliente
            await connection.query('DELETE FROM vehicles WHERE client_id = ?', [id]);

            // 4. Finalmente, deletar o cliente
            const [result] = await connection.query('DELETE FROM clients WHERE id = ?', [id]);

            await connection.commit();

            if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente não encontrado' });
            res.json({ message: 'Cliente e todos os seus registros excluídos com sucesso!' });
        } catch (error) {
            await connection.rollback();
            console.error('Erro na Exclusão em Cascata do Cliente:', error);
            res.status(500).json({ message: 'Erro ao deletar cliente. Verifique as dependências ativas.' });
        } finally {
            connection.release();
        }
    }
};

module.exports = clientController;
