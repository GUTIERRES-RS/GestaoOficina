import React from 'react';
import { 
    Printer, User, Car, Wrench, CheckCircle, 
    AlertCircle, DollarSign, Calendar, ClipboardList, 
    Activity, UserCog, Info, FileText, Package, Percent
} from 'lucide-react';
import { StatusBadge } from '../../utils/statusStyles';
import { formatMoney } from '../../utils/format';

const OSDetails = ({ os, onPrint }) => {
    if (!os) return null;

    // Calculate total liquid estimated (mimicking OSForm logic)
    const total_cost = Number(os.labor_cost || 0) + Number(os.parts_cost || 0) - Number(os.discount || 0);

    return (
        <div className="os-details-view animation-fade-in space-y-8">
            {/* Section 1: Cliente e Veículo */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                    <User className="text-primary-color" size={20} />
                    <h3 className="font-bold text-lg">1. Cliente e Veículo</h3>
                </div>

                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 grid grid-cols-2 gap-6 shadow-sm shadow-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-color shadow-sm border border-primary/10 shrink-0">
                            <User size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-secondary uppercase font-bold tracking-wider leading-none mb-1.5">Cliente</p>
                            <p className="text-base font-bold text-primary-color leading-tight truncate">{os.client_name}</p>
                            {os.client_document && <p className="text-[10px] text-secondary mt-1 truncate">CPF/CNPJ: {os.client_document}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 border-l border-primary/10 pl-6">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-color shadow-sm border border-primary/10 shrink-0">
                            <Car size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-secondary uppercase font-bold tracking-wider leading-none mb-1.5">Veículo</p>
                            <p className="text-base font-bold text-primary-color leading-tight truncate">
                                {os.vehicle_model} <span className="text-secondary font-medium text-xs">({os.plate})</span>
                            </p>
                            {os.vehicle_km && (
                                <p className="text-[10px] text-secondary mt-1">
                                    Entrada: <span className="font-bold text-primary-color">{Number(os.vehicle_km).toLocaleString('pt-BR')} km</span>
                                </p>
                            )}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center gap-2 mb-2 ml-1 text-secondary">
                                <AlertCircle size={14} className="text-warning-color" />
                                <h4 className="text-[10px] font-bold uppercase tracking-widest">Problema Relatado</h4>
                            </div>
                            <div className="p-4 rounded-xl bg-tertiary border border-color">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{os.problem_reported}</p>
                            </div>
                        </div>
                        {os.service_provided && (
                            <div>
                                <div className="flex items-center gap-2 mb-2 ml-1 text-secondary">
                                    <CheckCircle size={14} className="text-success-color" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Serviço Executado</h4>
                                </div>
                                <div className="p-4 rounded-xl bg-tertiary border border-color">
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{os.service_provided}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 h-fit">
                        <div className="p-4 rounded-xl bg-tertiary border border-color shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-secondary text-[10px] font-bold uppercase tracking-wider">
                                <UserCog size={16} /> Mecânico Responsável
                            </div>
                            <p className="font-bold text-primary-color">{os.mechanic_name || 'Não atribuído'}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-tertiary border border-color shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-secondary text-[10px] font-bold uppercase tracking-wider">
                                <Activity size={16} /> Status Atual
                            </div>
                            <div>
                                <StatusBadge status={os.status} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Valores e Fechamento */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="text-primary-color" size={20} />
                    <h3 className="font-bold text-lg">3. Valores e Fechamento</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-tertiary border border-color">
                        <div className="flex items-center gap-2 mb-1 text-secondary text-[10px] font-bold uppercase tracking-wider">
                            <Wrench size={14} /> Mão de Obra
                        </div>
                        <p className="text-lg font-bold text-primary-color">{formatMoney(os.labor_cost)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-tertiary border border-color">
                        <div className="flex items-center gap-2 mb-1 text-secondary text-[10px] font-bold uppercase tracking-wider">
                            <Package size={14} /> Peças
                        </div>
                        <p className="text-lg font-bold text-primary-color">{formatMoney(os.parts_cost)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-tertiary border border-color">
                        <div className="flex items-center gap-2 mb-1 text-secondary text-[10px] font-bold uppercase tracking-wider">
                            <Percent size={14} /> Desconto
                        </div>
                        <p className="text-lg font-bold text-danger-color">-{formatMoney(os.discount)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-tertiary border border-color">
                        <div className="flex items-center gap-2 mb-1 text-secondary text-[10px] font-bold uppercase tracking-wider">
                            <FileText size={14} /> Número NF
                        </div>
                        <p className="text-lg font-bold text-primary-color">{os.invoice_number || '--'}</p>
                    </div>
                </div>
            </div>

            {/* Section 4: Resumo Financeiro */}
            <div className="pt-6 border-t border-dashed border-slate-200">
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

            {/* Footer Actions */}
            <div className="no-print pt-4">
                <button 
                    className="btn btn-primary w-full py-4 rounded-xl shadow-lg shadow-primary-color/20 flex justify-center items-center gap-3 transition-all hover:scale-[1.01]" 
                    onClick={() => onPrint(os)}
                >
                    <Printer size={20} />
                    <span className="font-bold">Imprimir Via do Cliente</span>
                </button>
            </div>
        </div>
    );
};

export default OSDetails;
