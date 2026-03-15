const db = require('../config/database');

const vehicleController = {

    // Obter TODOS os veículos (com nome do dono e contagem de OS)
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT 
                    v.*,
                    c.name as client_name,
                    c.phone as client_phone,
                    COALESCE((
                        SELECT COUNT(*) FROM service_orders so 
                        WHERE so.vehicle_id = v.id
                    ), 0) as total_os,
                    COALESCE((
                        SELECT COUNT(*) FROM service_orders so 
                        WHERE so.vehicle_id = v.id 
                        AND so.status NOT IN ('Finalizado', 'Entregue', 'Cancelado')
                    ), 0) as os_abertas,
                    COALESCE((
                        SELECT SUM(total_cost) FROM service_orders so 
                        WHERE so.vehicle_id = v.id 
                        AND so.status != 'Cancelado'
                    ), 0) as total_faturado
                FROM vehicles v
                LEFT JOIN clients c ON v.client_id = c.id
                ORDER BY v.created_at DESC
            `);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar veículos' });
        }
    },

    // Obter veículos de um cliente específico
    getByClient: async (req, res) => {
        try {
            const { clientId } = req.params;
            const [rows] = await db.query('SELECT * FROM vehicles WHERE client_id = ?', [clientId]);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao buscar veículos do cliente' });
        }
    },

    // Criar novo veículo
    create: async (req, res) => {
        try {
            const { client_id, plate, brand, model, year, color, km_cad, notes } = req.body;

            if (!client_id || !plate || !brand || !model) {
                return res.status(400).json({ message: 'Cliente, placa, marca e modelo são obrigatórios' });
            }

            const [result] = await db.query(
                'INSERT INTO vehicles (client_id, plate, brand, model, year, color, km_cad, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    client_id,
                    plate.trim().toUpperCase(),
                    brand.trim(),
                    model.trim(),
                    year ? year.toString().trim() : null,
                    color ? color.trim() : null,
                    km_cad ? parseInt(km_cad) : 0,
                    notes ? notes.trim() : null
                ]
            );
            res.status(201).json({ id: result.insertId, message: 'Veículo criado com sucesso!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Esta placa já está cadastrada' });
            }
            console.error(error);
            res.status(500).json({ message: 'Erro ao criar veículo' });
        }
    },

    // Atualizar veículo
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { plate, brand, model, year, color, km_cad, notes } = req.body;

            if (!plate || !brand || !model) {
                return res.status(400).json({ message: 'Placa, marca e modelo são obrigatórios' });
            }

            const [result] = await db.query(
                'UPDATE vehicles SET plate = ?, brand = ?, model = ?, year = ?, color = ?, km_cad = ?, notes = ? WHERE id = ?',
                [
                    plate.trim().toUpperCase(),
                    brand.trim(),
                    model.trim(),
                    year ? year.toString().trim() : null,
                    color ? color.trim() : null,
                    km_cad ? parseInt(km_cad) : 0,
                    notes ? notes.trim() : null,
                    id
                ]
            );
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Veículo não encontrado' });
            res.json({ message: 'Veículo atualizado com sucesso!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Esta placa já pertence a outro veículo' });
            }
            console.error(error);
            res.status(500).json({ message: 'Erro ao atualizar veículo' });
        }
    },

    // Excluir veículo
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Veículo não encontrado' });
            res.json({ message: 'Veículo removido com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao remover veículo' });
        }
    }
};

module.exports = vehicleController;
