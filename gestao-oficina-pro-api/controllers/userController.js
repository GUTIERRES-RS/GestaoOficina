const db = require('../config/database');
const bcrypt = require('bcryptjs');

const userController = {
    // List all users
    getAllUsers: async (req, res) => {
        try {
            const [users] = await db.query(
                'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY name'
            );
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
        }
    },

    // Create a new user
    createUser: async (req, res) => {
        try {
            const { name, email, password, role } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
            }

            // Check if email already exists
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Este e-mail já está em uso' });
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Default role to 'user' if not provided correctly
            const userRole = (role === 'admin' || role === 'user') ? role : 'user';

            const [result] = await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, userRole]
            );

            res.status(201).json({ id: result.insertId, name, email, role: userRole });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ message: 'Erro ao cadastrar usuário', error: error.message });
        }
    },

    // Update an existing user
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password, role } = req.body;

            if (!name || !email) {
                return res.status(400).json({ message: 'Nome e email são obrigatórios' });
            }

            // Check if another user has the same email
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Este e-mail já está em uso por outro usuário' });
            }

            const userRole = (role === 'admin' || role === 'user') ? role : 'user';
            
            let query = 'UPDATE users SET name = ?, email = ?, role = ?';
            const params = [name, email, userRole];

            // Only update password if one is provided
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

            res.json({ message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
        }
    },

    // Update own profile (name, email, password only)
    updateProfile: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password } = req.body;

            if (!name || !email) {
                return res.status(400).json({ message: 'Nome e email são obrigatórios' });
            }

            // Check if another user has the same email
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Este e-mail já está em uso por outro usuário' });
            }

            let query = 'UPDATE users SET name = ?, email = ?';
            const params = [name, email];

            // Only update password if one is provided
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

            res.json({ message: 'Perfil atualizado com sucesso', user: { id, name, email } });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ message: 'Erro ao atualizar perfil', error: error.message });
        }
    },

    // Delete a user
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            // Optional: prevent deleting the last admin, but keeping it simple for now
            // Just delete the user
            const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            res.json({ message: 'Usuário removido com sucesso' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Erro ao remover usuário', error: error.message });
        }
    }
};

module.exports = userController;
