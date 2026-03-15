const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const logToFile = (message) => {
    const logPath = path.join(__dirname, '..', 'debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
};

const settingsController = {
    get: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
            res.json(rows[0] || {});
        } catch (error) {
            console.error('Error fetching settings:', error);
            res.status(500).json({ error: 'Erro ao buscar configurações' });
        }
    },
    
    getPublic: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT workshop_name, logo_url, theme FROM settings WHERE id = 1');
            res.json(rows[0] || {});
        } catch (error) {
            console.error('Error fetching public settings:', error);
            res.status(500).json({ error: 'Erro ao buscar configurações públicas' });
        }
    },

    update: async (req, res) => {
        try {
            // 1. Fetch current settings to have fallbacks
            const [currentRows] = await pool.query('SELECT * FROM settings WHERE id = 1');
            const current = currentRows[0] || {};

            const {
                workshop_name,
                workshop_phone,
                workshop_email,
                workshop_address,
                workshop_document,
                theme,
                currency,
                logo_url,
                whatsapp,
                review_days,
                next_os_number,
                items_per_page
            } = req.body;

            const updateQuery = `
                UPDATE settings SET 
                workshop_name = ?, 
                workshop_phone = ?, 
                workshop_email = ?, 
                workshop_address = ?, 
                workshop_document = ?,
                theme = ?,
                currency = ?,
                logo_url = ?,
                whatsapp = ?,
                review_days = ?,
                next_os_number = ?,
                items_per_page = ?
                WHERE id = 1
            `;

            const parsedItemsPerPage = items_per_page !== undefined && items_per_page !== null && items_per_page !== '' 
                ? parseInt(items_per_page) 
                : current.items_per_page;
            
            const parsedReviewDays = review_days !== undefined && review_days !== null && review_days !== ''
                ? parseInt(review_days)
                : current.review_days;

            const parsedNextOs = next_os_number !== undefined && next_os_number !== null && next_os_number !== ''
                ? parseInt(next_os_number)
                : current.next_os_number;

            const values = [
                workshop_name !== undefined ? workshop_name : current.workshop_name,
                workshop_phone !== undefined ? workshop_phone : current.workshop_phone,
                workshop_email !== undefined ? workshop_email : current.workshop_email,
                workshop_address !== undefined ? workshop_address : current.workshop_address,
                workshop_document !== undefined ? workshop_document : current.workshop_document,
                theme !== undefined ? theme : current.theme,
                currency !== undefined ? currency : current.currency,
                logo_url !== undefined ? logo_url : current.logo_url,
                whatsapp !== undefined ? whatsapp : current.whatsapp,
                !isNaN(parsedReviewDays) ? parsedReviewDays : (current.review_days || 0),
                !isNaN(parsedNextOs) ? parsedNextOs : (current.next_os_number || 1),
                !isNaN(parsedItemsPerPage) ? parsedItemsPerPage : (current.items_per_page || 10)
            ];
            
            await pool.query(updateQuery, values);

            res.json({ message: 'Configurações atualizadas com sucesso!' });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações', details: error.message });
        }
    }
};

module.exports = settingsController;
