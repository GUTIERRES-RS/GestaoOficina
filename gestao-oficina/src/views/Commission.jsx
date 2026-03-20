import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, TrendingUp, Star,
    ChevronDown, ChevronRight, Users
} from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import { StatusBadge } from '../utils/statusStyles';
import { formatMoney, formatPercent, formatDate } from '../utils/format';
import { getPeriodDates, PERIODS } from '../utils/date';
import './Commission.css';

export default function Commission() {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [detail, setDetail] = useState({});
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailPages, setDetailPages] = useState({}); // Tracking current page per mechanic ID

    // Pagination State
    const { settings } = useSettings();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.items_per_page || 10;

    const getDateRange = useCallback(() => {
        if (period === 'custom') return { start: customStart, end: customEnd };
        return getPeriodDates(period);
    }, [period, customStart, customEnd]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end } = getDateRange();
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;
            const { data } = await api.get('/mechanics/commission-report', { params });
            setReport(data);
        } catch { /* handled */ }
        finally { setLoading(false); }
    }, [getDateRange]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const toggleExpand = async (mechId) => {
        if (expandedId === mechId) { setExpandedId(null); return; }
        setExpandedId(mechId);
        if (!detail[mechId]) {
            setDetailLoading(true);
            try {
                const { start, end } = getDateRange();
                const params = {};
                if (start) params.start_date = start;
                if (end) params.end_date = end;
                const { data } = await api.get(`/mechanics/${mechId}/os`, { params });
                setDetail(prev => ({ ...prev, [mechId]: data }));
            } catch { /* handled */ }
            finally { setDetailLoading(false); }
        }
    };

    // Filter logic
    const filteredReport = report.filter(m => 
        m.mechanic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.specialty || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredReport.length / itemsPerPage);
    const currentItems = filteredReport.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Reset to first page when search, period or custom dates change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, period, customStart, customEnd]);

    const totals = filteredReport.reduce((acc, m) => ({
        total_os: acc.total_os + (parseInt(m.total_os) || 0),
        total_labor: acc.total_labor + parseFloat(m.total_labor || 0),
        total_commission: acc.total_commission + parseFloat(m.total_commission || 0),
    }), { total_os: 0, total_labor: 0, total_commission: 0 });

    return (
        <div className="commission-page animation-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><TrendingUp size={24} /> Comissões</h1>
                    <p className="page-subtitle">Relatório de comissões por mecânico e período</p>
                </div>
            </div>

            {/* Period Filter */}
            <div className="page-filters">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-secondary flex items-center gap-1">
                        <Calendar size={15} /> Período
                    </div>
                    <div className="filter-tabs">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                className={`filter-tab ${period === p.key ? 'active' : ''}`}
                                onClick={() => setPeriod(p.key)}
                            >{p.label}</button>
                        ))}
                    </div>
                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            <span className="text-secondary text-sm">De</span>
                            <input type="date" value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="search-input" style={{ padding: '0.4rem 0.8rem', minWidth: '130px' }} />
                            <span className="text-secondary text-sm">Até</span>
                            <input type="date" value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="search-input" style={{ padding: '0.4rem 0.8rem', minWidth: '130px' }} />
                            <button className="btn btn-primary ml-2" style={{ padding: '0.4rem 0.8rem' }} onClick={fetchReport}>Filtrar</button>
                        </div>
                    )}
                    <div className="search-box ml-auto">
                        <input
                            type="text"
                            placeholder="Buscar mecânico..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                            style={{ padding: '0.4rem 1rem 0.4rem 2.5rem', width: '220px' }}
                        />
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                            <Users size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-blue">
                    <div className="stat-value">{totals.total_os}</div>
                    <div className="stat-label">Total de O.S.</div>
                </div>
                <div className="stat-card stat-green">
                    <div className="stat-value">{formatMoney(totals.total_labor)}</div>
                    <div className="stat-label">Mão de Obra Total</div>
                </div>
                <div className="stat-card stat-orange">
                    <div className="stat-value">{formatMoney(totals.total_commission)}</div>
                    <div className="stat-label">Total de Comissões</div>
                </div>
            </div>

            {/* Commission Table */}
            <div className="commission-card card mt-6">
                <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 className="text-lg font-bold text-primary-color mb-1">Relatório de Comissões</h2>
                    <p className="text-sm text-secondary">Detalhamento de ganhos por mecânico</p>
                </div>
                {loading ? (
                    <div className="p-8 flex justify-center"><div className="spinner pr-2"></div><p>Carregando relatório...</p></div>
                ) : filteredReport.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="Nenhuma comissão"
                        description="Nenhum dado de comissão encontrado para o período e filtros selecionados."
                    />
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="commission-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Mecânico</th>
                                        <th>Especialidade</th>
                                        <th>Taxa</th>
                                        <th>O.S. Realizadas</th>
                                        <th>Mão de Obra</th>
                                        <th>Comissão Prevista</th>
                                        <th>% do Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((m) => {
                                        const pct = totals.total_commission > 0
                                            ? ((parseFloat(m.total_commission) / totals.total_commission) * 100).toFixed(1)
                                            : 0;
                                        const isExpanded = expandedId === m.mechanic_id;
                                        const mechDetail = detail[m.mechanic_id] || [];
                                        return (
                                            <React.Fragment key={m.mechanic_id}>
                                                <tr
                                                    className={`commission-row ${isExpanded ? 'expanded' : ''}`}
                                                    onClick={() => toggleExpand(m.mechanic_id)}
                                                >
                                                    <td className="expand-cell">
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </td>
                                                    <td>
                                                        <div className="mechanic-name-cell">
                                                            <div className="avatar-sm">{m.mechanic_name.charAt(0)}</div>
                                                            <span className="name">{m.mechanic_name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {m.specialty
                                                            ? <span className="specialty-badge">{m.specialty}</span>
                                                            : <span className="text-muted">—</span>}
                                                    </td>
                                                    <td><span className="rate-badge"><Star size={11} /> {formatPercent(m.commission_rate)}</span></td>
                                                    <td className="text-center">{m.total_os}</td>
                                                    <td className="text-money">{formatMoney(m.total_labor)}</td>
                                                    <td>
                                                        <span className="commission-amount">{formatMoney(m.total_commission)}</span>
                                                    </td>
                                                    <td>
                                                        <div className="pct-bar-wrap">
                                                            <div className="pct-bar" style={{ width: `${pct}%` }}></div>
                                                            <span>{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="detail-row">
                                                        <td colSpan={8}>
                                                            <div className="detail-panel">
                                                                <h4>Ordens de Serviço — {m.mechanic_name}</h4>
                                                                {detailLoading && !mechDetail.length ? (
                                                                    <p className="detail-loading">Carregando...</p>
                                                                ) : mechDetail.length === 0 ? (
                                                                    <p className="detail-empty">Nenhuma OS neste período.</p>
                                                                ) : (
                                                                    <>
                                                                        <table className="detail-table">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>OS #</th>
                                                                                    <th>Cliente</th>
                                                                                    <th>Veículo</th>
                                                                                    <th>Data</th>
                                                                                    <th>Status</th>
                                                                                    <th>M.O.</th>
                                                                                    <th>Comissão</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {(() => {
                                                                                    const dPage = detailPages[m.mechanic_id] || 1;
                                                                                    return mechDetail.slice((dPage - 1) * itemsPerPage, dPage * itemsPerPage).map(os => (
                                                                                        <tr key={os.id}>
                                                                                            <td>#{os.id}</td>
                                                                                            <td>{os.client_name}</td>
                                                                                            <td>{os.brand} {os.plate} {os.model}</td>
                                                                                            <td>{os.expected_delivery_date ? formatDate(os.expected_delivery_date) : '-'}</td>
                                                                                            <td><StatusBadge status={os.status} /></td>
                                                                                            <td>{formatMoney(os.labor_cost)}</td>
                                                                                            <td className="commission-detail-val">{formatMoney(os.commission_value)}</td>
                                                                                        </tr>
                                                                                    ));
                                                                                })()}
                                                                            </tbody>
                                                                        </table>
                                                                        {mechDetail.length > itemsPerPage && (
                                                                            <div className="mt-4">
                                                                                <Pagination
                                                                                    currentPage={detailPages[m.mechanic_id] || 1}
                                                                                    totalPages={Math.ceil(mechDetail.length / itemsPerPage)}
                                                                                    onPageChange={(p) => setDetailPages(prev => ({ ...prev, [m.mechanic_id]: p }))}
                                                                                    itemsPerPage={itemsPerPage}
                                                                                    totalItems={mechDetail.length}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="totals-row">
                                        <td colSpan={4}><strong>Total Geral</strong></td>
                                        <td className="text-center"><strong>{totals.total_os}</strong></td>
                                        <td className="text-money"><strong>{formatMoney(totals.total_labor)}</strong></td>
                                        <td><strong className="commission-amount total">{formatMoney(totals.total_commission)}</strong></td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {filteredReport.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredReport.length}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
