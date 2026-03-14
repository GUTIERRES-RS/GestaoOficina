const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Token de autenticação não fornecido',
            message: 'Token de autenticação não fornecido'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ 
            error: 'Erro no formato do token',
            message: 'Erro no formato do token'
        });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ 
            error: 'Token malformatado',
            message: 'Token malformatado'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                error: 'Token inválido ou expirado',
                message: 'Sua sessão expirou. Por favor, faça login novamente.'
            });
        }

        req.userId = decoded.id;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        req.userName = decoded.name;
        
        return next();
    });
};

module.exports = authMiddleware;
