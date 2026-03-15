import React from 'react';
import { Loader, Eye, Pencil, Trash2, MessageCircle, Users } from 'lucide-react';
import TableEmptyState from '../../components/TableEmptyState';
import { formatDate } from '../../utils/format';

const ClientTable = ({ clients, loading, onView, onEdit, onDelete }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader className="animate-spin text-primary-color" size={32} />
                <span className="ml-2">Carregando clientes...</span>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Nome / Empresa</th>
                        <th>Telefone / WhatsApp</th>
                        <th>Documento</th>
                        <th>Cadastro</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.length > 0 ? clients.map((client) => (
                        <tr key={client.id}>
                            <td>
                                <div className="avatar-name">
                                    <div className="avatar-initials">
                                        {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <span className="name">{client.name}</span>
                                </div>
                            </td>
                            <td>
                                <div className="flex items-center gap-2">
                                    <span>{client.phone || '-'}</span>
                                    {client.phone && (
                                        <a
                                            href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-whatsapp"
                                            title="Abrir no WhatsApp"
                                            aria-label="Chamar no WhatsApp"
                                        >
                                            <MessageCircle size={16} />
                                        </a>
                                    )}
                                </div>
                            </td>
                            <td className="text-secondary">{client.document || '-'}</td>
                            <td className="text-secondary">
                                {formatDate(client.created_at)}
                            </td>
                            <td className="text-right">
                                <div className="action-buttons justify-end">
                                    <button className="btn-icon btn-view" title="Visualizar" onClick={() => onView(client)}>
                                        <Eye size={15} />
                                    </button>
                                    <button className="btn-icon btn-edit" title="Editar" onClick={() => onEdit(client)}>
                                        <Pencil size={15} />
                                    </button>
                                    <button className="btn-icon btn-del" title="Excluir" onClick={() => onDelete(client.id)}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <TableEmptyState
                            colSpan={5}
                            icon={Users}
                            message="Nenhum cliente encontrado."
                        />
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ClientTable;
