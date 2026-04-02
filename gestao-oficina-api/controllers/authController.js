const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../services/logger');

// Verificação de segurança na inicialização
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    logger.error('[AUTH:FATAL] JWT Secrets não configurados no arquivo .env');
    process.exit(1); 
}

/**
 * Controller de Autenticação
 * Gerencia o ciclo de vida de acesso: Login, Geração de Tokens (JWT) e Logout.
 */
const authController = {

    /**
     * Autenticar usuário e gerar tokens de acesso.
     * @param {Object} req - Objeto de requisição Express.
     * @param {Object} res - Objeto de resposta Express.
     */
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
            }

            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
            }

            const { accessToken, refreshToken } = authController.generateTokens(user);

            logger.info(`[AUTH:LOGIN] Usuário autenticado: ${user.email} (ID: ${user.id})`);
            
            res.json({
                success: true,
                data: {
                    user: { id: user.id, name: user.name, email: user.email, role: user.role },
                    token: accessToken,
                    refreshToken: refreshToken
                },
                message: 'Bem-vindo ao sistema!'
            });
        } catch (error) {
            logger.error(`[AUTH:LOGIN] Erro no processamento: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar autenticação' });
        }
    },

    /**
     * Renovar Access Token usando um Refresh Token válido.
     * @param {Object} req - Objeto de requisição Express.
     * @param {Object} res - Objeto de resposta Express.
     */
    refresh: async (req, res) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Token de atualização é obrigatório' });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
            
            if (rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Usuário não localizado' });
            }

            const user = rows[0];
            const tokens = authController.generateTokens(user);

            res.json({
                success: true,
                data: {
                    token: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                }
            });
        } catch (error) {
            logger.warn(`[AUTH:REFRESH] Tentativa de refresh inválida: ${error.message}`);
            res.status(401).json({ success: false, message: 'Sessão expirada. Faça login novamente.' });
        }
    },

    /**
     * Finalizar sessão do usuário.
     * @param {Object} req - Objeto de requisição Express.
     * @param {Object} res - Objeto de resposta Express.
     */
    logout: async (req, res) => {
        logger.info(`[AUTH:LOGOUT] Encerrando sessão para ID: ${req.user?.id}`);
        res.json({ success: true, message: 'Sessão encerrada com sucesso' });
    },

    /**
     * Utilitário para emissão de novos tokens JWT.
     * @param {Object} user - Objeto do usuário do banco de dados.
     * @returns {Object} { accessToken, refreshToken }
     * @private
     */
    generateTokens: (user) => {
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        return { accessToken, refreshToken };
    }
};

module.exports = authController;
