require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const API_PORT = process.env.API_PORT || 3000;
const fs = require('fs');
const path = require('path');

const logToFile = (message) => {
    const logPath = path.join(__dirname, 'debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[SERVER][${timestamp}] ${message}\n`);
};

// Middleware
app.use(cors());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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

// Import Middleware
const authMiddleware = require('./middleware/authMiddleware');

console.log('Mounting routes...');
// Public routes
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API Gestão Oficina rodando perfeitamente!' });
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
console.log('Routes mounted: clients, os, inventory, finances, dashboard, vehicles, settings, mechanics, users');


const https = require('https');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno no servidor', message: err.message });
});

if (process.env.USE_HTTPS === 'true') {
    try {
        const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH || '', 'utf8');
        const certificate = fs.readFileSync(process.env.SSL_CERT_PATH || '', 'utf8');
        const credentials = { key: privateKey, cert: certificate };

        const httpsServer = https.createServer(credentials, app);
        httpsServer.listen(API_PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor HTTPS seguro rodando na porta ${API_PORT}`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor HTTPS (verifique os certificados definidos no .env):', error.message);
        console.log('Iniciando em modo HTTP como fallback de emergência...');
        app.listen(API_PORT, '0.0.0.0', () => {
             console.log(`🚀 Servidor HTTP rodando na porta ${API_PORT}`);
        });
    }
} else {
    app.listen(API_PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor HTTP rodando na porta ${API_PORT}`);
    });
}
