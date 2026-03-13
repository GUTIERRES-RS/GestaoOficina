require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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
    res.json({ status: 'ok', message: 'API Gestão Oficina Pro rodando perfeitamente!' });
});
app.use('/api/settings', (req, res, next) => {
    console.log('Public settings route hit');
    next();
}, publicSettingsRoutes);

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


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno no servidor', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
