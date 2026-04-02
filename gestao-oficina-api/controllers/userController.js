const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');

/**
 * Controller de Usuários
 * Gerencia o controle de acesso (RBAC), perfis e credenciais da equipe administrativa.
 */
const userController = {

    /**
     * Listar todos os usuários do sistema.
     * @returns {Object} JSON com lista de usuários.
     */
    getAllUsers: async (req, res) => {
        try {
            const [users] = await db.query(
                'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY name'
            );
            res.json({ success: true, data: users });
        } catch (error) {
            logger.error(`[USER:LIST] Falha ao buscar usuários: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao carregar lista de usuários' });
        }
    },

    /**
     * Criar um novo usuário com senha criptografada.
     * @param {Object} req - Request contendo dados do usuário.
     * @returns {Object} JSON com status da criação.
     */
    createUser: async (req, res) => {
        try {
            const userId = uuidv4();
            const { name, email, password, role } = req.body;

            // Verificação de unicidade de e-mail
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Este endereço de e-mail já está registrado' });
            }

            // Hashing de segurança
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userRole = role || 'user';

            await db.query(
                'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                [userId, name, email, hashedPassword, userRole]
            );

            logger.info(`[USER:CREATE] Novo usuário: ${userId} (${email}) - Cargo: ${userRole}`);
            res.status(201).json({ 
                success: true, 
                data: { name, email, role: userRole },
                message: 'Usuário cadastrado com sucesso!' 
            });
        } catch (error) {
            logger.error(`[USER:CREATE] Erro no cadastro de ${req.body.email}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar cadastro de usuário' });
        }
    },

    /**
     * Atualizar dados de um usuário específico (Administrativo).
     */
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password, role } = req.body;

            // Validar se e-mail já existe em outro ID
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'E-mail em uso por outro colaborador' });
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
                return res.status(404).json({ success: false, message: 'Usuário não localizado para alteração' });
            }

            logger.info(`[USER:UPDATE] Usuário editado: ${id}`);
            res.json({ success: true, message: 'Dados do colaborador atualizados!' });
        } catch (error) {
            logger.error(`[USER:UPDATE] Erro na edição de ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao salvar alterações do usuário' });
        }
    },

    /**
     * Atualização de perfil pelo próprio usuário logado.
     */
    updateProfile: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password } = req.body;

            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Este e-mail já está sendo utilizado' });
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
                return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
            }

            logger.info(`[USER:PROFILE] Perfil atualizado: ${id}`);
            res.json({ 
                success: true, 
                message: 'Seu perfil foi atualizado com sucesso!',
                data: { id, name, email } 
            });
        } catch (error) {
            logger.error(`[USER:PROFILE] Erro ao atualizar perfil ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao atualizar dados do perfil' });
        }
    },

    /**
     * Remover um usuário permanentemente.
     */
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
            }

            logger.info(`[USER:DELETE] Usuário removido: ${id}`);
            res.json({ success: true, message: 'Colaborador removido do sistema' });
        } catch (error) {
            logger.error(`[USER:DELETE] Erro ao remover usuário ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Falha técnica ao excluir usuário' });
        }
    }
};

module.exports = userController;
