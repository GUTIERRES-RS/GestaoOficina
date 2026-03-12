import React from 'react';
import { MessageCircle, Car, History, FilePlus } from 'lucide-react';

const ClientDetails = ({ client, onAddVehicle, onViewHistory, onNewOS }) => {
    if (!client) return null;

    return (
        <div className="p-2 space-y-6">
            {/* Seção de Dados */}
            <div style={{ background: 'var(--bg-tertiary, #f8fafc)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-color)', borderRadius: '12px', padding: '1.25rem' }}>
                <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                    <div>
                        <h4 className="text-xs font-semibold mb-1 uppercase tracking-wider text-slate-400">Nome</h4>
                        <p className="text-sm font-medium text-secondary">{client.name}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold mb-1 uppercase tracking-wider text-slate-400">Telefone</h4>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-secondary">{client.phone || '-'}</p>
                            {client.phone && (
                                <a
                                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Abrir no WhatsApp"
                                    aria-label="Chamar no WhatsApp"
                                >
                                    <MessageCircle size={14} className="text-green-500" />
                                </a>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold mb-1 uppercase tracking-wider text-slate-400">Email</h4>
                        <p className="text-sm font-medium text-secondary">{client.email || '-'}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold mb-1 uppercase tracking-wider text-slate-400">CPF/CNPJ</h4>
                        <p className="text-sm font-medium text-secondary">{client.document || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Seção de Veículos */}
            <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">Veículos Vinculados</h3>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Total: {client.vehicles ? client.vehicles.length : 0}
                    </div>
                </div>

                {client.vehicles && client.vehicles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-1">
                        {client.vehicles.map((v, i) => (
                            <div key={v.id || i} className="flex justify-between items-center bg-white p-4 transition-all hover:bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-50 text-slate-400 p-3 rounded-lg flex-shrink-0 border border-slate-100">
                                        <Car size={22} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-800">
                                            {v.brand} {v.model} {v.color ? ` - ${v.color}` : ''}
                                        </span>
                                        <span className="text-xs text-secondary">
                                            {v.plate}{v.year && ` - ${v.year}`}{v.km_cad ? ` - ${v.km_cad} KM` : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="btn-icon h-9 w-9 flex items-center justify-center bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-lg transition-all text-slate-600"
                                        title="Ver Histórico"
                                        onClick={() => onViewHistory(v)}
                                    >
                                        <History size={18} />
                                    </button>
                                    <button
                                        className="btn-icon h-9 w-9 flex items-center justify-center rounded-lg transition-all text-white btn-primary"
                                        title="Nova Ordem de Serviço"
                                        onClick={() => onNewOS(client, v)}
                                    >
                                        <FilePlus size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                        Nenhum veículo vinculado a este cliente.
                    </div>
                )}
            </div>

            {/* Ações Inferiores */}
            <div className="flex justify-end items-center gap-3 pt-6 mt-2">
                <button
                    className="btn btn-primary flex items-center gap-2 px-6 font-medium"
                    onClick={() => onAddVehicle(client)}
                >
                    <Car size={16} /> Vincular Veículo
                </button>
            </div>
        </div>
    );
};

export default ClientDetails;
