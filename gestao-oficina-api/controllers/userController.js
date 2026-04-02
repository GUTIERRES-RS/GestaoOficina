const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');

const userController = {
    // List all users
    getAllUsers: async (req, res) => {
        try {
            const [users] = await db.query(
                'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY name'
            );
            res.json(users);
        } catch (error) {
            logger.error(`FETCH USERS ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao buscar usuários' });
        }
    },

    // Create a new user
    createUser: async (req, res) => {
        try {
            const userId = uuidv4();
            const { name, email, password, role } = req.body;

            // Check if email already exists
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Este e-mail já está em uso' });
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userRole = role || 'user';

            await db.query(
                'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                [userId, name, email, hashedPassword, userRole]
            );

            logger.info(`User Created: ${userId} (${email})`);
            res.status(201).json({ id: userId, name, email, role: userRole });
        } catch (error) {
            logger.error(`CREATE USER ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao cadastrar usuário' });
        }
    },

    // Update an existing user
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password, role } = req.body;

            // Check if another user has the same email
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Este e-mail já está em uso por outro usuário' });
            }

            let query = 'UPDATE users SET name = ?, email = ?, role = ?';
            const params = [name, email, role || 'user'];

            if (password && password.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                query += ', password = ?';
                params.push(hashedPassword);
            }

            query += ' WHERE id = ?';
            params.push(id);

            const [result] = await db.query(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            logger.info(`User Updated: ${id}`);
            res.json({ message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            logger.error(`UPDATE USER ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao atualizar usuário' });
        }
    },

    // Update own profile (name, email, password only)
    updateProfile: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password } = req.body;

            // Check if another user has the same email
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Este e-mail já está em uso por outro usuário' });
            }

            let query = 'UPDATE users SET name = ?, email = ?';
            const params = [name, email];

            if (password && password.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                query += ', password = ?';
                params.push(hashedPassword);
            }

            query += ' WHERE id = ?';
            params.push(id);

            const [result] = await db.query(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            logger.info(`Profile Updated: ${id}`);
            res.json({ message: 'Perfil atualizado com sucesso', user: { id, name, email } });
        } catch (error) {
            logger.error(`UPDATE PROFILE ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao atualizar perfil' });
        }
    },

    // Delete a user
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            logger.info(`User Deleted: ${id}`);
            res.json({ message: 'Usuário removido com sucesso' });
        } catch (error) {
            logger.error(`DELETE USER ERROR: ${error.stack}`);
            res.status(500).json({ message: 'Erro ao remover usuário' });
        }
    }
};

module.exports = userController;
