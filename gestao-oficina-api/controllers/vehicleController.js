const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../services/logger');

/**
 * Controller de Veículos
 * Gerencia o cadastro de frotas, histórico de KM e vinculação com proprietários (clientes).
 */
const vehicleController = {

    /**
     * Listar todos os veículos com dados agregados de faturamento e OS.
     * @route GET /vehicles
     */
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
            res.json({ success: true, data: rows });
        } catch (error) {
            logger.error(`[VEHICLE:LIST] Erro ao buscar catálogo: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar lista de veículos' });
        }
    },

    /**
     * Listar veículos vinculados a um cliente específico.
     * @param {Object} req - Params: clientId (UUID).
     * @route GET /vehicles/client/:clientId
     */
    getByClient: async (req, res) => {
        try {
            const { clientId } = req.params;
            const [rows] = await db.query('SELECT * FROM vehicles WHERE client_id = ?', [clientId]);
            res.json({ success: true, data: rows });
        } catch (error) {
            logger.error(`[VEHICLE:CLIENT] Erro ao buscar frota do cliente ${req.params.clientId}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao localizar veículos deste cliente' });
        }
    },

    /**
     * Cadastrar um novo veículo no sistema.
     * @route POST /vehicles
     */
    create: async (req, res) => {
        try {
            const vehicleId = uuidv4();
            const { client_id, plate, brand, model, year, color, km_cad, notes, vin } = req.body;

            await db.query(
                `INSERT INTO vehicles (id, client_id, plate, brand, model, year, color, km_cad, notes, vin) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    vehicleId,
                    client_id,
                    plate.trim().toUpperCase(),
                    brand.trim(),
                    model.trim(),
                    year ? year.toString().trim() : null,
                    color ? color.trim() : null,
                    km_cad ? parseInt(km_cad) : 0,
                    notes ? notes.trim() : null,
                    vin ? vin.trim() : null
                ]
            );

            logger.info(`[VEHICLE:CREATE] Veículo ${vehicleId} (${plate}) vinculado ao cliente ${client_id}`);
            res.status(201).json({ 
                success: true, 
                id: vehicleId, 
                message: 'Veículo cadastrado com sucesso!' 
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Conflito: Esta placa já possui registro ativo no sistema.' });
            }
            logger.error(`[VEHICLE:CREATE] Erro ao cadastrar veículo: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Falha técnica ao salvar registro do veículo' });
        }
    },

    /**
     * Atualizar informações técnicas ou cadastrais do veículo.
     */
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { plate, brand, model, year, color, km_cad, notes, vin } = req.body;

            const [result] = await db.query(
                `UPDATE vehicles SET 
                    plate = ?, brand = ?, model = ?, year = ?, 
                    color = ?, km_cad = ?, notes = ?, vin = ? 
                WHERE id = ?`,
                [
                    plate.trim().toUpperCase(),
                    brand.trim(),
                    model.trim(),
                    year ? year.toString().trim() : null,
                    color ? color.trim() : null,
                    km_cad ? parseInt(km_cad) : 0,
                    notes ? notes.trim() : null,
                    vin ? vin.trim() : null,
                    id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Veículo não localizado para edição' });
            }

            logger.info(`[VEHICLE:UPDATE] Veículo atualizado: ${id} (${plate})`);
            res.json({ success: true, message: 'Registro do veículo atualizado!' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'A placa informada já está em uso por outro veículo.' });
            }
            logger.error(`[VEHICLE:UPDATE] Erro na atualização ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao processar atualização do veículo' });
        }
    },

    /**
     * Remover veículo do sistema.
     * Impedido se houver histórico de Ordens de Serviço.
     */
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Veículo não encontrado para remoção' });
            }
            
            logger.info(`[VEHICLE:DELETE] Registro removido: ${id}`);
            res.json({ success: true, message: 'Veículo removido com sucesso do catálogo!' });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ success: false, message: 'Não é possível remover: Existem Ordens de Serviço vinculadas a este veículo.' });
            }
            logger.error(`[VEHICLE:DELETE] Código ${req.params.id}: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro técnico ao tentar remover o veículo' });
        }
    }
};

module.exports = vehicleController;
