import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Calendar, Wrench, X, Loader, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getPeriodDates, PERIODS } from '../utils/date';
import Pagination from '../components/Pagination';

// Modular Components
import OSList from './service-orders/OSList';
import OSForm from './service-orders/OSForm';
import OSPrint from './service-orders/OSPrint';

const ServiceOrders = () => {
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

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState(null);

    const { settings } = useSettings();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.items_per_page || 10;
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

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange();
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;

            const response = await api.get('/os', { params });
            setOrders(response.data);
            setError(null);
        } catch {
            setError('Não foi possível carregar as Ordens de Serviço.');
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    // Filter Logic
    const filteredOrders = orders.filter(os => {
        const matchesSearch =
            os.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            os.id?.toString().includes(searchTerm) ||
            os.plate?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const currentItems = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
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

    const handleCreateOS = async (e, parts = []) => {
        try {
            setIsSubmitting(true);
            const total_cost = Number(formData.labor_cost) + Number(formData.parts_cost) - Number(formData.discount);
            
            // Abordagem Transacional: enviamos as peças junto com a OS
            await api.post('/os', { 
                ...formData, 
                total_cost,
                parts 
            });

            toast.success('Ordem de Serviço aberta com sucesso!');
            setIsModalOpen(false);
            fetchOrders();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Erro ao abrir OS.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditOS = async (os) => {
        setSelectedOS(os);
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

    const handleUpdateOS = async (e, parts) => {
        try {
            setIsSubmitting(true);
            const total_cost = Number(editFormData.labor_cost) + Number(editFormData.parts_cost) - Number(editFormData.discount);
            await api.put(`/os/${selectedOS.id}`, { ...editFormData, total_cost, parts });
            toast.success('Ordem de Serviço atualizada com sucesso!');
            setIsEditModalOpen(false);
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erro ao atualizar OS.');
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


    const handleFormChange = (updates) => {
        if (updates.cancel) {
            setIsModalOpen(false);
            setIsEditModalOpen(false);
            // Resetar estados locais ao cancelar
            setFormData({
                client_id: '', vehicle_id: '', mechanic_id: '', mechanic_name: '',
                problem_reported: '', service_provided: '', status: 'Aberto',
                expected_delivery_date: '', labor_cost: 0, parts_cost: 0, discount: 0,
                invoice_number: '', payment_status: 'pendente', payment_method: '',
                vehicle_km: ''
            });
            setEditFormData({
                status: '', mechanic_id: '', mechanic_name: '', problem_reported: '',
                service_provided: '', labor_cost: 0, parts_cost: 0, expected_delivery_date: '',
                discount: 0, invoice_number: '', payment_status: 'pendente',
                payment_method: '', vehicle_km: ''
            });
            fetchOrders();
            return;
        }

        const updateState = (prev) => {
            const next = { ...prev, ...updates };
            // Recalcular total_cost se algum campo de valor mudar
            if ('labor_cost' in updates || 'parts_cost' in updates || 'discount' in updates) {
                next.total_cost = Number(next.labor_cost || 0) + Number(next.parts_cost || 0) - Number(next.discount || 0);
            }
            return next;
        };

        if (isEditModalOpen) {
            setEditFormData(updateState);
        } else {
            setFormData(updateState);
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
                    orders={currentItems}
                    loading={loading}
                    onEdit={handleEditOS}
                    onPrint={handlePrintOS}
                />

                {filteredOrders.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredOrders.length}
                    />
                )}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => handleFormChange({ cancel: true })} 
                title="Abrir Nova Ordem de Serviço" 
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button 
                            type="button" 
                            className="btn btn-secondary px-8" 
                            onClick={() => handleFormChange({ cancel: true })}
                        >
                            Descartar
                        </button>
                        <button 
                            type="submit" 
                            form="os-form"
                            className="btn btn-primary px-10 shadow-lg shadow-primary-color/20" 
                            disabled={isSubmitting || !formData.vehicle_id}
                        >
                            {isSubmitting ? (
                                <Loader size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle size={18} className="mr-2" />
                                    Confirmar e Abrir OS
                                </>
                            )}
                        </button>
                    </div>
                )}
            >
                <OSForm
                    formData={formData}
                    onChange={handleFormChange}
                    onSubmit={handleCreateOS}
                    isSubmitting={isSubmitting}
                    clients={clients}
                    vehicles={vehicles}
                    mechanics={mechanics}
                    onClientChange={handleClientChange}
                />
            </Modal>

            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => handleFormChange({ cancel: true })} 
                title={`Editar OS #${selectedOS?.id}`} 
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button 
                            type="button" 
                            className="btn btn-secondary px-8" 
                            onClick={() => handleFormChange({ cancel: true })}
                        >
                            Descartar
                        </button>
                        <button 
                            type="submit" 
                            form="os-form"
                            className="btn btn-primary px-10 shadow-lg shadow-primary-color/20" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle size={18} className="mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                )}
            >
                <OSForm
                    formData={editFormData}
                    onChange={handleFormChange}
                    onSubmit={handleUpdateOS}
                    isSubmitting={isSubmitting}
                    mechanics={mechanics}
                    isEdit={true}
                />
            </Modal>


            <div className="print-only-container">
                <OSPrint os={selectedOS} settings={settings} />
            </div>
        </div>
    );
};

export default ServiceOrders;
