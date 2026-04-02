require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const logger = require('./services/logger');
const authMiddleware = require('./middleware/authMiddleware');



const app = express();
const API_PORT = process.env.API_PORT || 3000;

// Security Middlewares
app.use(helmet()); // Secure HTTP headers
app.use(xss()); // XSS Sanitization

// Rate Limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(generalLimiter);
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    next();
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const osRoutes = require('./routes/osRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const financeRoutes = require('./routes/financeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const publicSettingsRoutes = require('./routes/publicSettingsRoutes');
const mechanicRoutes = require('./routes/mechanicRoutes');
const userRoutes = require('./routes/userRoutes');

// Public routes
app.use('/api/auth', loginLimiter, authRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API Gestão Oficina rodando com segurança máxima!', timestamp: new Date().toISOString() });
});
app.use('/api/settings/public', publicSettingsRoutes);

// Protected routes
app.use(authMiddleware);
app.use('/api/clients', clientRoutes);
app.use('/api/os', osRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        error: 'Erro interno no servidor',
        message: process.env.NODE_ENV === 'production' ? 'Algo deu errado.' : err.message
    });
});

// HTTPS / HTTP Server Logic
const startServer = async () => {
    if (process.env.USE_HTTPS === 'true') {
        let credentials;
        try {
            const keyPath = process.env.SSL_KEY_PATH;
            const certPath = process.env.SSL_CERT_PATH;

            if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
                const privateKey = fs.readFileSync(keyPath, 'utf8');
                const certificate = fs.readFileSync(certPath, 'utf8');
                credentials = { key: privateKey, cert: certificate };
                logger.info('Usando certificados SSL existentes.');
            } else {
                logger.info('Certificados SSL não encontrados ou caminhos não definidos. Gerando certificado auto-assinado...');
                const attrs = [{ name: 'commonName', value: 'localhost' }];
                const pems = selfsigned.generate(attrs, { days: 365 });
                credentials = { key: pems.private, cert: pems.cert };
            }

            const httpsServer = https.createServer(credentials, app);
            httpsServer.listen(API_PORT, '0.0.0.0', () => {
                logger.info(`🚀 Servidor HTTPS seguro rodando na porta ${API_PORT}`);
            });
        } catch (error) {
            logger.error(`❌ Erro ao iniciar servidor HTTPS: ${error.message}`);
            app.listen(API_PORT, '0.0.0.0', () => {
                logger.info(`🚀 Servidor HTTP rodando na porta ${API_PORT} (Fallback)`);
            });
        }
    } else {
        app.listen(API_PORT, '0.0.0.0', () => {
            logger.info(`🚀 Servidor HTTP rodando na porta ${API_PORT}`);
        });
    }
};

startServer();
