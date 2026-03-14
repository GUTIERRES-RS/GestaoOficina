import React from 'react';
import { 
    Loader, User, Car, Calendar, Activity, 
    Info, Wrench, CheckCircle, UserCog, 
    DollarSign, Package, Percent, FileText, Search, CreditCard, Minus, Plus 
} from 'lucide-react';
import { formatMoney } from '../../utils/format';

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

    const total_cost = Number(formData.labor_cost || 0) + Number(formData.parts_cost || 0) - Number(formData.discount || 0);

    return (
        <form id="os-form" onSubmit={onSubmit} className="os-form">
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
                                    value={formData.expected_delivery_date}
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
                                value={formData.problem_reported}
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
                                value={formData.service_provided}
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

            {/* Section 3: Financeiro */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-primary-color" size={20} />
                    <h3 className="font-bold text-lg">3. Valores e Fechamento</h3>
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
                                value={formData.labor_cost}
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
                                className="form-control form-control-with-icon"
                                value={formData.parts_cost}
                                onChange={(e) => onChange({ parts_cost: e.target.value })}
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
                                value={formData.discount}
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
                                value={formData.invoice_number}
                                onChange={(e) => onChange({ invoice_number: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Resumo Final (Centered) */}
                <div className="mt-10 pt-6 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="text-primary-color" size={20} />
                        <h3 className="font-bold text-lg">4. Resumo Financeiro</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center pb-8">
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
