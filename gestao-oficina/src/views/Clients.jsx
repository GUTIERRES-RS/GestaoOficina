import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader, X, User, Users, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';


// Modular Components
import ClientTable from './clients/ClientTable';
import ClientForm from './clients/ClientForm';
import ClientDetails from './clients/ClientDetails';
import VehicleForm from './clients/VehicleForm';
import VehicleHistory from './clients/VehicleHistory';
import OSForm from './service-orders/OSForm';

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
    // eslint-disable-next-line no-unused-vars
    const [_isSubmitting, _setIsSubmitting] = useState(false);

    // Edit Client State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: null, name: '', phone: '', email: '', document: '', address: '', notes: '' });

    // View Client State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // Pagination State
    const { settings } = useSettings();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.items_per_page || 10;

    // OS Modal State
    const [isOSModalOpen, setIsOSModalOpen] = useState(false);
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
            _setIsSubmitting(true);
            await api.post('/clients', formData);
            toast.success('Cliente cadastrado com sucesso!');
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', email: '', document: '', address: '', notes: '' });
            fetchClients();
        } catch (err) {
            console.error('Error creating client:', err);
        } finally {
            _setIsSubmitting(false);
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
            _setIsSubmitting(true);
            await api.put(`/clients/${editFormData.id}`, editFormData);
            toast.success('Cliente atualizado com sucesso!');
            setIsEditModalOpen(false);
            fetchClients();
        } catch (err) {
            console.error('Error updating client:', err);
        } finally {
            _setIsSubmitting(false);
        }
    };

    const openDeleteConfirmation = (client) => {
        setClientToDelete(client);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;

        try {
            _setIsSubmitting(true);
            await api.delete(`/clients/${clientToDelete.id}`);
            toast.success('Cliente excluído com sucesso!');
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
            fetchClients();
        } catch (err) {
            console.error('Error deleting client:', err);
            toast.error('Erro ao excluir cliente. Verifique as dependências.');
        } finally {
            _setIsSubmitting(false);
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
            _setIsSubmitting(true);
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
            _setIsSubmitting(false);
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
        setOsFormData({
            client_id: client.id,
            client_name: client.name,
            vehicle_id: vehicle.id,
            brand: vehicle.brand,
            vehicle_model: vehicle.model,
            plate: vehicle.plate,
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
        
        // Fetch mechanics if not already fetched
        if (mechanics.length === 0) {
            fetchMechanics();
        }
    };

    const handleFormChange = (updates) => {
        if (updates.cancel) {
            setIsOSModalOpen(false);
            setOsFormData({
                client_id: '', vehicle_id: '', mechanic_id: '', mechanic_name: '',
                problem_reported: '', service_provided: '', status: 'Aberto',
                expected_delivery_date: '', labor_cost: 0, parts_cost: 0, discount: 0,
                invoice_number: '', vehicle_km: ''
            });
            return;
        }
        
        setOsFormData(prev => {
            const next = { ...prev, ...updates };
            // Recalcular total_cost se algum campo de valor mudar
            if ('labor_cost' in updates || 'parts_cost' in updates || 'discount' in updates) {
                next.total_cost = Number(next.labor_cost || 0) + Number(next.parts_cost || 0) - Number(next.discount || 0);
            }
            return next;
        });
    };

    const handleCreateOS = async (e, parts = []) => {
        try {
            _setIsSubmitting(true);
            const total_cost = Number(osFormData.labor_cost) + Number(osFormData.parts_cost) - Number(osFormData.discount);
            
            // Abordagem Transacional: enviamos as peças junto com a OS
            await api.post('/os', { 
                ...osFormData, 
                total_cost,
                parts 
            });

            toast.success('Ordem de Serviço aberta com sucesso!');
            setIsOSModalOpen(false);
            // Re-fetch client details if needed, but fetchClientDetails is not defined in this scope
            // fetchClientDetails(); // This was causing an error if not defined
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Erro ao abrir OS.');
        } finally {
            _setIsSubmitting(false);
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

    // Pagination Logic
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const currentItems = filteredClients.slice(
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
                    clients={currentItems}
                    loading={loading}
                    onView={handleViewClient}
                    onEdit={handleEditClient}
                    onDelete={openDeleteConfirmation}
                />

                {filteredClients.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredClients.length}
                    />
                )}
            </div>

            {/* Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Cliente"
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" form="new-client-form" className="btn btn-primary" disabled={_isSubmitting}>
                            {_isSubmitting ? 'Salvando...' : 'Cadastrar Cliente'}
                        </button>
                    </div>
                )}
            >
                <form id="new-client-form" onSubmit={handleCreateClient}>
                    <ClientForm
                        formData={formData}
                        onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        _isSubmitting={_isSubmitting}
                    />
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Editar Cliente"
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                        <button type="submit" form="edit-client-form" className="btn btn-primary" disabled={_isSubmitting}>
                            {_isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                )}
            >
                <form id="edit-client-form" onSubmit={handleUpdateClient}>
                    <ClientForm
                        formData={editFormData}
                        onChange={(e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value })}
                        _isSubmitting={_isSubmitting}
                    />
                </form>
            </Modal>

            <Modal 
                isOpen={isViewModalOpen} 
                onClose={() => setIsViewModalOpen(false)} 
                title="Detalhes do Cliente" 
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button 
                            type="button" 
                            className="btn btn-secondary px-6" 
                            onClick={() => setIsViewModalOpen(false)}
                        >
                            Fechar
                        </button>
                        <button 
                            className="btn btn-primary flex items-center gap-2 px-8" 
                            onClick={() => {
                                handleOpenVehicleModal(selectedClient);
                            }}
                        >
                            <Plus size={18} /> Vincular Novo Veículo
                        </button>
                    </div>
                )}
            >
                <ClientDetails
                    client={selectedClient}
                    onViewHistory={(v) => {
                        setIsViewModalOpen(false);
                        handleOpenVehicleHistory(v);
                    }}
                    onNewOS={handleOpenOSModal}
                />
            </Modal>

            <Modal
                isOpen={isVehicleModalOpen}
                onClose={() => setIsVehicleModalOpen(false)}
                title="Vincular Novo Veículo"
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsVehicleModalOpen(false)}>Cancelar</button>
                        <button type="submit" form="vehicle-form" className="btn btn-primary" disabled={_isSubmitting}>
                            {_isSubmitting ? 'Gravando...' : 'Vincular Veículo'}
                        </button>
                    </div>
                )}
            >
                <form id="vehicle-form" onSubmit={handleCreateVehicle}>
                    <VehicleForm
                        formData={vehicleFormData}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, [e.target.name]: e.target.value })}
                        _isSubmitting={_isSubmitting}
                    />
                </form>
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
            <Modal
                isOpen={isOSModalOpen}
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
                            disabled={_isSubmitting || !osFormData.vehicle_id}
                        >
                            {_isSubmitting ? (
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
                    formData={osFormData}
                    onChange={handleFormChange}
                    onSubmit={handleCreateOS}
                    _isSubmitting={_isSubmitting}
                    clients={clients}
                    vehicles={vehiclesForOS}
                    mechanics={mechanics}
                    onClientChange={() => {}} // Disabled in this context as client is fixed
                    isEdit={true} // Using isEdit mode to show static client/vehicle info
                />
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteClient}
                title="Excluir Cliente"
                message="Deseja excluir permanentemente este cliente?"
                itemName={clientToDelete?.name}
                isLoading={_isSubmitting}
            />
        </div>
    );
};

export default Clients;
