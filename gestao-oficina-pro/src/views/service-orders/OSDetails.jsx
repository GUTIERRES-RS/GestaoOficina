import React from 'react';
import { Printer } from 'lucide-react';
import { StatusBadge } from '../../utils/statusStyles';
import { formatMoney } from '../../utils/format';

const OSDetails = ({ os, onPrint }) => {
    if (!os) return null;

    return (
        <div className="print-area">
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 className="text-xs font-bold text-secondary uppercase mb-2">Cliente</h3>
                    <p className="font-semibold">{os.client_name}</p>
                    {os.client_document && <p className="text-xs text-secondary">CPF/CNPJ: {os.client_document}</p>}
                </div>
                <div>
                    <h3 className="text-xs font-bold text-secondary uppercase mb-2">Veículo</h3>
                    <p className="font-semibold">{os.vehicle_model} ({os.plate})</p>
                    {os.vehicle_km && <p className="text-xs text-secondary">KM na Entrada do Veículo: {Number(os.vehicle_km).toLocaleString('pt-BR')} km</p>}
                </div>
            </div>

            <div className="mb-6 pb-6 border-b border-color">
                <h3 className="text-xs font-bold text-secondary uppercase mb-2">Serviço Solicitado / Problema</h3>
                <div style={{ background: 'var(--bg-tertiary, #f1f5f9)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-color)', borderRadius: '8px', padding: '1rem' }}>
                    <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-primary)' }}>{os.problem_reported}</p>
                </div>
            </div>

            {os.service_provided && (
                <div className="mb-6 pb-6 border-b border-color">
                    <h3 className="text-xs font-bold text-secondary uppercase mb-2">Serviço Executado</h3>
                    <div style={{ background: 'var(--bg-tertiary, #f1f5f9)', border: '1px solid var(--border-color)', borderLeft: '4px solid #10b981', borderRadius: '8px', padding: '1rem' }}>
                        <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-primary)' }}>{os.service_provided}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 className="text-xs font-bold text-secondary uppercase mb-2">Mecânico</h3>
                    <p>{os.mechanic_name || 'Não atribuído'}</p>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-secondary uppercase mb-2">Status</h3>
                    <StatusBadge status={os.status} />
                </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-sm font-bold mb-3 uppercase">Resumo de Custos</h3>
                <div className="flex justify-between mb-2">
                    <span className="text-secondary">Mão de Obra:</span>
                    <span>{formatMoney(os.labor_cost)}</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-secondary">Peças:</span>
                    <span>{formatMoney(os.parts_cost)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-300 font-bold text-lg">
                    <span>TOTAL:</span>
                    <span className="text-primary-color">{formatMoney(os.total_cost)}</span>
                </div>
            </div>

            <div style={{ marginTop: '1rem' }} className="pt-8 border-t border-dashed border-gray-400 no-print">
                <button className="btn btn-primary w-full flex justify-center gap-2" onClick={() => onPrint(os)}>
                    <Printer size={18} /> Imprimir Comprovante
                </button>
            </div>
        </div>
    );
};

export default OSDetails;
