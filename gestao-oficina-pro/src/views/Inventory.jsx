import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, X, AlignLeft, Loader, Trash2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

import Pagination from '../components/Pagination';
import { useSettings } from '../context/SettingsContext';

// Modular Components
import PartList from './inventory/PartList';
import MovementHistory from './inventory/MovementHistory';
import PartForm from './inventory/PartForm';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('catalogo');
    const [searchTerm, setSearchTerm] = useState('');
    const [inventory, setInventory] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        category: '',
        supplier: '',
        stock_quantity: '',
        min_stock: '',
        cost_price: '',
        sale_price: ''
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState('entrada'); // 'entrada' or 'saida'
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Pagination State
    const { settings } = useSettings();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.items_per_page || 10;


    useEffect(() => {
        if (activeTab === 'catalogo') {
            fetchInventory();
        } else {
            fetchMovements();
        }
    }, [activeTab]);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory/movements');
            setMovements(response.data);
            setError(null);
        } catch {
            setError('Não foi possível carregar as movimentações.');
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inventory');
            setInventory(response.data);
            setError(null);
        } catch {
            setError('Não foi possível carregar o estoque.');
            setInventory([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ code: '', name: '', description: '', category: '', supplier: '', stock_quantity: '', min_stock: '', cost_price: '', sale_price: '' });
        setIsEditMode(false);
        setActiveItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setFormData({
            code: item.code || '',
            name: item.name || '',
            description: item.description || '',
            category: item.category || '',
            supplier: item.supplier || '',
            stock_quantity: item.stock_quantity || '',
            min_stock: item.min_stock || '',
            cost_price: item.cost_price || '',
            sale_price: item.sale_price || ''
        });
        setIsEditMode(true);
        setActiveItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (item) => {
        setActiveItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!activeItem) return;
        try {
            setIsSubmitting(true);
            await api.delete(`/inventory/${activeItem.id}`);
            toast.success('Peça excluída com sucesso!');
            setIsDeleteModalOpen(false);
            fetchInventory();
        } catch {
            toast.error('Erro ao excluir peça.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdjustStock = (item, type) => {
        setActiveItem(item);
        setAdjustmentType(type);
        setIsAdjustmentModalOpen(true);
    };


    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const cleanNum = (val) => parseFloat(val.toString().replace(',', '.')) || 0;

            const payload = {
                ...formData,
                stock_quantity: parseInt(formData.stock_quantity) || 0,
                min_stock: parseInt(formData.min_stock) || 0,
                cost_price: cleanNum(formData.cost_price),
                sale_price: cleanNum(formData.sale_price)
            };

            if (isEditMode && activeItem) {
                await api.put(`/inventory/${activeItem.id}`, payload);
                toast.success('Peça atualizada com sucesso!');
            } else {
                await api.post('/inventory', payload);
                toast.success('Peça cadastrada com sucesso!');
            }
            setIsModalOpen(false);
            fetchInventory();
        } catch {
            toast.error('Erro ao salvar peça.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdjustmentSubmit = async (adjustmentData) => {
        try {
            setIsSubmitting(true);
            await api.post(`/inventory/${activeItem.id}/adjust`, {
                quantity: adjustmentData.quantity,
                type: adjustmentType,
                obs: adjustmentData.reason
            });
            toast.success('Estoque atualizado com sucesso!');
            setIsAdjustmentModalOpen(false);
            fetchInventory();
        } catch {
            toast.error('Erro ao ajustar estoque.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleFormChange = (updates) => {
        if (updates.cancel) {
            setIsModalOpen(false);
            return;
        }
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination Logic
    const currentList = activeTab === 'catalogo' ? filteredInventory : movements;
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const currentItems = currentList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Reset to first page when filters or tabs change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab]);

    const getStatusInfo = (stock, min) => {
        if (stock <= 0) return { label: 'esgotado', color: 'badge-danger' };
        if (stock <= min) return { label: 'baixo', color: 'badge-warning' };
        return { label: 'normal', color: 'badge-success' };
    };

    return (
        <div className="animation-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><Package size={24} /> Estoque de Peças</h1>
                    <p className="page-subtitle">Controle de inventário e alertas de reposição</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={handleOpenModal}>
                        <Plus size={18} /> Nova Peça
                    </button>
                </div>
            </div>

            {/* Tabs Nav */}
            <div className="tab-container mb-6">
                <button
                    className={`tab-button ${activeTab === 'catalogo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('catalogo')}
                >
                    Catálogo de Peças
                </button>
                <button
                    className={`tab-button ${activeTab === 'movimentacoes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('movimentacoes')}
                >
                    Histórico de Movimentações
                </button>
            </div>

            {error && (
                <div className="alert-danger mb-4" style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
                    {error}
                </div>
            )}

            {activeTab === 'catalogo' && (
                <>
                    {/* Filters & Search */}
                    <div className="page-filters">
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por código ou nome da peça..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && <button onClick={() => setSearchTerm('')} className="search-clear"><X size={14} /></button>}
                        </div>

                        <div className="action-buttons desktop-only">
                            <button className="btn btn-secondary"><Filter size={16} /> Categoria</button>
                            <button className="btn btn-secondary">Ver Alertas</button>
                        </div>
                    </div>

                    <div className="data-table-card mt-6">
                        <div className="card-header">
                            <h2 className="text-lg font-bold text-primary-color mb-1">Estoque de Peças</h2>
                            <p className="text-sm text-secondary">Gerenciamento de itens e disponibilidade</p>
                        </div>
                        <PartList
                            inventory={currentItems}
                            filteredInventory={currentItems}
                            loading={loading}
                            getStatusInfo={getStatusInfo}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAdjustStock={handleAdjustStock}
                        />

                        {filteredInventory.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredInventory.length}
                            />
                        )}
                    </div>
                </>
            )}

            {activeTab === 'movimentacoes' && (
                <div className="data-table-card mt-6">
                    <div className="card-header">
                        <h2 className="text-lg font-bold text-primary-color mb-1">Histórico de Movimentações</h2>
                        <p className="text-sm text-secondary">Registro de entradas e saídas do estoque</p>
                    </div>
                    <MovementHistory movements={currentItems} loading={loading} />
                    
                    {movements.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            totalItems={movements.length}
                        />
                    )}
                </div>
            )}

            {/* Modal Nova/Editar Peça */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={isEditMode ? "Editar Peça" : "Cadastrar Nova Peça"}
                size="large"
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" form="part-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Peça'}
                        </button>
                    </div>
                )}
            >
                <form id="part-form" onSubmit={handleCreateItem}>
                    <PartForm
                        formData={formData}
                        onChange={handleFormChange}
                        isEditMode={isEditMode}
                    />
                </form>
            </Modal>

            {/* Modal Ajuste de Estoque */}
            <Modal 
                isOpen={isAdjustmentModalOpen} 
                onClose={() => setIsAdjustmentModalOpen(false)} 
                title={adjustmentType === 'entrada' ? "Entrada de Estoque" : "Saída de Estoque"}
                footer={(
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustmentModalOpen(false)}>Cancelar</button>
                        <button type="submit" form="adjustment-form" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Processando...' : adjustmentType === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída'}
                        </button>
                    </div>
                )}
            >
                <StockAdjustmentForm
                    item={activeItem}
                    type={adjustmentType}
                    onSubmit={handleAdjustmentSubmit}
                    isSubmitting={isSubmitting}
                    onCancel={() => setIsAdjustmentModalOpen(false)}
                />
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Peça"
                message="Deseja remover permanentemente esta peça do estoque?"
                itemName={activeItem ? `${activeItem.name} (${activeItem.code || 'S/C'})` : ''}
                isLoading={isSubmitting}
            />
        </div>
    );
};

