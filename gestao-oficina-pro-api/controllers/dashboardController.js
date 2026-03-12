const db = require('../config/database');

const dashboardController = {
    getStats: async (req, res) => {
        try {
            const { start_date, end_date } = req.query;

            // Helper for date params
            const hasDates = start_date && end_date;
            const dateParams = hasDates ? [start_date, end_date] : [];

            let revenueQuery = `
                SELECT SUM(amount) as total_revenue FROM transactions 
                WHERE type = 'income' AND status = 'pago'
                ${hasDates ? "AND payment_date BETWEEN ? AND ?" : "AND MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())"}
            `;

            const [[{ total_revenue }]] = await db.query(revenueQuery, hasDates ? dateParams : []);

            // Clientes Totais
            let clientsQuery = "SELECT COUNT(*) as total_clientes FROM clients";
            if (hasDates) clientsQuery += " WHERE created_at BETWEEN ? AND ?";
            const [[{ total_clientes }]] = await db.query(clientsQuery, dateParams);

            // OS em Aberto
            let osAbertasQuery = "SELECT COUNT(*) as os_abertas FROM service_orders WHERE status NOT IN ('Finalizado', 'Entregue', 'Cancelado')";
            if (hasDates) osAbertasQuery += " AND created_at BETWEEN ? AND ?";
            const [[{ os_abertas }]] = await db.query(osAbertasQuery, dateParams);

            // Estoque Baixo (Snapshot atual, não é filtrado por data)
            const [[{ estoque_baixo }]] = await db.query("SELECT COUNT(*) as estoque_baixo FROM inventory WHERE stock_quantity <= min_stock");

            // Últimas OS (Para a tabela)
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

            // Gráfico: Faturamento Mensal (Dinâmico por período)
            let chartStart, chartEnd;
            if (hasDates) {
                const [sY, sM, sD] = start_date.split('-').map(Number);
                const [eY, eM, eD] = end_date.split('-').map(Number);
                chartStart = new Date(sY, sM - 1, 1);
                chartEnd = new Date(eY, eM - 1, 1);
            } else {
                chartEnd = new Date();
                chartStart = new Date();
                chartStart.setMonth(chartStart.getMonth() - 5);
                chartStart.setDate(1);
            }

            // Garante que o gráfico mostre meses completos e as datas sejam seguras
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

            // Loop para preencher os meses no intervalo
            while (current <= endLimit) {
                const yr = current.getFullYear();
                const mo = current.getMonth() + 1;
                const key = `${yr}-${mo}`;
                const shortYear = String(yr).slice(2);

                revenue_chart.push({
                    name: `${months_pt[mo - 1]}/${shortYear}`,
                    value: revenueMap[key] || 0
                });

                current.setMonth(current.getMonth() + 1);
            }

            // Gráfico: Status das OS
            let statusChartQuery = `
                SELECT status as name, COUNT(*) as value
                FROM service_orders
            `;
            if (hasDates) {
                statusChartQuery += " WHERE created_at BETWEEN ? AND ?";
            }
            statusChartQuery += " GROUP BY status ORDER BY value DESC";

            const [statusRows] = await db.query(statusChartQuery, dateParams);

            const status_chart = statusRows.map(row => ({
                name: row.name,
                value: Number(row.value)
            }));

            res.json({
                total_clientes: Number(total_clientes) || 0,
                os_abertas: Number(os_abertas) || 0,
                faturamento: Number(total_revenue) || 0,
                estoque_baixo: Number(estoque_baixo) || 0,
                recent_os: recentOs,
                revenue_chart,
                status_chart
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({ message: 'Erro ao buscar métricas do Dashboard' });
        }
    }
};

module.exports = dashboardController;
