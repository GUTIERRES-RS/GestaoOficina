import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp,
    LayoutDashboard,
    Users,
    Wrench,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Loader,
    Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, Label } from 'recharts';
import api from '../services/api';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { StatusBadge } from '../utils/statusStyles';
import TableEmptyState from '../components/TableEmptyState';
import { formatMoney, formatDate } from '../utils/format';
import { getPeriodDates, PERIODS } from '../utils/date';

const StatCard = ({ title, value, icon, iconBgClass, iconColorClass, valueColorClass, loading }) => (
    <div className="stat-card card">
        <div className="stat-header mb-4">
            <div>
                <p className="stat-title text-sm text-secondary mb-2">{title}</p>
                {loading ? (
                    <h3 className="stat-value text-secondary animate-pulse text-2xl font-bold">...</h3>
                ) : (
                    <h3 className={`stat-value text-2xl font-bold ${valueColorClass || ''}`}>{value}</h3>
                )}
            </div>
            <div className={`stat-icon-wrapper rounded-md w-12 h-12 flex items-center justify-center ${iconBgClass} ${iconColorClass}`}>
                {icon}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [period, setPeriod] = useState('year');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const getDateRange = useCallback(() => {
        if (period === 'custom') return { start: customStart, end: customEnd };
        return getPeriodDates(period);
    }, [period, customStart, customEnd]);

    const fetchDashboardStats = useCallback(async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange();
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;

            const res = await api.get('/dashboard/stats', { params });
            setStats(res.data);
        } catch (err) {
            // Interceptor lida com o erro global
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);


    return (
        <div className="dashboard-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><LayoutDashboard size={24} /> Dashboard Geral</h1>
                    <p className="page-subtitle">Visão geral do desempenho da sua oficina</p>
                </div>
                <div className="page-header-actions">
                    <button
                        className="btn btn-secondary text-sm"
                        onClick={fetchDashboardStats}
                        disabled={loading}
                    >
                        {loading ? <Loader size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Period Filter Card */}
            <div className="card dashboard-filter">
                <div className="filter-label"><Calendar size={15} /> Período</div>
                <div className="period-tabs">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            className={`period-tab ${period === p.key ? 'active' : ''}`}
                            onClick={() => setPeriod(p.key)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                {period === 'custom' && (
                    <div className="custom-dates">
                        <div className="date-field">
                            <label>De</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="date-field">
                            <label>Até</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={fetchDashboardStats}>Filtrar</button>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid mb-8">
                <StatCard
                    title={
                        period === 'month' ? "Faturamento do Mês" :
                            period === 'lastmonth' ? "Faturamento (Mês Ant.)" :
                                period === 'quarter' ? "Faturamento (Trimestre)" :
                                    period === 'year' ? "Faturamento (Ano)" :
                                        "Faturamento (Período)"
                    }
                    value={stats ? formatMoney(stats.faturamento) : 'R$ 0,00'}
                    icon={<DollarSign size={20} />}
                    iconBgClass="bg-green-50"
                    iconColorClass="text-green-600"
                    valueColorClass="text-success"
                    loading={loading}
                />
                <StatCard
                    title="Clientes"
                    value={stats ? stats.total_clientes : '0'}
                    icon={<Users size={20} />}
                    iconBgClass="bg-blue-50"
                    iconColorClass="text-blue-600"
                    loading={loading}
                />
                <StatCard
                    title="OS em Aberto"
                    value={stats ? stats.os_abertas : '0'}
                    icon={<Wrench size={20} />}
                    iconBgClass="bg-yellow-50"
                    iconColorClass="text-yellow-600"
                    loading={loading}
                />
                <StatCard
                    title="Estoque Baixo"
                    value={stats ? stats.estoque_baixo : '0'}
                    icon={<Clock size={20} />}
                    iconBgClass="bg-red-50"
                    iconColorClass="text-red-600"
                    loading={loading}
                />
            </div>

            <div className="dashboard-grid">
                <div className="card lg-col-span-2">
                    <div className="card-header">
                        <h2 className="text-lg font-bold">
                            {period === 'custom' ? 'Faturamento por Período' :
                                period === 'year' ? 'Faturamento Anual' :
                                    period === 'quarter' ? 'Faturamento Trimestral' :
                                        period === 'lastmonth' ? 'Faturamento do Mês Anterior' :
                                            period === 'month' ? 'Faturamento Mensal' :
                                                'Selecione um período'}
                        </h2>
                        <p className="text-sm text-secondary">Base: Receitas Pagas (Financeiro)</p>
                    </div>
                    <div className="h-64 w-full">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader className="animate-spin" size={24} style={{ color: 'var(--accent-color)' }} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <BarChart data={stats?.revenue_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-color, #3b82f6)" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="var(--primary-color, #3b82f6)" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#64748b', fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#94a3b8' }}
                                        tickFormatter={(value) => value >= 1000 ? `R$${(value / 1000).toFixed(0)}k` : (value > 0 ? `R$${value}` : '')}
                                        dx={-10}
                                    />
                                    <RechartsTooltip
                                        formatter={(value) => [formatMoney(value), 'Faturamento']}
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            boxShadow: 'var(--shadow-md)',
                                            padding: '12px 16px',
                                            fontWeight: 500
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 600, paddingBottom: '4px' }}
                                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="url(#colorRevenue)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={36}
                                        minPointSize={2}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-bold">Status das OS</h2>
                            <p className="text-sm text-secondary">Distribuição atual</p>
                        </div>
                        {stats?.status_chart && stats.status_chart.length > 0 && (
                            <div className="flex flex-col items-end">
                                <span className="text-2xl font-bold leading-none text-primary">
                                    {stats.status_chart.reduce((acc, curr) => acc + curr.value, 0)}
                                </span>
                                <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mt-1">
                                    Total O.S.
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="h-64 w-full relative">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader className="animate-spin" size={24} style={{ color: 'var(--accent-color)' }} />
                            </div>
                        ) : !stats?.status_chart || stats.status_chart.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-full" style={{ gap: '0.5rem' }}>
                                <Wrench size={32} style={{ color: '#94a3b8' }} />
                                <p className="text-secondary text-sm">Nenhuma OS cadastrada</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <PieChart>
                                    <Pie
                                        data={stats.status_chart}
                                        cx="68%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {stats.status_chart.map((entry, index) => {
                                            const statusColors = {
                                                'Aberto': '#f59e0b',
                                                'Em Andamento': '#3b82f6',
                                                'Em andamento': '#3b82f6',
                                                'Aguardando Peça': '#8b5cf6',
                                                'Finalizado': '#10b981',
                                                'Entregue': '#64748b',
                                                'Cancelado': '#ef4444',
                                                'Orçamento': '#a855f7',
                                            };
                                            const fallback = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
                                            const color = statusColors[entry.name] || fallback[index % fallback.length];
                                            return <Cell key={`cell-${index}`} fill={color} stroke="transparent" />;
                                        })}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value, name) => [`${value} OS`, name]}
                                        contentStyle={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            boxShadow: 'var(--shadow-md)',
                                            padding: '10px 14px',
                                            fontWeight: 500
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                    />
                                    <Legend
                                        verticalAlign="middle"
                                        align="left"
                                        layout="vertical"
                                        wrapperStyle={{
                                            paddingLeft: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '45%'
                                        }}
                                        content={({ payload }) => (
                                            <div className="flex flex-col gap-2 w-full pr-4">
                                                {payload.map((entry, index) => (
                                                    <div key={`item-${index}`} className="flex items-center justify-between px-3 py-1.5 rounded-md transition-all hover:bg-slate-50/5" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: `3px solid ${entry.color}` }}>
                                                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                                                            <span className="text-sm font-medium truncate text-secondary">{entry.value}</span>
                                                        </div>
                                                        <span className="badge badge-warning">
                                                            {entry.payload.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Recent OS Table - full width below charts */}
                <div className="data-table-card lg-col-span-3 mt-6">
                    <div className="card-header flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-primary-color">Ordens de Serviço</h2>
                            <p className="text-sm text-secondary">Últimas movimentações registradas no sistema</p>
                        </div>
                        <Link to="/os" className="btn btn-secondary text-sm">Ver todas</Link>
                    </div>
                    <div className="table-responsive">
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader className="animate-spin text-primary-color" size={24} />
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>OS</th>
                                        <th>Cliente</th>
                                        <th>Veículo</th>
                                        <th>Data</th>
                                        <th>Status</th>
                                        <th className="text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats && stats.recent_os && stats.recent_os.length > 0 ? stats.recent_os.map(os => (
                                        <tr key={os.id}>
                                            <td className="font-medium text-primary-color">#{os.id}</td>
                                            <td>{os.client_name}</td>
                                            <td className="text-secondary text-sm">{os.vehicle_model} ({os.plate})</td>
                                            <td className="text-secondary text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} /> {formatDate(os.created_at, true)}
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge status={os.status} />
                                            </td>
                                            <td className="text-right font-bold text-primary-color">
                                                {formatMoney(os.total_cost)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <TableEmptyState
                                            colSpan={6}
                                            icon={Clock}
                                            message="Nenhuma ordem de serviço recente."
                                        />
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
