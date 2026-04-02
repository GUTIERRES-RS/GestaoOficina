const db = require('../config/database');
const logger = require('../services/logger');

/**
 * Controller de Dashboard
 * Consolida métricas financeiras, operacionais e de estoque para visualização gerencial.
 */
const dashboardController = {

    /**
     * Obter estatísticas gerais e dados para gráficos.
     * @param {Object} req - Query: start_date, end_date (período de filtragem).
     */
    getStats: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;

            // Auxiliar para parâmetros de data
            const hasDates = start_date && end_date;
            const dateParams = hasDates ? [start_date, end_date] : [];

            // MÉTRICA: Faturamento total (entradas pagas)
            let revenueQuery = `
                SELECT SUM(amount) as total_revenue FROM transactions 
                WHERE type = 'income' AND status = 'pago'
                ${hasDates ? "AND payment_date BETWEEN ? AND ?" : "AND MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())"}
            `;

            const [[{ total_revenue }]] = await db.query(revenueQuery, hasDates ? dateParams : []);

            // MÉTRICA: Total de Clientes cadastrados
            let clientsQuery = "SELECT COUNT(*) as total_clientes FROM clients";
            if (hasDates) clientsQuery += " WHERE created_at BETWEEN ? AND ?";
            const [[{ total_clientes }]] = await db.query(clientsQuery, dateParams);

            // MÉTRICA: Ordens de Serviço em execução (abertas/pendentes)
            let osAbertasQuery = "SELECT COUNT(*) as os_abertas FROM service_orders WHERE status NOT IN ('Finalizado', 'Entregue', 'Cancelado')";
            if (hasDates) osAbertasQuery += " AND created_at BETWEEN ? AND ?";
            const [[{ os_abertas }]] = await db.query(osAbertasQuery, dateParams);

            // MÉTRICA: Itens com estoque igual ou abaixo do mínimo
            const [[{ estoque_baixo }]] = await db.query("SELECT COUNT(*) as estoque_baixo FROM inventory WHERE stock_quantity <= min_stock");

            // LISTA: Últimas Ordens de Serviço (recência de 30 dias por padrão)
            let recentOsQuery = `
                SELECT so.id, c.name as client_name, v.model as vehicle_model, v.plate, so.created_at, so.status, so.total_cost 
                FROM service_orders so
                JOIN clients c ON so.client_id = c.id
                JOIN vehicles v ON so.vehicle_id = v.id
            `;
            if (hasDates) {
                recentOsQuery += " WHERE so.created_at BETWEEN ? AND ?";
            } else {
                recentOsQuery += " WHERE so.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)";
            }
            recentOsQuery += " ORDER BY so.created_at DESC";

            const [recentOs] = await db.query(recentOsQuery, dateParams);

            // GRÁFICO: Faturamento Mensal (evolução temporal)
            let chartStart, chartEnd;
            if (hasDates) {
                const [sY, sM] = start_date.split('-').map(Number);
                const [eY, eM] = end_date.split('-').map(Number);
                chartStart = new Date(sY, sM - 1, 1);
                chartEnd = new Date(eY, eM - 1, 1);
            } else {
                chartEnd = new Date();
                chartStart = new Date();
                chartStart.setMonth(chartStart.getMonth() - 5);
                chartStart.setDate(1);
            }

            const sqlStart = `${chartStart.getFullYear()}-${String(chartStart.getMonth() + 1).padStart(2, '0')}-01 00:00:00`;
            const lastDay = new Date(chartEnd.getFullYear(), chartEnd.getMonth() + 1, 0).getDate();
            const sqlEnd = `${chartEnd.getFullYear()}-${String(chartEnd.getMonth() + 1).padStart(2, '0')}-${lastDay} 23:59:59`;

            const [rawRevenue] = await db.query(`
                SELECT YEAR(payment_date) as yr, MONTH(payment_date) as mo, SUM(amount) as value 
                FROM transactions 
                WHERE type = 'income' AND status = 'pago'
                AND payment_date BETWEEN ? AND ?
                GROUP BY yr, mo
                ORDER BY yr, mo
            `, [sqlStart, sqlEnd]);

            const months_pt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const revenueMap = {};
            for (const row of rawRevenue) {
                revenueMap[`${row.yr}-${row.mo}`] = parseFloat(row.value) || 0;
            }

            const revenue_chart = [];
            let current = new Date(chartStart.getFullYear(), chartStart.getMonth(), 1);
            const endLimit = new Date(chartEnd.getFullYear(), chartEnd.getMonth(), 1);

            while (current <= endLimit) {
                const yr = current.getFullYear();
                const mo = current.getMonth() + 1;
                const key = `${yr}-${mo}`;
                revenue_chart.push({
                    name: `${months_pt[mo - 1]}/${String(yr).slice(2)}`,
                    value: revenueMap[key] || 0
                });
                current.setMonth(current.getMonth() + 1);
            }

            // GRÁFICO: Distribuição de Status de OS
            let statusChartQuery = `SELECT status as name, COUNT(*) as value FROM service_orders`;
            if (hasDates) statusChartQuery += " WHERE created_at BETWEEN ? AND ?";
            statusChartQuery += " GROUP BY status ORDER BY value DESC";

            const [statusRows] = await db.query(statusChartQuery, dateParams);
            const status_chart = statusRows.map(row => ({ name: row.name, value: Number(row.value) }));

            logger.info(`[DASHBOARD:STATS] Métricas geradas${hasDates ? ' para o período: ' + start_date + ' a ' + end_date : ''}`);
            
            res.json({
                success: true,
                data: {
                    total_clientes: Number(total_clientes) || 0,
                    os_abertas: Number(os_abertas) || 0,
                    faturamento: Number(total_revenue) || 0,
                    estoque_baixo: Number(estoque_baixo) || 0,
                    recent_os: recentOs,
                    revenue_chart,
                    status_chart
                }
            });
        } catch (error) {
            logger.error(`[DASHBOARD] Falha ao processar métricas: ${error.stack}`);
            res.status(500).json({ success: false, message: 'Erro ao gerar dados do Dashboard' });
        }
    }
};

module.exports = dashboardController;
