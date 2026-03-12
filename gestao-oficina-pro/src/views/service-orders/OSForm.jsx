import React from 'react';
import { 
    Loader, User, Car, Calendar, Activity, 
    Info, Wrench, CheckCircle, UserCog, 
    DollarSign, Package, Percent, FileText 
} from 'lucide-react';
import { formatMoney } from '../../utils/format';

const OSForm = ({
    formData,
    onChange,
    onSubmit,
    isSubmitting,
    clients = [],
    vehicles = [],
    mechanics = [],
    onClientChange,
    activeTab,
    setActiveTab,
    isEdit = false
}) => {
    const total_cost = Number(formData.labor_cost || 0) + Number(formData.parts_cost || 0) - Number(formData.discount || 0);

    return (
        <form onSubmit={onSubmit}>
            {/* Tabs Nav */}
            <div className="tab-container mb-4">
                <button type="button" className={`tab-button ${activeTab === 'orcamento' ? 'active' : ''}`} onClick={() => setActiveTab('orcamento')}>1. Cadastro</button>
                <button type="button" className={`tab-button ${activeTab === 'servicos' ? 'active' : ''}`} onClick={() => setActiveTab('servicos')}>2. Serviço</button>
                <button type="button" className={`tab-button ${activeTab === 'financeiro' ? 'active' : ''}`} onClick={() => setActiveTab('financeiro')}>3. Fechamento</button>
            </div>

            {activeTab === 'orcamento' && (
                <div className="space-y-4">
                    {!isEdit ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Cliente *</label>
                                <div className="form-input-wrapper">
                                    <User className="input-icon" size={18} />
                                    <select
                                        className="form-control form-control-with-icon"
                                        required
                                        value={formData.client_id}
                                        onChange={onClientChange}
                                    >
                                        <option value="">Selecione um cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Veículo do Cliente *</label>
                                <div className="form-input-wrapper">
                                    <Car className="input-icon" size={18} />
                                    <select
                                        className="form-control form-control-with-icon"
                                        required
                                        value={formData.vehicle_id}
                                        onChange={(e) => onChange({ vehicle_id: e.target.value })}
                                        disabled={!formData.client_id}
                                    >
                                        <option value="">Selecione um veículo...</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.model} ({v.plate}) - {v.km_cad} KM</option>
                                        ))}
                                    </select>
                                </div>
                                {!formData.client_id && <span className="text-xs text-secondary mt-1 block">Selecione o cliente primeiro</span>}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm"><strong>Cliente:</strong> {formData.client_name}</p>
                            <p className="text-sm"><strong>Veículo:</strong> {formData.vehicle_model} ({formData.plate})</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Data Prevista de Entrega</label>
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
                            <label className="form-label">KM na Entrada do Veículo</label>
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
                        {isEdit && (
                            <div className="form-group">
                                <label className="form-label">Status</label>
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
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'servicos' && (
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
                            <label className="form-label">Mecânico Responsável</label>
                            <div className="form-input-wrapper">
                                <UserCog className="input-icon" size={18} />
                                <select
                                    className="form-control form-control-with-icon"
                                    value={formData.mechanic_id}
                                    onChange={(e) => {
                                        const mech = mechanics.find(m => String(m.id) === e.target.value);
                                        onChange({ mechanic_id: e.target.value, mechanic_name: mech ? mech.name : '' });
                                    }}
                                >
                                    <option value="">Selecione...</option>
                                    {mechanics.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}{m.specialty ? ` — ${m.specialty}` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {!isEdit && (
                            <div className="form-group">
                                <label className="form-label">Status Inicial</label>
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
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'financeiro' && (
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
                                    value={formData.labor_cost}
                                    onChange={(e) => onChange({ labor_cost: e.target.value })}
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
                                    value={formData.parts_cost}
                                    onChange={(e) => onChange({ parts_cost: e.target.value })}
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
                                    value={formData.discount}
                                    onChange={(e) => onChange({ discount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Número da NF</label>
                            <div className="form-input-wrapper">
                                <FileText className="input-icon" size={18} />
                                <input
                                    type="text"
                                    className="form-control form-control-with-icon"
                                    placeholder="Nota Fiscal"
                                    value={formData.invoice_number}
                                    onChange={(e) => onChange({ invoice_number: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-primary-color bg-opacity-10 p-4 rounded mt-4">
                        <span className="font-bold text-primary-color">Total Líquido Estimado:</span>
                        <span className="text-xl font-bold text-primary-color">
                            {formatMoney(total_cost)}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-color">
                {activeTab !== 'orcamento' ? (
                    <button type="button" className="btn btn-secondary text-sm" onClick={() => setActiveTab(activeTab === 'servicos' ? 'orcamento' : 'servicos')}>
                        ← Voltar
                    </button>
                ) : <div></div>}

                <div className="flex gap-3">
                    <button type="button" className="btn btn-secondary" onClick={() => onChange({ cancel: true })}>
                        Cancelar
                    </button>
                    {activeTab !== 'financeiro' ? (
                        <button type="button" className="btn btn-primary" onClick={() => setActiveTab(activeTab === 'orcamento' ? 'servicos' : 'financeiro')}>
                            Avançar →
                        </button>
                    ) : (
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting || (!isEdit && !formData.vehicle_id)}>
                            {isSubmitting ? <Loader className="animate-spin" size={16} /> : (isEdit ? 'Salvar Alterações' : 'Abrir OS')}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
};

export default OSForm;
