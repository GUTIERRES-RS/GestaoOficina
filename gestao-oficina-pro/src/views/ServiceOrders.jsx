import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Calendar, Wrench, X } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getPeriodDates, PERIODS } from '../utils/date';

// Modular Components
import OSList from './service-orders/OSList';
import OSForm from './service-orders/OSForm';
import OSDetails from './service-orders/OSDetails';
import OSPrint from './service-orders/OSPrint';

const ServiceOrders = () => {
    const { settings } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Period Filter State
    const [period, setPeriod] = useState('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clients, setClients] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState(null);
    const [activeTab, setActiveTab] = useState('orcamento');

    const [formData, setFormData] = useState({
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
        payment_status: 'pendente',
        payment_method: '',
        vehicle_km: ''
    });

    const [editFormData, setEditFormData] = useState({
        status: '',
        mechanic_id: '',
        mechanic_name: '',
        problem_reported: '',
        service_provided: '',
        labor_cost: 0,
        parts_cost: 0,
        expected_delivery_date: '',
        discount: 0,
        invoice_number: '',
        payment_status: 'pendente',
        payment_method: '',
        vehicle_km: ''
    });

    const getDateRange = useCallback(() => {
        if (period === 'custom') return { start: customStart, end: customEnd };
        return getPeriodDates(period);
    }, [period, customStart, customEnd]);

    useEffect(() => {
        fetchOrders();
    }, [period, customStart, customEnd]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange();
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;

            const response = await api.get('/os', { params });
            setOrders(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching Service Orders:', err);
            setError('Não foi possível carregar as Ordens de Serviço.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = async () => {
        setIsModalOpen(true);
        setActiveTab('orcamento');
        setFormData({
            client_id: '', vehicle_id: '', mechanic_id: '', mechanic_name: '', problem_reported: '', service_provided: '',
            status: 'Aberto', expected_delivery_date: '', labor_cost: 0, parts_cost: 0, discount: 0,
            invoice_number: '', payment_status: 'pendente', payment_method: ''
        });
        setVehicles([]);

        try {
            const [clientsRes, mechanicsRes] = await Promise.all([
                api.get('/clients'),
                api.get('/mechanics')
            ]);
            setClients(clientsRes.data);
            setMechanics(mechanicsRes.data.filter(m => m.status === 'Ativo'));
        } catch (e) {
            console.error('Error fetching modal data', e);
        }
    };

    const handleClientChange = async (e) => {
        const client_id = e.target.value;
        setFormData(prev => ({ ...prev, client_id, vehicle_id: '' }));

        if (client_id) {
            try {
                const res = await api.get(`/vehicles/client/${client_id}`);
                setVehicles(res.data);
            } catch (error) {
                console.error('Error fetching vehicles', error);
                setVehicles([]);
            }
        } else {
            setVehicles([]);
        }
    };

    const handleCreateOS = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const total_cost = Number(formData.labor_cost) + Number(formData.parts_cost) - Number(formData.discount);
            await api.post('/os', { ...formData, total_cost });
            toast.success('Ordem de Serviço aberta com sucesso!');
            setIsModalOpen(false);
            fetchOrders();
        } catch (err) {
            console.error('Error creating OS:', err);
            toast.error('Erro ao abrir OS.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewOS = (os) => {
        setSelectedOS(os);
        setIsViewModalOpen(true);
    };

    const handleEditOS = async (os) => {
        setSelectedOS(os);
        setActiveTab('orcamento');
        try {
            const res = await api.get('/mechanics');
            setMechanics(res.data.filter(m => m.status === 'Ativo'));
        } catch { /* silently ignore */ }

        setEditFormData({
            ...os,
            expected_delivery_date: os.expected_delivery_date ? os.expected_delivery_date.split('T')[0] : '',
            mechanic_id: os.mechanic_id || '',
            mechanic_name: os.mechanic_name || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateOS = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const total_cost = Number(editFormData.labor_cost) + Number(editFormData.parts_cost) - Number(editFormData.discount);
            await api.put(`/os/${selectedOS.id}`, { ...editFormData, total_cost });
            toast.success('Ordem de Serviço atualizada com sucesso!');
            setIsEditModalOpen(false);
            fetchOrders();
        } catch (err) {
            console.error('Error updating OS:', err);
            toast.error('Erro ao atualizar OS.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintOS = (os) => {
        setSelectedOS(os);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const filteredOrders = orders.filter(os =>
        (os.client_name && os.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (os.plate && os.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        os.id.toString().includes(searchTerm)
    );

    const handleFormChange = (updates) => {
        if (updates.cancel) {
            setIsModalOpen(false);
            setIsEditModalOpen(false);
            return;
        }
        if (isEditModalOpen) {
            setEditFormData(prev => ({ ...prev, ...updates }));
        } else {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    };

    return (
        <div className="os-container animation-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Wrench size={24} /> Ordens de Serviço</h1>
                    <p className="page-subtitle">Acompanhe orçamentos e serviços em andamento</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={handleOpenModal}>
                        <Plus size={18} /> Nova OS
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert-danger mb-4" style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            {/* Filters & Search */}
            <div className="page-filters">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, placa ou número da OS..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="search-clear"><X size={14} /></button>}
                </div>

                <div className="flex items-center gap-3 desktop-only ml-auto">
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
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="search-input"
                                style={{ padding: '0.4rem 0.8rem', minWidth: '130px' }}
                            />
                            <span className="text-secondary">até</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="search-input"
                                style={{ padding: '0.4rem 0.8rem', minWidth: '130px' }}
                            />
                            <button className="btn btn-primary ml-2" style={{ padding: '0.4rem 0.8rem' }} onClick={fetchOrders}>Filtrar</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="data-table-card mt-6">
                <div className="card-header">
                    <h2 className="text-lg font-bold text-primary-color mb-1">Listagem de OS</h2>
                    <p className="text-sm text-secondary">Acompanhamento de ordens de serviço em andamento</p>
                </div>
                <OSList
                    orders={filteredOrders}
                    loading={loading}
                    onView={handleViewOS}
                    onEdit={handleEditOS}
                    onPrint={handlePrintOS}
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Abrir Nova Ordem de Serviço">
                <OSForm
                    formData={formData}
                    onChange={handleFormChange}
                    onSubmit={handleCreateOS}
                    isSubmitting={isSubmitting}
                    clients={clients}
                    vehicles={vehicles}
                    mechanics={mechanics}
                    onClientChange={handleClientChange}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar OS #${selectedOS?.id}`}>
                <OSForm
                    formData={editFormData}
                    onChange={handleFormChange}
                    onSubmit={handleUpdateOS}
                    isSubmitting={isSubmitting}
                    mechanics={mechanics}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isEdit={true}
                />
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalhes da OS #${selectedOS?.id}`}>
                <OSDetails os={selectedOS} onPrint={handlePrintOS} />
            </Modal>

            <div className="print-only-container">
                <OSPrint os={selectedOS} settings={settings} />
            </div>
        </div>
    );
};

export default ServiceOrders;