// Internal component for Stock Adjustment
const StockAdjustmentForm = ({ item, type, onSubmit }) => {
    const [quantity, setQuantity] = React.useState('');
    const [reason, setReason] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ quantity: parseInt(quantity), reason });
    };

    if (!item) return null;

    const newTotal = type === 'entrada' 
        ? (item.stock_quantity || 0) + (parseInt(quantity) || 0)
        : (item.stock_quantity || 0) - (parseInt(quantity) || 0);

    return (
        <form id="adjustment-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 rounded-xl border border-color bg-tertiary">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary-color">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-lg leading-tight">{item.name}</p>
                        <p className="text-xs text-secondary mt-1">Código: {item.code || '—'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-color">
                    <div className="text-center">
                        <p className="text-xs text-secondary uppercase font-bold tracking-wider">Atual</p>
                        <p className="text-2xl font-black">{item.stock_quantity || 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-secondary uppercase font-bold tracking-wider">Novo Total</p>
                        <p className={`text-2xl font-black ${newTotal < 0 ? 'text-danger-color' : 'text-green-500'}`}>{newTotal}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label">Quantidade *</label>
                    <div className="form-input-wrapper">
                        <Package className="input-icon" size={18} />
                        <input
                            type="number"
                            min="1"
                            className="form-control form-control-with-icon"
                            placeholder="0"
                            required
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Motivo / Observação</label>
                    <div className="form-input-wrapper">
                        <AlignLeft className="input-icon" size={18} />
                        <input
                            type="text"
                            className="form-control form-control-with-icon"
                            placeholder="Ex: Compra, Devolução..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            {type === 'saida' && newTotal < 0 && (
                <div className="info-alert info-warning">
                    <AlertTriangle size={20} />
                    <p><strong>Atenção:</strong> Esta saída deixará o estoque negativo.</p>
                </div>
            )}
        </form>
    );
};


export default Inventory;
