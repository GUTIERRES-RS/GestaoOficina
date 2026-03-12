import React, { useState, useEffect, useCallback } from 'react';
import {
    UserCog, Plus, Pencil, Trash2, Search, X, ChevronDown,
    Phone, IdCard, Star, Calendar, CheckCircle, XCircle,
    User, Hash, Wrench, Percent, Activity, AlignLeft
} from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Mechanics.css';

const SPECIALTIES = ['Motor', 'Elétrica', 'Funilaria & Pintura', 'Suspensão', 'Freios', 'Transmissão', 'Ar Condicionado', 'Geral'];

const emptyForm = {
    name: '', phone: '', document: '', specialty: '', commission_rate: '',
    status: 'Ativo', hire_date: '', notes: ''
};

export default function Mechanics() {
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchMechanics = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/mechanics');
            setMechanics(data);
        } catch {
            // error handled by interceptor
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMechanics(); }, [fetchMechanics]);

    const filteredMechanics = mechanics.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
            (m.specialty || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'Todos' || m.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const openCreate = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (m) => {
        setForm({
            name: m.name || '',
            phone: m.phone || '',
            document: m.document || '',
            specialty: m.specialty || '',
            commission_rate: m.commission_rate ?? '',
            status: m.status || 'Ativo',
            hire_date: m.hire_date ? m.hire_date.substring(0, 10) : '',
            notes: m.notes || ''
        });
        setEditingId(m.id);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingId(null); setForm(emptyForm); };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
        setSaving(true);
        try {
            const payload = {
                ...form,
                commission_rate: parseFloat(form.commission_rate) || 0
            };
            if (editingId) {
                await api.put(`/mechanics/${editingId}`, payload);
                toast.success('Mecânico atualizado!');
            } else {
                await api.post('/mechanics', payload);
                toast.success('Mecânico cadastrado!');
            }
            closeModal();
            fetchMechanics();
        } catch {
            // handled
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/mechanics/${id}`);
            toast.success('Mecânico removido!');
            setDeleteConfirm(null);
            fetchMechanics();
        } catch { /* handled */ }
    };

    const stats = {
        total: mechanics.length,
        active: mechanics.filter(m => m.status === 'Ativo').length,
        avgCommission: mechanics.length
            ? (mechanics.reduce((s, m) => s + parseFloat(m.commission_rate || 0), 0) / mechanics.length).toFixed(1)
            : 0
    };

    return (
        <div className="mechanics-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><UserCog size={24} /> Mecânicos</h1>
                    <p className="page-subtitle">Gerencie a equipe e configure as comissões</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={openCreate}>
                        <Plus size={18} /> Novo Mecânico
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Stats Row */}
                <div className="mechanics-stats">
                    <div className="stat-card stat-blue">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total</div>
                    </div>
                    <div className="stat-card stat-green">
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Ativos</div>
                    </div>
                    <div className="stat-card stat-orange">
                        <div className="stat-value">{stats.avgCommission}%</div>
                        <div className="stat-label">Comissão Média</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mechanics-filters card">
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou especialidade..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                        />
                        {search && <button onClick={() => setSearch('')} className="search-clear"><X size={14} /></button>}
                    </div>
                    <div className="status-tabs">
                        {['Todos', 'Ativo', 'Inativo'].map(s => (
                            <button
                                key={s}
                                className={`status-tab ${filterStatus === s ? 'active' : ''}`}
                                onClick={() => setFilterStatus(s)}
                            >{s}</button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="data-table-card mt-6">
                    <div className="card-header">
                        <h2 className="text-lg font-bold text-primary-color mb-1">Corpo Técnico</h2>
                        <p className="text-sm text-secondary">Gestão de especialistas e atribuição de serviços</p>
                    </div>
                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="spinner pr-2"></div><p>Carregando...</p></div>
                    ) : filteredMechanics.length === 0 ? (
                        <EmptyState
                            icon={UserCog}
                            title="Nenhum mecânico encontrado"
                            description="Você ainda não possui mecânicos cadastrados ou a busca não retornou resultados."
                            action={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Cadastrar</button>}
                        />
                    ) : (
                        <div className="table-responsive">
                            <table className="mechanics-table">
                                <thead>
                                    <tr>
                                        <th>Mecânico</th>
                                        <th>Especialidade</th>
                                        <th>Telefone</th>
                                        <th>Admissão</th>
                                        <th>Comissão</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMechanics.map(m => (
                                        <tr key={m.id}>
                                            <td>
                                                <div className="mechanic-name">
                                                    <div className="avatar">{m.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="name">{m.name}</div>
                                                        {m.document && <div className="doc">{m.document}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {m.specialty
                                                    ? <span className="specialty-badge">{m.specialty}</span>
                                                    : <span className="text-muted">—</span>}
                                            </td>
                                            <td>{m.phone || <span className="text-muted">—</span>}</td>
                                            <td>{m.hire_date
                                                ? new Date(m.hire_date).toLocaleDateString('pt-BR')
                                                : <span className="text-muted">—</span>}
                                            </td>
                                            <td>
                                                <span className="commission-pill">
                                                    <Star size={12} /> {parseFloat(m.commission_rate).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge-status ${m.status === 'Ativo' ? 'badge-active' : 'badge-inactive'}`}>
                                                    {m.status === 'Ativo' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon btn-edit" onClick={() => openEdit(m)} title="Editar">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button className="btn-icon btn-del" onClick={() => setDeleteConfirm(m)} title="Excluir">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Editar Mecânico' : 'Novo Mecânico'}</h2>
                            <button className="modal-close" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-grid">
                                <div className="form-group col-2">
                                    <label className="form-label">Nome *</label>
                                    <div className="form-input-wrapper">
                                        <User className="input-icon" size={18} />
                                        <input name="name" value={form.name} onChange={handleChange}
                                            className="form-control form-control-with-icon" placeholder="Nome completo" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Telefone</label>
                                    <div className="form-input-wrapper">
                                        <Phone className="input-icon" size={18} />
                                        <input name="phone" value={form.phone} onChange={handleChange}
                                            className="form-control form-control-with-icon" placeholder="(00) 00000-0000" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">CPF</label>
                                    <div className="form-input-wrapper">
                                        <Hash className="input-icon" size={18} />
                                        <input name="document" value={form.document} onChange={handleChange}
                                            className="form-control form-control-with-icon" placeholder="000.000.000-00" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Especialidade</label>
                                    <div className="form-input-wrapper">
                                        <Wrench className="input-icon" size={18} />
                                        <select name="specialty" value={form.specialty} onChange={handleChange} className="form-control form-control-with-icon">
                                            <option value="">Selecione...</option>
                                            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Comissão sobre M.O. (%)</label>
                                    <div className="form-input-wrapper">
                                        <Percent className="input-icon" size={18} />
                                        <input name="commission_rate" type="number" min="0" max="100" step="0.1"
                                            value={form.commission_rate} onChange={handleChange}
                                            className="form-control form-control-with-icon" placeholder="Ex: 10.0" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Data de Admissão</label>
                                    <div className="form-input-wrapper">
                                        <Calendar className="input-icon" size={18} />
                                        <input name="hire_date" type="date" value={form.hire_date} onChange={handleChange}
                                            className="form-control form-control-with-icon" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <div className="form-input-wrapper">
                                        <Activity className="input-icon" size={18} />
                                        <select name="status" value={form.status} onChange={handleChange} className="form-control form-control-with-icon">
                                            <option value="Ativo">Ativo</option>
                                            <option value="Inativo">Inativo</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group col-2">
                                    <label className="form-label">Observações</label>
                                    <div className="form-input-wrapper items-start">
                                        <AlignLeft className="input-icon mt-3" size={18} />
                                        <textarea name="notes" value={form.notes} onChange={handleChange}
                                            className="form-control form-control-with-icon" rows={3} placeholder="Informações adicionais..." />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-box modal-small" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirmar Exclusão</h2>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}><X size={20} /></button>
                        </div>
                        <div className="delete-body">
                            <Trash2 size={40} className="delete-icon" />
                            <p>Deseja excluir o mecânico <strong>{deleteConfirm.name}</strong>?</p>
                            <p className="delete-warning">Esta ação não pode ser desfeita.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
