const pool = require('../config/database');

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

    update: async (req, res) => {
        try {
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
                next_os_number
            } = req.body;

            await pool.query(`
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
                next_os_number = ?
                WHERE id = 1
            `, [
                workshop_name, workshop_phone, workshop_email, workshop_address, workshop_document,
                theme, currency, logo_url, whatsapp, review_days, next_os_number
            ]);

            res.json({ message: 'Configurações atualizadas com sucesso!' });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Erro ao atualizar configurações' });
        }
    }
};

module.exports = settingsController;
