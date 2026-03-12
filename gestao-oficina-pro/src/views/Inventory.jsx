import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, Package, X, AlignLeft, Loader, Trash2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { formatMoney } from '../utils/format';

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
        } catch (err) {
            console.error('Error fetching movements:', err);
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
        } catch (err) {
            console.error('Error fetching inventory:', err);
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
        } catch (err) {
            console.error('Error deleting inventory item:', err);
            const errorMsg = err.response?.data?.message || 'Erro ao excluir peça.';
            toast.error(errorMsg);
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
        } catch (err) {
            console.error('Error saving inventory item:', err);
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
        } catch (err) {
            console.error('Error adjusting stock:', err);
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
                            inventory={inventory}
                            filteredInventory={filteredInventory}
                            loading={loading}
                            getStatusInfo={getStatusInfo}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAdjustStock={handleAdjustStock}
                        />
                    </div>
                </>
            )}

            {activeTab === 'movimentacoes' && (
                <div className="data-table-card mt-6">
                    <div className="card-header">
                        <h2 className="text-lg font-bold text-primary-color mb-1">Histórico de Movimentações</h2>
                        <p className="text-sm text-secondary">Registro de entradas e saídas do estoque</p>
                    </div>
                    <MovementHistory movements={movements} loading={loading} />
                </div>
            )}

            {/* Modal Nova/Editar Peça */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Editar Peça" : "Cadastrar Nova Peça"}>
                <PartForm
                    formData={formData}
                    onChange={handleFormChange}
                    onSubmit={handleCreateItem}
                    isSubmitting={isSubmitting}
                    isEditMode={isEditMode}
                />
            </Modal>

            {/* Modal Ajuste de Estoque */}
            <Modal 
                isOpen={isAdjustmentModalOpen} 
                onClose={() => setIsAdjustmentModalOpen(false)} 
                title={adjustmentType === 'entrada' ? "Entrada de Estoque" : "Saída de Estoque"}
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
            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                title="Confirmar Exclusão"
                size="sm"
            >
                <div className="text-center py-4">
                    <div className="flex justify-center mb-4 text-danger">
                        <Trash2 size={48} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Excluir Peça?</h3>
                    <p className="text-secondary mb-6">
                        Tem certeza que deseja excluir <strong>{activeItem?.name}</strong>? 
                        Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-center gap-3">
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button 
                            className="btn btn-danger" 
                            onClick={handleConfirmDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader className="animate-spin" size={18} /> : 'Sim, Excluir'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Internal component for Stock Adjustment
const StockAdjustmentForm = ({ item, type, onSubmit, isSubmitting, onCancel }) => {
    const [quantity, setQuantity] = React.useState('');
    const [reason, setReason] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ quantity: parseInt(quantity), reason });
    };

    if (!item) return null;

    const newTotal = type === 'entrada' 
        ? item.stock_quantity + (parseInt(quantity) || 0)
        : item.stock_quantity - (parseInt(quantity) || 0);

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-4 p-3 rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-sm font-medium mb-1">{item.name}</p>
                <div className="flex justify-between text-xs text-secondary">
                    <span>Estoque Atual: <strong>{item.stock_quantity} un</strong></span>
                    <span>Novo Total: <strong className={newTotal < 0 ? 'text-danger' : 'text-success'}>{newTotal} un</strong></span>
                </div>
            </div>

            <div className="form-group mb-4">
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

            <div className="form-group mb-6">
                <label className="form-label">Motivo / Observação</label>
                <div className="form-input-wrapper">
                    <AlignLeft className="input-icon" size={18} />
                    <input
                        type="text"
                        className="form-control form-control-with-icon"
                        placeholder="Ex: Compra de fornecedor, Devolução..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-color">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="submit" className={`btn ${type === 'entrada' ? 'btn-success' : 'btn-danger'}`} disabled={isSubmitting || (type === 'saida' && newTotal < 0)}>
                    {isSubmitting ? <Loader className="animate-spin" size={16} /> : `Confirmar ${type === 'entrada' ? 'Entrada' : 'Saída'}`}
                </button>
            </div>
        </form>
    );
};


export default Inventory;
