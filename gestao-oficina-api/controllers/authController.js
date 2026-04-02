const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'oficina_refresh_secret_2026_premium';

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            logger.warn(`Failed login attempt for email: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Store refresh token in DB
        await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

        logger.info(`User Logged In: ${user.id} (${user.email})`);

        res.json({
            message: 'Login realizado com sucesso',
            token: accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error(`LOGIN ERROR: ${error.stack}`);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh Token não fornecido' });

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const [users] = await db.query('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [decoded.id, refreshToken]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ error: 'Refresh Token inválido ou revogado' });
        }

        const tokens = generateTokens(user);
        await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

        res.json({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        logger.error(`REFRESH TOKEN ERROR: ${error.stack}`);
        res.status(401).json({ error: 'Refresh Token expirado ou inválido' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { id } = req.user;
        await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [id]);
        logger.info(`User Logged Out: ${id}`);
        res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        logger.error(`LOGOUT ERROR: ${error.stack}`);
        res.status(500).json({ error: 'Erro ao realizar logout' });
    }
};
