import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, Loader, X, User, Car, Calendar, Activity, Wrench, UserCog, Info, DollarSign, Package, Percent } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { formatMoney } from '../utils/format';

// Modular Components
import ClientTable from './clients/ClientTable';
import ClientForm from './clients/ClientForm';
import ClientDetails from './clients/ClientDetails';
import VehicleForm from './clients/VehicleForm';
import VehicleHistory from './clients/VehicleHistory';

import './Clients.css';

const Clients = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [vehicleHistory, setVehicleHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [formData, setFormData] = useState({ name: '', phone: '', email: '', document: '', address: '', notes: '' });
    const [vehicleFormData, setVehicleFormData] = useState({ plate: '', brand: '', model: '', year: '', color: '', km_cad: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit Client State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, name: '', phone: '', email: '', document: '', address: '', notes: '' });

    // View Client State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // OS Modal State
    const { settings } = useSettings();
    const [isOSModalOpen, setIsOSModalOpen] = useState(false);
    const [osActiveTab, setOsActiveTab] = useState('orcamento');
    const [mechanics, setMechanics] = useState([]);
    const [vehiclesForOS, setVehiclesForOS] = useState([]);
    const [osFormData, setOsFormData] = useState({
        client_id: '',
        vehicle_id: '',
        mechanic_id: '',
        mechanic_name: '',
        problem_reported: '',
        service_provided: '',
        status: 'Aberto',
        expected_delivery_date: '',
        labor_cost: 0,
        parts_cost: 0,
        discount: 0,
        invoice_number: '',
        vehicle_km: ''
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await api.get('/clients');
            setClients(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Não foi possível carregar os clientes.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await api.post('/clients', formData);
            toast.success('Cliente cadastrado com sucesso!');
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', email: '', document: '', address: '', notes: '' });
            fetchClients();
        } catch (err) {
            console.error('Error creating client:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClient = (client) => {
        setEditFormData({
            id: client.id,
            name: client.name || '',
            phone: client.phone || '',
            email: client.email || '',
            document: client.document || '',
            address: client.address || '',
            notes: client.notes || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await api.put(`/clients/${editFormData.id}`, editFormData);
            toast.success('Cliente atualizado com sucesso!');
            setIsEditModalOpen(false);
            fetchClients();
        } catch (err) {
            console.error('Error updating client:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita e removerá veículos e OS associados se houver cascata.')) {
            try {
                await api.delete(`/clients/${id}`);
                toast.success('Cliente excluído com sucesso!');
                fetchClients();
            } catch (err) {
                console.error('Error deleting client:', err);
                toast.error('Erro ao excluir cliente. Verifique as dependências.');
            }
        }
    };

    const handleOpenVehicleModal = (client) => {
        setSelectedClient(client);
        setVehicleFormData({ plate: '', brand: '', model: '', year: '', color: '', km_cad: '', notes: '' });
        setIsVehicleModalOpen(true);
    };

    const handleCreateVehicle = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await api.post('/vehicles', {
                ...vehicleFormData,
                client_id: selectedClient.id
            });
            toast.success('Veículo vinculado com sucesso!');
            setIsVehicleModalOpen(false);
            fetchClients();
        } catch (err) {
            console.error('Error creating vehicle:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenVehicleHistory = async (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/os/vehicle/${vehicle.id}`);
            setVehicleHistory(res.data);
        } catch (err) {
            console.error('Error fetching history:', err);
            toast.error('Erro ao buscar histórico do veículo');
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchMechanics = async () => {
        try {
            const res = await api.get('/mechanics');
            setMechanics(res.data.filter(m => m.status === 'Ativo'));
        } catch (e) {
            console.error('Error fetching mechanics', e);
        }
    };

    const handleOpenOSModal = async (client, vehicle) => {
        setOsActiveTab('orcamento');
        setOsFormData({
            client_id: client.id,
            vehicle_id: vehicle.id,
            mechanic_id: '',
            mechanic_name: '',
            problem_reported: '',
            service_provided: '',
            status: 'Aberto',
            expected_delivery_date: '',
            labor_cost: 0,
            parts_cost: 0,
            discount: 0,
            invoice_number: '',
            vehicle_km: ''
        });
        setVehiclesForOS(client.vehicles || [vehicle]);
        setIsOSModalOpen(true);
        fetchMechanics();
    };

    const handleCreateOS = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const total_cost = Number(osFormData.labor_cost) + Number(osFormData.parts_cost) - Number(osFormData.discount);
            await api.post('/os', { ...osFormData, total_cost });
            toast.success('Ordem de Serviço aberta com sucesso!');
            setIsOSModalOpen(false);
        } catch (err) {
            console.error('Error creating OS:', err);
            toast.error('Erro ao abrir OS.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewClient = (client) => {
        setSelectedClient(client);
        setIsViewModalOpen(true);
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm))
    );

    return (
        <div className="clients-container animation-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Users size={24} /> Clientes e Veículos</h1>
                    <p className="page-subtitle">Gerencie o cadastro e histórico das manutenções</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="page-filters">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="search-clear"><X size={14} /></button>}
                </div>

                <div className="filter-tabs desktop-only">
                    <button className="filter-tab active">Todos</button>
                    <button className="filter-tab">Com Veículo</button>
                    <button className="filter-tab">Empresas</button>
                </div>
            </div>

            {error && (
                <div className="alert-danger mb-4" style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            {/* Clients List */}
            <div className="data-table-card mt-6">
                <div className="card-header">
                    <h2 className="text-lg font-bold text-primary-color mb-1">Listagem de Clientes</h2>
                    <p className="text-sm text-secondary">Base de dados unificada de clientes e parceiros</p>
                </div>
                <ClientTable
                    clients={filteredClients}
                    loading={loading}
                    onView={handleViewClient}
                    onEdit={handleEditClient}
                    onDelete={handleDeleteClient}
                />
            </div>

            {/* Modals */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Cliente">
                <ClientForm
                    formData={formData}
                    onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                    onSubmit={handleCreateClient}
                    isSubmitting={isSubmitting}
                    title="Novo Cliente"
                />
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Cliente">
                <ClientForm
                    formData={editFormData}
                    onChange={(e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value })}
                    onSubmit={handleUpdateClient}
                    isSubmitting={isSubmitting}
                    title="Editar Cliente"
                />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes do Cliente" size="large">
                <ClientDetails
                    client={selectedClient}
                    onAddVehicle={handleOpenVehicleModal}
                    onViewHistory={(v) => {
                        setIsViewModalOpen(false);
                        handleOpenVehicleHistory(v);
                    }}
                    onNewOS={handleOpenOSModal}
                />
            </Modal>

            <Modal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title="Vincular Novo Veículo">
                <VehicleForm
                    formData={vehicleFormData}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, [e.target.name]: e.target.value })}
                    onSubmit={handleCreateVehicle}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title={`Histórico: ${selectedVehicle?.brand} ${selectedVehicle?.model} (${selectedVehicle?.plate})`}
                size="large"
            >
                <VehicleHistory
                    history={vehicleHistory}
                    loading={historyLoading}
                />
            </Modal>

            {/* Modal Nova OS Integrado */}
            <Modal isOpen={isOSModalOpen} onClose={() => setIsOSModalOpen(false)} title="Abrir Nova Ordem de Serviço">
                <form onSubmit={handleCreateOS}>
                    {/* Tabs Nav */}
                    <div className="tab-container mb-4">
                        <button type="button" className={`tab-button ${osActiveTab === 'orcamento' ? 'active' : ''}`} onClick={() => setOsActiveTab('orcamento')}>1. Cadastro</button>
                        <button type="button" className={`tab-button ${osActiveTab === 'servicos' ? 'active' : ''}`} onClick={() => setOsActiveTab('servicos')}>2. Serviço</button>
                        <button type="button" className={`tab-button ${osActiveTab === 'financeiro' ? 'active' : ''}`} onClick={() => setOsActiveTab('financeiro')}>3. Fechamento</button>
                    </div>

                    {osActiveTab === 'orcamento' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Cliente *</label>
                                    <div className="form-input-wrapper">
                                        <User className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            className="form-control form-control-with-icon bg-slate-50 cursor-not-allowed"
                                            value={selectedClient?.name || ''}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Veículo do Cliente *</label>
                                    <div className="form-input-wrapper">
                                        <Car className="input-icon" size={18} />
                                        <select
                                            className="form-control form-control-with-icon"
                                            required
                                            value={osFormData.vehicle_id}
                                            onChange={(e) => setOsFormData({ ...osFormData, vehicle_id: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {vehiclesForOS.map(v => (
                                                <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Data Prevista de Entrega</label>
                                <div className="form-input-wrapper">
                                    <Calendar className="input-icon" size={18} />
                                    <input
                                        type="date"
                                        className="form-control form-control-with-icon"
                                        value={osFormData.expected_delivery_date}
                                        onChange={(e) => setOsFormData({ ...osFormData, expected_delivery_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">KM na Entrada do Veículo</label>
                                <div className="form-input-wrapper">
                                    <Activity className="input-icon" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-control form-control-with-icon"
                                        placeholder="Ex: 45000"
                                        value={osFormData.vehicle_km || ''}
                                        onChange={(e) => setOsFormData({ ...osFormData, vehicle_km: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {osActiveTab === 'servicos' && (
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">Serviço Solicitado / Problema *</label>
                                <div className="form-input-wrapper items-start">
                                    <Wrench className="input-icon mt-3" size={18} />
                                    <textarea
                                        className="form-control form-control-with-icon"
                                        rows="4"
                                        placeholder="Descreva o que o cliente relatou..."
                                        required
                                        value={osFormData.problem_reported}
                                        onChange={(e) => setOsFormData({ ...osFormData, problem_reported: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Mecânico Responsável</label>
                                    <div className="form-input-wrapper">
                                        <UserCog className="input-icon" size={18} />
                                        <select
                                            className="form-control form-control-with-icon"
                                            value={osFormData.mechanic_id}
                                            onChange={(e) => {
                                                const mech = mechanics.find(m => String(m.id) === e.target.value);
                                                setOsFormData({ ...osFormData, mechanic_id: e.target.value, mechanic_name: mech ? mech.name : '' });
                                            }}
                                        >
                                            <option value="">Selecione...</option>
                                            {mechanics.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}{m.specialty ? ` — ${m.specialty}` : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status Inicial</label>
                                    <div className="form-input-wrapper">
                                        <Info className="input-icon" size={18} />
                                        <select
                                            className="form-control form-control-with-icon"
                                            value={osFormData.status}
                                            onChange={(e) => setOsFormData({ ...osFormData, status: e.target.value })}
                                        >
                                            <option value="Aberto">Aberto (Orçamento)</option>
                                            <option value="Em andamento">Em Andamento</option>
                                            <option value="Aguardando Peça">Aguardando Peça</option>
                                            <option value="Finalizado">Finalizado</option>
                                            <option value="Entregue">Entregue</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {osActiveTab === 'financeiro' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Custo Mão de Obra (R$)</label>
                                    <div className="form-input-wrapper">
                                        <DollarSign className="input-icon" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control form-control-with-icon"
                                            value={osFormData.labor_cost}
                                            onChange={(e) => setOsFormData({ ...osFormData, labor_cost: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Custo de Peças (R$)</label>
                                    <div className="form-input-wrapper">
                                        <Package className="input-icon" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control form-control-with-icon"
                                            value={osFormData.parts_cost}
                                            onChange={(e) => setOsFormData({ ...osFormData, parts_cost: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Desconto Autorizado (R$)</label>
                                    <div className="form-input-wrapper">
                                        <Percent className="input-icon" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control form-control-with-icon"
                                            value={osFormData.discount}
                                            onChange={(e) => setOsFormData({ ...osFormData, discount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mt-4 border border-slate-100">
                                <span className="font-bold text-slate-700">Total Estimado:</span>
                                <span className="text-xl font-bold text-primary-color">
                                    {formatMoney(Number(osFormData.labor_cost) + Number(osFormData.parts_cost) - Number(osFormData.discount))}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-color">
                        {osActiveTab !== 'orcamento' && (
                            <button type="button" className="btn btn-secondary" onClick={() => setOsActiveTab(osActiveTab === 'financeiro' ? 'servicos' : 'orcamento')}>
                                Voltar
                            </button>
                        )}
                        <button type="button" className="btn btn-secondary" onClick={() => setIsOSModalOpen(false)}>
                            Cancelar
                        </button>
                        {osActiveTab !== 'financeiro' ? (
                            <button type="button" className="btn btn-primary" onClick={() => setOsActiveTab(osActiveTab === 'orcamento' ? 'servicos' : 'financeiro')}>
                                Próximo
                            </button>
                        ) : (
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="animate-spin" size={16} /> : 'Abrir Ordem de Serviço'}
                            </button>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Clients;
