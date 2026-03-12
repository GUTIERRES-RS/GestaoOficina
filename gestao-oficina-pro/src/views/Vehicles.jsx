import React, { useState, useEffect } from 'react';
import { Plus, Search, Car, History, Pencil, Trash2, Loader, X, Clock, User, Hash, Calendar, Layers, Disc, Activity, AlignLeft } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { StatusBadge } from '../utils/statusStyles';
import { formatMoney, formatDate } from '../utils/format';
import VehicleHistory from './clients/VehicleHistory';


const BRANDS = [
    'Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep', 'Mitsubishi',
    'Nissan', 'Peugeot', 'Renault', 'Toyota', 'Volkswagen', 'Volvo', 'BMW',
    'Mercedes-Benz', 'Audi', 'Kia', 'Citroën', 'Dodge', 'RAM', 'Outra'
];



const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // New/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        client_id: '', plate: '', brand: '', model: '',
        year: '', color: '', km_cad: '', notes: ''
    });

    // History Modal
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyVehicle, setHistoryVehicle] = useState(null);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchVehicles();
        fetchClients();
    }, []);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/vehicles');
            setVehicles(res.data);
            setError(null);
        } catch (err) {
            setError('Não foi possível carregar os veículos.');
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const handleOpenNew = () => {
        setEditingVehicle(null);
        setFormData({ client_id: '', plate: '', brand: '', model: '', year: '', color: '', km_cad: '', notes: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            client_id: vehicle.client_id,
            plate: vehicle.plate || '',
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            year: vehicle.year || '',
            color: vehicle.color || '',
            km_cad: vehicle.km_cad || '',
            notes: vehicle.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (editingVehicle) {
                await api.put(`/vehicles/${editingVehicle.id}`, formData);
                toast.success('Veículo atualizado com sucesso!');
            } else {
                await api.post('/vehicles', formData);
                toast.success('Veículo cadastrado com sucesso!');
            }
            setIsModalOpen(false);
            fetchVehicles();
        } catch (err) {
            const msg = err.response?.data?.message || 'Erro ao salvar veículo.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (vehicle) => {
        if (!window.confirm(`Remover o veículo ${vehicle.plate} (${vehicle.model})?`)) return;
        try {
            await api.delete(`/vehicles/${vehicle.id}`);
            toast.success('Veículo removido.');
            fetchVehicles();
        } catch (err) {
            toast.error('Erro ao remover veículo.');
        }
    };

    const handleOpenHistory = async (vehicle) => {
        setHistoryVehicle(vehicle);
        setIsHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/os/vehicle/${vehicle.id}`);
            setHistoryOrders(res.data);
        } catch (err) {
            setHistoryOrders([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const filtered = vehicles.filter(v =>
        (v.plate && v.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.model && v.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.brand && v.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.client_name && v.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Removed local formatting functions


    // Removed getStatusBadge function as it's replaced by StatusBadge component

    return (
        <div className="animation-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Car size={24} /> Veículos</h1>
                    <p className="page-subtitle">Gerencie todos os veículos cadastrados</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={handleOpenNew}>
                        <Plus size={18} /> Novo Veículo
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-grid">
                <div className="stat-card stat-blue">
                    <div className="stat-value">{vehicles.length}</div>
                    <div className="stat-label">Total Veículos</div>
                </div>
                <div className="stat-card stat-orange">
                    <div className="stat-value">{vehicles.filter(v => Number(v.os_abertas) > 0).length}</div>
                    <div className="stat-label">Com OS Abertas</div>
                </div>
                <div className="stat-card stat-green">
                    <div className="stat-value">{new Set(vehicles.map(v => v.brand).filter(Boolean)).size}</div>
                    <div className="stat-label">Marcas Diferentes</div>
                </div>
            </div>

            {/* Search */}
            <div className="page-filters">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por placa, modelo, marca ou cliente..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="search-clear"><X size={14} /></button>}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {/* Vehicle Cards Grid */}
            {loading ? (
                <div className="flex justify-center items-center" style={{ padding: '4rem' }}>
                    <Loader className="animate-spin" size={32} style={{ color: 'var(--accent-color)' }} />
                    <span className="ml-2 text-secondary">Carregando veículos...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <Car size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
                    <h3 className="font-semibold" style={{ marginBottom: '0.5rem' }}>Nenhum veículo encontrado</h3>
                    <p className="text-secondary text-sm">
                        {searchTerm ? 'Tente outra busca.' : 'Cadastre o primeiro veículo clicando em "Novo Veículo".'}
                    </p>
                </div>
            ) : (
                <div className="data-table-card mt-6">
                    <div className="card-header">
                        <h2 className="text-lg font-bold text-primary-color mb-1">Relação de Veículos</h2>
                        <p className="text-sm text-secondary">Acompanhamento da frota cadastrada</p>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Veículo / Placa</th>
                                    <th>Marca / Ano</th>
                                    <th>Proprietário</th>
                                    <th>Status</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar-initials bg-slate-100 text-slate-500">
                                                    <Car size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-primary-color">{v.model || '--'}</div>
                                                    <div className="text-xs text-secondary">
                                                        {v.plate}
                                                        {v.km_cad !== undefined && v.km_cad !== null && v.km_cad !== 0 && ` • ${v.km_cad.toLocaleString('pt-BR')} km`}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="font-medium">{v.brand || '--'}</div>
                                                <div className="text-xs text-secondary">{v.year || '--'} {v.color ? `• ${v.color}` : ''}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-medium">{v.client_name || '--'}</div>
                                        </td>
                                        <td>
                                            {Number(v.os_abertas) > 0 ? (
                                                <span className="badge badge-warning">
                                                    {v.os_abertas} OS aberta{Number(v.os_abertas) > 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="badge badge-success">OK</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <div className="action-buttons justify-end">
                                                <button
                                                    className="btn-icon btn-view"
                                                    title="Histórico de OS"
                                                    onClick={() => handleOpenHistory(v)}
                                                >
                                                    <History size={15} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-edit"
                                                    title="Editar"
                                                    onClick={() => handleOpenEdit(v)}
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-del"
                                                    title="Remover"
                                                    onClick={() => handleDelete(v)}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Cadastro/Edição */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingVehicle ? `Editar Veículo — ${editingVehicle.plate}` : 'Cadastrar Novo Veículo'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Proprietário (Cliente) *</label>
                        <div className="form-input-wrapper">
                            <User className="input-icon" size={18} />
                            <select
                                className="form-control form-control-with-icon"
                                required
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                disabled={!!editingVehicle}
                            >
                                <option value="">Selecione o cliente...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Placa *</label>
                            <div className="form-input-wrapper">
                                <Hash className="input-icon" size={18} />
                                <input
                                    type="text"
                                    className="form-control form-control-with-icon"
                                    placeholder="ABC-1234 ou ABC1D23"
                                    required
                                    value={formData.plate}
                                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                    maxLength={8}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ano</label>
                            <div className="form-input-wrapper">
                                <Calendar className="input-icon" size={18} />
                                <input
                                    type="number"
                                    className="form-control form-control-with-icon"
                                    placeholder="Ex: 2020"
                                    min="1960"
                                    max="2030"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Marca *</label>
                            <div className="form-input-wrapper">
                                <Car className="input-icon" size={18} />
                                <select
                                    className="form-control form-control-with-icon"
                                    required
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Modelo *</label>
                            <div className="form-input-wrapper">
                                <Layers className="input-icon" size={18} />
                                <input
                                    type="text"
                                    className="form-control form-control-with-icon"
                                    placeholder="Ex: Gol, Civic, Corolla..."
                                    required
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Cor</label>
                            <div className="form-input-wrapper">
                                <Disc className="input-icon" size={18} />
                                <input
                                    type="text"
                                    className="form-control form-control-with-icon"
                                    placeholder="Ex: Prata"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">KM no Cadastro</label>
                            <div className="form-input-wrapper">
                                <Activity className="input-icon" size={18} />
                                <input
                                    type="number"
                                    className="form-control form-control-with-icon"
                                    placeholder="Ex: 45000"
                                    min="0"
                                    value={formData.km_cad}
                                    onChange={(e) => setFormData({ ...formData, km_cad: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Observações</label>
                        <div className="form-input-wrapper items-start">
                            <AlignLeft className="input-icon mt-3" size={18} />
                            <textarea
                                className="form-control form-control-with-icon"
                                rows="2"
                                placeholder="Observações sobre o veículo..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="animate-spin" size={16} /> : (editingVehicle ? 'Salvar Alterações' : 'Cadastrar Veículo')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Histórico de OS */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={historyVehicle ? `Histórico de OS — ${historyVehicle.plate} (${historyVehicle.model})` : 'Histórico'}
                size="large"
            >
                <VehicleHistory
                    history={historyOrders}
                    loading={historyLoading}
                    vehicleName={historyVehicle ? `${historyVehicle.model} (${historyVehicle.plate})` : ''}
                />
            </Modal>
        </div>
    );
};

export default Vehicles;
