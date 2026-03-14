import React from 'react';
import { Loader, Clock, Pencil, Printer, Calendar } from 'lucide-react';
import { StatusBadge } from '../../utils/statusStyles';
import TableEmptyState from '../../components/TableEmptyState';
import { formatMoney, formatDate } from '../../utils/format';

const OSList = ({ orders, loading, onView, onEdit, onPrint }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader className="animate-spin text-primary-color" size={32} />
                <span className="ml-2">Carregando ordens de serviço...</span>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Nº OS</th>
                        <th>Cliente / Veículo</th>
                        <th>Data Abertura</th>
                        <th>Data Entrega</th>
                        <th>Status</th>
                        <th>Mecânico</th>
                        <th>Valor Total</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length > 0 ? orders.map((os) => (
                        <tr key={os.id}>
                            <td className="font-bold text-primary-color">#{os.id}</td>
                            <td>
                                <div className="flex flex-col">
                                    <span className="font-semibold">{os.client_name}</span>
                                    <span className="text-xs text-secondary">{os.vehicle_model} ({os.plate}) {os.vehicle_km ? `- KM Entrada: ${Number(os.vehicle_km).toLocaleString('pt-BR')}` : ''}</span>
                                </div>
                            </td>
                            <td className="text-secondary text-sm">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} /> {formatDate(os.created_at)}
                                </div>
                            </td>
                            <td className="text-secondary text-sm">
                                {os.expected_delivery_date ? (
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} /> {formatDate(os.expected_delivery_date)}
                                    </div>
                                ) : (
                                    <span className="opacity-50">--</span>
                                )}
                            </td>
                            <td>
                                <StatusBadge status={os.status} />
                            </td>
                            <td className="text-secondary">{os.mechanic_name || '--'}</td>
                            <td className="font-semibold">{formatMoney(os.total_cost)}</td>
                            <td className="text-right">
                                <div className="action-buttons justify-end">
                                    <button className="btn-icon btn-edit" title="Editar" onClick={() => onEdit(os)}>
                                        <Pencil size={15} />
                                    </button>
                                    <button className="btn-icon btn-view" title="Imprimir" onClick={() => onPrint(os)}>
                                        <Printer size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <TableEmptyState
                            colSpan={8}
                            icon={Clock}
                            message="Nenhuma ordem de serviço encontrada."
                        />
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default OSList;
