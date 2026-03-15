import React from 'react';
import { 
    Loader, User, Car, Calendar, Activity, 
    Info, Wrench, CheckCircle, UserCog, 
    DollarSign, Package, Percent, FileText, Search, CreditCard, Minus, Plus, Trash2, Trash
} from 'lucide-react';
import { formatMoney } from '../../utils/format';
import api from '../../services/api';
import toast from 'react-hot-toast';

// eslint-disable-next-line no-unused-vars
const SearchableSelect = ({ label, icon: Icon, value, options, onChange, placeholder, disabled, search, setSearch }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className="form-group" ref={containerRef}>
            <label className="form-label">{label}</label>
            <div className="searchable-select-container">
                <div className="form-input-wrapper">
                    <Icon className="input-icon" size={18} />
                    <input
                        type="text"
                        className="form-control form-control-with-icon"
                        placeholder={placeholder}
                        value={isOpen ? search : (selectedOption ? selectedOption.label : '')}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        disabled={disabled}
                        readOnly={!isOpen && !!selectedOption && !search}
                        onClick={() => !isOpen && selectedOption && setSearch('')}
                    />
                    {isOpen && search.length > 0 && (
                        <div className="searchable-select-dropdown show">
                            {options.length > 0 ? (
                                options.map(opt => (
                                    <div
                                        key={opt.value}
                                        className={`searchable-select-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                    >
                                        {opt.label}
                                    </div>
                                ))
                            ) : (
                                <div className="searchable-select-empty">Nenhum resultado encontrado</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const OSForm = ({
    formData,
    onChange,
    onSubmit,
    clients = [],
    vehicles = [],
    mechanics = [],
    onClientChange,
    isEdit = false
}) => {
    const [clientSearch, setClientSearch] = React.useState('');
    const [vehicleSearch, setVehicleSearch] = React.useState('');
    const [mechanicSearch, setMechanicSearch] = React.useState('');

    // Preços / Peças State
    const [inventory, setInventory] = React.useState([]);
    const [partSearch, setPartSearch] = React.useState('');
    const [selectedParts, setSelectedParts] = React.useState([]);
    const [loadingParts, setLoadingParts] = React.useState(false);

    // Carregar inventário e peças da OS
    React.useEffect(() => {
        fetchInventory();
        if (isEdit && formData.id) {
            fetchOSParts();
        }
    }, [isEdit, formData.id]);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/inventory');
            setInventory(res.data);
        } catch (err) {
            console.error('Erro ao buscar inventário:', err);
        }
    };

    const fetchOSParts = async () => {
        try {
            setLoadingParts(true);
            const res = await api.get(`/os/${formData.id}/parts`);
            setSelectedParts(res.data);
            
            // Sincronizar o parts_cost no formData se houver divergência
            const totalParts = res.data.reduce((sum, p) => sum + Number(p.total_price), 0);
            if (Number(totalParts) !== Number(formData.parts_cost)) {
                onChange({ parts_cost: totalParts });
            }
        } catch (err) {
            console.error('Erro ao buscar peças da OS:', err);
        } finally {
            setLoadingParts(false);
        }
    };

    const handleAddPart = (partId) => {
        const part = inventory.find(p => p.id === partId);
        if (!part) return;

        const newPart = {
            id: Date.now(), // id temporário para a lista local
            part_id: part.id,
            part_name: part.name,
            part_code: part.code,
            quantity: 1,
            unit_price: part.sale_price,
            total_price: part.sale_price
        };
        const updated = [...selectedParts, newPart];
        setSelectedParts(updated);
        
        const newPartsCost = updated.reduce((sum, p) => sum + Number(p.total_price), 0);
        onChange({ parts_cost: newPartsCost });
        setPartSearch('');
    };

    const handleUpdateQuantity = (osPartId, currentQty, delta) => {
        const newQty = currentQty + delta;
        if (newQty <= 0) return;

        const updated = selectedParts.map(p => {
            if (p.id === osPartId) {
                const total = newQty * p.unit_price;
                return { ...p, quantity: newQty, total_price: total };
            }
            return p;
        });
        setSelectedParts(updated);
        const newPartsCost = updated.reduce((sum, p) => sum + Number(p.total_price), 0);
        onChange({ parts_cost: newPartsCost });
    };

    const handleRemovePart = (osPartId) => {
        const updated = selectedParts.filter(p => p.id !== osPartId);
        setSelectedParts(updated);
        const newPartsCost = updated.reduce((sum, p) => sum + Number(p.total_price), 0);
        onChange({ parts_cost: newPartsCost });
    };

    // Filtros
    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.document && c.document.includes(clientSearch))
    );

    const filteredVehicles = vehicles.filter(v => 
        v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
        v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        (v.brand && v.brand.toLowerCase().includes(vehicleSearch.toLowerCase()))
    );

    const filteredMechanics = mechanics.filter(m => 
        m.name.toLowerCase().includes(mechanicSearch.toLowerCase()) ||
        (m.specialty && m.specialty.toLowerCase().includes(mechanicSearch.toLowerCase()))
    );

    const filteredInventory = inventory.filter(p => 
        p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(partSearch.toLowerCase()))
    ).slice(0, 10); // Limitar sugestões

    const total_cost = Number(formData.labor_cost || 0) + Number(formData.parts_cost || 0) - Number(formData.discount || 0);

    return (
        <form id="os-form" onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e, selectedParts);
        }} className="os-form">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 1: Cliente e Veículo */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="text-primary-color" size={20} />
                        <h3 className="font-bold text-lg">1. Cliente e Veículo</h3>
                    </div>

                    {!isEdit ? (
                        <div className="grid grid-cols-2 gap-4">
                            <SearchableSelect
                                label="Cliente *"
                                icon={User}
                                value={formData.client_id}
                                options={filteredClients.map(c => ({ 
                                    value: c.id, 
                                    label: `${c.name} ${c.document ? `(${c.document})` : ''}` 
                                }))}
                                onChange={(val) => onClientChange({ target: { value: val } })}
                                placeholder="Buscar cliente..."
                                search={clientSearch}
                                setSearch={setClientSearch}
                            />
                            <SearchableSelect
                                label="Veículo do Cliente *"
                                icon={Car}
                                value={formData.vehicle_id}
                                options={filteredVehicles.map(v => ({ 
                                    value: v.id, 
                                    label: `${v.brand ? `${v.brand} ` : ''}${v.model} (${v.plate})` 
                                }))}
                                onChange={(val) => onChange({ vehicle_id: val })}
                                placeholder="Buscar veículo..."
                                disabled={!formData.client_id}
                                search={vehicleSearch}
                                setSearch={setVehicleSearch}
                            />
                        </div>
                    ) : (
                        <div className="mb-6 p-5 bg-primary/5 rounded-2xl border border-primary/10 grid grid-cols-2 gap-6 shadow-sm shadow-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-color shadow-sm border border-primary/10 shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-secondary uppercase font-bold tracking-wider leading-none mb-1.5">Cliente</p>
                                    <p className="text-base font-bold text-primary-color leading-tight truncate">{formData.client_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 border-l border-primary/10 pl-6">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-color shadow-sm border border-primary/10 shrink-0">
                                    <Car size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-secondary uppercase font-bold tracking-wider leading-none mb-1.5">Veículo</p>
                                    <p className="text-base font-bold text-primary-color leading-tight truncate">
                                        {formData.vehicle_model} <span className="text-secondary font-medium text-sm">({formData.plate})</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Data de Entrega</label>
                            <div className="form-input-wrapper">
                                <Calendar className="input-icon" size={18} />
                                <input
                                    type="date"
                                    className="form-control form-control-with-icon"
                                    value={formData.expected_delivery_date || ''}
                                    onChange={(e) => onChange({ expected_delivery_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">KM na Entrada</label>
                            <div className="form-input-wrapper">
                                <Activity className="input-icon" size={18} />
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control form-control-with-icon"
                                    placeholder="Ex: 45000"
                                    value={formData.vehicle_km || ''}
                                    onChange={(e) => onChange({ vehicle_km: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Section 2: Detalhes do Serviço */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Wrench className="text-primary-color" size={20} />
                        <h3 className="font-bold text-lg">2. Detalhes do Serviço</h3>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Serviço Solicitado / Problema *</label>
                        <div className="form-input-wrapper items-start">
                            <Wrench className="input-icon mt-3" size={18} />
                            <textarea
                                className="form-control form-control-with-icon"
                                rows="3"
                                placeholder="Descreva o que o cliente relatou..."
                                required
                                value={formData.problem_reported || ''}
                                onChange={(e) => onChange({ problem_reported: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Serviço Executado</label>
                        <div className="form-input-wrapper items-start">
                            <CheckCircle className="input-icon mt-3" size={18} />
                            <textarea
                                className="form-control form-control-with-icon"
                                rows="3"
                                placeholder="Descreva o que foi feito..."
                                value={formData.service_provided || ''}
                                onChange={(e) => onChange({ service_provided: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Status da OS</label>
                            <div className="form-input-wrapper">
                                <Info className="input-icon" size={18} />
                                <select
                                    className="form-control form-control-with-icon"
                                    value={formData.status}
                                    onChange={(e) => onChange({ status: e.target.value })}
                                >
                                    <option value="Aberto">Aberto (Orçamento)</option>
                                    <option value="Em andamento">Em Andamento</option>
                                    <option value="Aguardando Peça">Aguardando Peça</option>
                                    <option value="Finalizado">Finalizado</option>
                                    <option value="Entregue">Entregue</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <SearchableSelect
                            label="Mecânico Responsável"
                            icon={UserCog}
                            value={formData.mechanic_id}
                            options={filteredMechanics.map(m => ({ value: m.id, label: m.name + (m.specialty ? ` — ${m.specialty}` : '') }))}
                            onChange={(val) => {
                                const mech = mechanics.find(m => String(m.id) === String(val));
                                onChange({ mechanic_id: val, mechanic_name: mech ? mech.name : '' });
                            }}
                            placeholder="Buscar mecânico..."
                            search={mechanicSearch}
                            setSearch={setMechanicSearch}
                        />
                    </div>
                </div>
            </div>

            {/* Section 3: Peças e Materiais */}
            <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Package className="text-primary-color" size={20} />
                        <h3 className="font-bold text-lg">3. Peças e Materiais</h3>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="mb-4">
                        <SearchableSelect
                            label="Selecionar Peça do Inventário"
                            icon={Search}
                            placeholder="Pesquisar por nome ou código..."
                            options={filteredInventory.map(p => ({
                                value: p.id,
                                label: `${p.name} - ${formatMoney(p.sale_price)} (Estoque: ${p.stock_quantity})`
                            }))}
                            onChange={handleAddPart}
                            search={partSearch}
                            setSearch={setPartSearch}
                        />
                    </div>

                    <div className="table-responsive mt-2">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Peça / Produto</th>
                                    <th className="text-center w-32">Quantidade</th>
                                    <th className="text-right">Unitário</th>
                                    <th className="text-right">Subtotal</th>
                                    <th className="text-center w-16">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingParts ? (
                                    <tr>
                                        <td colSpan="5" className="px-3 py-10 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader className="animate-spin text-primary-color" size={24} />
                                                <span className="text-secondary text-sm font-medium">Sincronizando peças...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : selectedParts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-3 py-12 text-center text-slate-400 italic font-light">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package size={32} strokeWidth={1.2} />
                                                <span>O orçamento está sem peças adicionadas.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    selectedParts.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-primary-color">{item.part_name}</span>
                                                    {item.part_code && (
                                                        <span className="text-[10px] text-secondary font-mono leading-none mt-1">{item.part_code}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                                        className="btn-icon text-secondary hover-bg"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                                        className="btn-icon text-secondary hover-bg"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="text-right text-secondary">
                                                {formatMoney(item.unit_price)}
                                            </td>
                                            <td className="text-right">
                                                <span className="font-bold">{formatMoney(item.total_price)}</span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePart(item.id)}
                                                    className="btn-icon text-danger hover-bg"
                                                    title="Excluir item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Section 4: Financeiro */}
            <div className="space-y-4 mt-8">
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-primary-color" size={20} />
                    <h3 className="font-bold text-lg">4. Valores e Fechamento</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="form-group">
                        <label className="form-label">Mão de Obra (R$)</label>
                        <div className="form-input-wrapper">
                            <DollarSign className="input-icon" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-with-icon"
                                value={formData.labor_cost || 0}
                                onChange={(e) => onChange({ labor_cost: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Peças (R$)</label>
                        <div className="form-input-wrapper">
                            <Package className="input-icon" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-with-icon bg-slate-100"
                                value={formData.parts_cost || 0}
                                readOnly
                                disabled
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Desconto (R$)</label>
                        <div className="form-input-wrapper">
                            <Percent className="input-icon" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-with-icon"
                                value={formData.discount || 0}
                                onChange={(e) => onChange({ discount: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Número NF</label>
                        <div className="form-input-wrapper">
                            <FileText className="input-icon" size={18} />
                            <input
                                type="text"
                                className="form-control form-control-with-icon"
                                placeholder="..."
                                value={formData.invoice_number || ''}
                                onChange={(e) => onChange({ invoice_number: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 5: Resumo Final (Centered) */}
                <div className="mt-10 pt-6 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="text-primary-color" size={20} />
                        <h3 className="font-bold text-lg">5. Resumo Financeiro</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center pb-8 border-b border-slate-100">
                        <span className="text-secondary text-base font-bold uppercase tracking-widest mb-2">Total Líquido Estimado</span>
                        <div 
                            style={{ 
                                fontSize: 'clamp(32px, 8vw, 64px)', 
                                lineHeight: '1',
                                letterSpacing: '-0.02em',
                                color: 'var(--accent-color)'
                            }}
                            className="font-black"
                        >
                            {formatMoney(total_cost)}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default OSForm;
