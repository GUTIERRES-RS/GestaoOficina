import React from 'react';
import { User, Phone, Mail, FileText, Car, History, FilePlus, MessageCircle } from 'lucide-react';

const ClientDetails = ({ client, onViewHistory, onNewOS }) => {
    if (!client) return null;

    const initials = client.name
        ? client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'C';

    return (
        <div className="space-y-6">
            {/* Section 1: Dados do Cliente - Profile Pattern */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <User className="text-primary-color" size={20} />
                    <h3 className="font-bold text-lg">1. Dados do Cliente</h3>
                </div>

                <div className="profile-info-card">
                    <div className="avatar-initials">
                        {initials}
                    </div>
                    <div className="profile-details flex-1">
                        <h4 className="font-bold text-xl">{client.name}</h4>
                        <p className="text-secondary text-sm">Cliente Ativo</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div
                        className="p-4 rounded-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', paddingLeft: '0.5rem' }}
                    >
                        <p className="text-[10px] text-secondary font-bold tracking-wider uppercase opacity-70 mb-1">Telefone / WhatsApp</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary-color">
                            {client.phone || '-'}
                            {client.phone && (
                                <a
                                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-500 hover:scale-110 transition-transform ml-1"
                                >
                                    <MessageCircle size={14} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div
                        className="p-4 rounded-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', paddingLeft: '0.5rem' }}
                    >
                        <p className="text-[10px] text-secondary font-bold tracking-wider uppercase opacity-70 mb-1">E-mail</p>
                        <p className="text-sm font-bold text-primary-color truncate" title={client.email}>
                            {client.email || '-'}
                        </p>
                    </div>

                    <div
                        className="p-4 rounded-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', paddingLeft: '0.5rem' }}
                    >
                        <p className="text-[10px] text-secondary font-bold tracking-wider uppercase opacity-70 mb-1">CPF / CNPJ</p>
                        <p className="text-sm font-bold text-primary-color">
                            {client.document || '-'}
                        </p>
                    </div>

                    <div
                        className="p-4 rounded-none"
                        style={{ backgroundColor: 'var(--bg-tertiary)', paddingLeft: '0.5rem' }}
                    >
                        <p className="text-[10px] text-secondary font-bold tracking-wider uppercase opacity-70 mb-1">Cadastrado em</p>
                        <p className="text-sm font-bold text-primary-color">
                            {client.created_at ? new Date(client.created_at).toLocaleDateString('pt-BR') : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 2: Veículos Vinculados */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Car className="text-primary-color" size={20} />
                        <h3 className="font-bold text-lg">2. Veículos Vinculados</h3>
                    </div>
                    <span className="badge badge-warning">
                        {client.vehicles ? client.vehicles.length : 0} Veículo(s)
                    </span>
                </div>

                {client.vehicles && client.vehicles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {client.vehicles.map((v) => (
                            <div key={v.id} className="flex justify-between items-center p-4 bg-white border border-color rounded-xl hover:border-primary-color/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary-color group-hover:bg-primary-color group-hover:text-white transition-colors border border-primary/10">
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary-color leading-tight">
                                            {v.brand} {v.model}
                                        </p>
                                        <p className="text-xs text-secondary font-medium">
                                            PLACA: {v.plate} • {v.year || 'Ano N/I'} • {v.color || 'Cor N/I'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="btn btn-secondary p-2.5 rounded-lg border border-color hover:bg-tertiary transition-colors"
                                        title="Ver Histórico"
                                        onClick={() => onViewHistory(v)}
                                    >
                                        <History size={18} />
                                    </button>
                                    <button
                                        className="btn btn-primary p-2.5 rounded-lg shadow-sm"
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
                    <div className="text-center py-12 bg-tertiary border border-dashed border-color rounded-2xl">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                            <Car size={32} />
                        </div>
                        <p className="text-secondary font-medium">Nenhum veículo vinculado a este cliente.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDetails;
