import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Minus, ArrowUpRight, ArrowDownRight, DollarSign, Wallet,
    MoreVertical, CreditCard, Loader, Filter, Calendar,
    TrendingUp, TrendingDown, Box, Landmark, BadgeDollarSign, Edit, Trash2,
    FileText, Layers, Activity
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import TableEmptyState from '../components/TableEmptyState';
import toast from 'react-hot-toast';
import { formatMoney, formatDate } from '../utils/format';

import { getPeriodDates, PERIODS } from '../utils/date';
import Pagination from '../components/Pagination';
import { useSettings } from '../context/SettingsContext';
import './Finances.css';

const STATUS_LABELS = {
    pago: 'Pago',
    pendente: 'Pendente',
    cancelado: 'Cancelado'
};


const Finances = () => {
    const [activeTab, setActiveTab] = useState('todas'); // 'todas', 'income', 'expense'
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter State
    const [period, setPeriod] = useState('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const getDateRange = useCallback(() => {
        if (period === 'custom') return { start: customStart, end: customEnd };
        return getPeriodDates(period);
    }, [period, customStart, customEnd]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modalType, setModalType] = useState('income'); // 'income' | 'expense'
    const [formData, setFormData] = useState({ description: '', category: '', amount: '', date: '', status: 'pendente', payment_method: '', installments: 1, os_id: null });
    const [itemToDelete, setItemToDelete] = useState(null); // This will now store the whole object if possible, or just ID
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination State
    const { settings } = useSettings();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.items_per_page || 10;

    const fetchFinancialData = useCallback(async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange();
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;

            const [transRes, sumRes] = await Promise.all([
                api.get('/finances', { params }),
                api.get('/finances/summary', { params })
            ]);
            setTransactions(transRes.data);
            setSummary(sumRes.data);
            setError(null);
        } catch {
            setError('Não foi possível carregar os dados financeiros.');
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const filteredTransactions = transactions.filter(t => {
        if (activeTab === 'todas') return true;
        return t.type === activeTab;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const currentItems = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Reset to first page when tab or period changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, period, customStart, customEnd]);

    const handleOpenModal = (type) => {
        setModalType(type);
        setFormData({ id: null, description: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'pago', payment_method: '', installments: 1, os_id: null });
        setIsModalOpen(true);
    };

    const handleEdit = (transaction) => {
        setModalType(transaction.type);
        setFormData({
            id: transaction.id,
            description: transaction.description,
            category: transaction.category,
            amount: transaction.amount,
            date: transaction.payment_date ? transaction.payment_date.split('T')[0] : '',
            status: transaction.status,
            payment_method: transaction.payment_method || '',
            installments: 1,
            os_id: transaction.os_id || null
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            setIsSubmitting(true);
            await api.delete(`/finances/${itemToDelete.id}`);
            toast.success('Transação excluída com sucesso!');
            fetchFinancialData();
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } catch {
            toast.error('Erro ao excluir transação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusToggle = async (transaction) => {
        try {
            const newStatus = transaction.status === 'pago' ? 'pendente' : 'pago';
            await api.put(`/finances/${transaction.id}`, {
                ...transaction,
                date: transaction.payment_date ? transaction.payment_date.split('T')[0] : transaction.date ? transaction.date.split('T')[0] : null,
                status: newStatus
            });
            toast.success('Status atualizado!');
            fetchFinancialData();
        } catch {
            toast.error('Erro ao atualizar status.');
        }
    };

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const cleanAmount = formData.amount.toString().replace(',', '.');
            const amountValue = parseFloat(cleanAmount);
            
            if (formData.payment_method === 'Parcelado' && (parseInt(formData.installments) || 0) > 1) {
                const totalInstallments = parseInt(formData.installments) || 2;
                const installmentValue = (amountValue / totalInstallments).toFixed(2);
                const baseDate = new Date(formData.date + 'T12:00:00');

                for (let i = 0; i < totalInstallments; i++) {
                    const installmentDate = new Date(baseDate);
                    installmentDate.setMonth(baseDate.getMonth() + i);
                    
                    const data = {
                        description: `${formData.description} (${i + 1}/${totalInstallments})`,
                        category: formData.category,
                        amount: parseFloat(installmentValue),
                        date: installmentDate.toISOString().split('T')[0],
                        status: formData.status,
                        payment_method: 'Parcelado',
                        type: modalType,
                        os_id: formData.os_id
                    };

                    // Se for edição, a primeira parcela atualiza o registro atual, 
                    // as demais criam novos registros.
                    if (formData.id && i === 0) {
                        await api.put(`/finances/${formData.id}`, data);
                    } else {
                        await api.post('/finances', data);
                    }
                }
                toast.success(`${totalInstallments} parcelas processadas com sucesso!`);
            } else {
                const data = {
                    ...formData,
                    type: modalType,
                    amount: amountValue
                };
                // Remove internal UI state
                delete data.installments;

                if (formData.id) {
                    await api.put(`/finances/${formData.id}`, data);
                    toast.success('Transação atualizada com sucesso!');
                } else {
                    await api.post('/finances', data);
                    toast.success(`${modalType === 'income' ? 'Receita' : 'Despesa'} salva com sucesso!`);
                }
            }
            setIsModalOpen(false);
            fetchFinancialData();
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar transação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Local format functions removed; using imported utils

    return (
        <div className="finances-page animation-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><BadgeDollarSign size={24} /> Controle Financeiro</h1>
                    <p className="page-subtitle">Fluxo de caixa, contas a pagar e a receber</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-danger" onClick={() => handleOpenModal('expense')}>
                        <Minus size={18} /> Nova Despesa
                    </button>
                    <button className="btn btn-success" onClick={() => handleOpenModal('income')}>
                        <Plus size={18} /> Nova Receita
                    </button>
                </div>
            </div>

            {/* Period Filter Card */}
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
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            <span className="text-secondary text-sm">De</span>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="search-input"
                                style={{ padding: '0.4rem 0.8rem', minWidth: '130px' }}
                            />
                            <span className="text-secondary text-sm">Até</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="search-input"
                                style={{ padding: '0.4rem 0.8rem', minWidth: '130px' }}
                            />
                            <button className="btn btn-primary ml-2" style={{ padding: '0.4rem 0.8rem' }} onClick={fetchFinancialData}>Filtrar</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Overview Summary Cards */}
            <div className="stats-grid mb-6">
                <div className="stat-card stat-blue">
                    <div className="stat-value">{loading ? '...' : formatMoney(summary.balance)}</div>
                    <div className="stat-label">Saldo em Caixa</div>
                </div>

                <div className="stat-card stat-green">
                    <div className="stat-value text-success-text">{loading ? '...' : formatMoney(summary.income)}</div>
                    <div className="stat-label">Receitas Pagas</div>
                </div>

                <div className="stat-card stat-red">
                    <div className="stat-value text-danger-text">{loading ? '...' : formatMoney(summary.expense)}</div>
                    <div className="stat-label">Despesas Pagas</div>
                </div>
            </div>

            {/* Tabs Nav */}
            <div className="tab-container mb-6">
                <button
                    className={`tab-button ${activeTab === 'todas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('todas')}
                >
                    Todas
                </button>
                <button
                    className={`tab-button ${activeTab === 'income' ? 'active success' : ''}`}
                    onClick={() => setActiveTab('income')}
                >
                    A Receber (Receitas)
                </button>
                <button
                    className={`tab-button ${activeTab === 'expense' ? 'active danger' : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    A Pagar (Despesas)
                </button>
            </div>

            {error && (
                <div className="alert-danger mb-4" style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            {/* Transactions List Card */}
            <div className="data-table-card mt-6">
                <div className="card-header">
                    <h2 className="text-lg font-bold text-primary-color mb-1">Movimentações do Período</h2>
                    <p className="text-sm text-secondary">Lista completa de entradas e saídas</p>
                </div>

                <div className="table-responsive">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Descrição</th>
                                    <th>Categoria</th>
                                    <th>Vencimento</th>
                                    <th>Status</th>
                                    <th className="text-right">Valor</th>
                                    <th width="40" className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? currentItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className={`type-indicator ${item.type === 'income' ? 'indicator-income' : 'indicator-expense'}`}>
                                                    {item.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-primary-color">{item.description}</div>
                                                    {item.payment_method && <div className="text-xs text-secondary">{item.payment_method}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-light">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="text-sm text-secondary">{formatDate(item.payment_date)}</td>
                                        <td>
                                            <span
                                                className={`badge ${item.status === 'pago' ? 'badge-success' : item.status === 'cancelado' ? 'badge-danger' : 'badge-warning'}`}
                                                onClick={() => handleStatusToggle(item)}
                                                style={{ cursor: 'pointer' }}
                                                title="Clique para alternar status"
                                            >
                                                {STATUS_LABELS[item.status] || item.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <span className={`amount-badge ${item.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                                                {item.type === 'income' ? '+' : '-'} {formatMoney(item.amount)}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons justify-end">
                                                <button
                                                    className="btn-icon text-primary"
                                                    onClick={() => handleEdit(item)}
                                                    title="Editar"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    className="btn-icon text-danger"
                                                    onClick={() => handleDelete(item)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <TableEmptyState
                                        colSpan={6}
                                        icon={Box}
                                        message="Nenhuma movimentação financeira encontrada."
                                    />
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {filteredTransactions.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredTransactions.length}
                    />
                )}
            </div>

            {/* Modal Nova Transação */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={formData.id ? 'Editar Lançamento' : (modalType === 'income' ? 'Lançar Nova Receita' : 'Lançar Nova Despesa')}
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" form="transaction-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : formData.id ? 'Salvar Alterações' : `Salvar ${modalType === 'income' ? 'Receita' : 'Despesa'}`}
                        </button>
                    </div>
                )}
            >
                <form id="transaction-form" onSubmit={handleCreateTransaction}>
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="text-primary-color" size={20} />
                                <h3 className="font-bold text-lg">1. Dados da Transação</h3>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label className="form-label">Descrição *</label>
                                <div className="form-input-wrapper">
                                    <FileText className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        className={`form-control form-control-with-icon ${formData.payment_method === 'Parcelado' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        placeholder={modalType === 'income' ? 'Ex: Recebimento Serviço...' : 'Ex: Compra de Óleo...'}
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        readOnly={formData.payment_method === 'Parcelado'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label className="form-label">Valor (R$) *</label>
                                    <div className="form-input-wrapper">
                                        <DollarSign className="input-icon" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control form-control-with-icon"
                                            placeholder="0.00"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data do Lançamento</label>
                                    <div className="form-input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input
                                            type="date"
                                            className="form-control form-control-with-icon"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Categoria *</label>
                                <div className="form-input-wrapper">
                                    <Layers className="input-icon" size={18} />
                                    <select
                                        className="form-control form-control-with-icon"
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {modalType === 'income' ? (
                                            <>
                                                <option value="Serviços">Mão de Obra / Serviços</option>
                                                <option value="Serviço/OS">Serviço/OS</option>
                                                <option value="Venda de Peças">Venda de Peças</option>
                                                <option value="Outros">Outras Entradas</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Estoque">Reposição Estoque</option>
                                                <option value="Despesas Fixas">Aluguel, Luz, etc</option>
                                                <option value="Impostos">Impostos</option>
                                                <option value="Folha Pagamento">Pagamento Equipe</option>
                                                <option value="Outros">Outras Despesas</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4 pt-4 border-t border-color">
                                <CreditCard className="text-primary-color" size={20} />
                                <h3 className="font-bold text-lg">2. Pagamento e Status</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Meio de Pagamento</label>
                                    <div className="form-input-wrapper">
                                        <CreditCard className="input-icon" size={18} />
                                        <select
                                            className="form-control form-control-with-icon"
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        >
                                            <option value="">Não informado</option>
                                            <option value="Dinheiro">Dinheiro</option>
                                            <option value="PIX">PIX</option>
                                            <option value="Cartão de Crédito">Cartão de Crédito</option>
                                            <option value="Cartão de Débito">Cartão de Débito</option>
                                            <option value="Boleto">Boleto</option>
                                            <option value="Parcelado">Parcelado</option>
                                        </select>
                                    </div>
                                </div>
                                {formData.payment_method === 'Parcelado' && (
                                    <div className="form-group">
                                        <label className="form-label">Qtd. Parcelas</label>
                                        <div className="form-input-wrapper">
                                            <Layers className="input-icon" size={18} />
                                            <input
                                                type="number"
                                                min="1"
                                                max="48"
                                                className="form-control form-control-with-icon"
                                                required
                                                value={formData.installments}
                                                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">Status Atual</label>
                                    <div className="form-input-wrapper">
                                        <Activity className="input-icon" size={18} />
                                        <select
                                            className="form-control form-control-with-icon"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="pago">{STATUS_LABELS.pago}</option>
                                            <option value="pendente">{STATUS_LABELS.pendente}</option>
                                            <option value="cancelado">{STATUS_LABELS.cancelado}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal Confirmação de Exclusão */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Lançamento"
                message="Deseja excluir permanentemente este lançamento financeiro?"
                itemName={itemToDelete?.description}
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default Finances;
