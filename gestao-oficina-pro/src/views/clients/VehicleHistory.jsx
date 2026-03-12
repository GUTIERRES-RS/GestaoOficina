import React from 'react';
import { Loader, History } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { StatusBadge } from '../../utils/statusStyles';
import { formatMoney, formatDate } from '../../utils/format';

const VehicleHistory = ({ history, loading, vehicleName }) => {
    return (
        <div className="vehicle-history p-2">
            {loading ? (
                <div className="flex justify-center py-6">
                    <Loader className="animate-spin text-primary-color" size={24} />
                </div>
            ) : (
                <div className="table-responsive">
                    {history.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th>OS #</th>
                                    <th>Data</th>
                                    <th>Problema</th>
                                    <th>Serviço Executado</th>
                                    <th>Status</th>
                                    <th className="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((os) => (
                                    <tr key={os.id} className="border-b border-color text-sm">
                                        <td className="py-3 font-bold text-primary-color">#{String(os.id).padStart(4, '0')}</td>
                                        <td className="py-3 text-secondary">{formatDate(os.created_at)}</td>
                                        <td className="py-3">
                                            {(os.problem_reported || '').length > 30
                                                ? (os.problem_reported || '').substring(0, 30) + '...'
                                                : (os.problem_reported || '--')}
                                        </td>
                                        <td className="py-3 text-secondary">
                                            {os.service_provided
                                                ? (os.service_provided.length > 30
                                                    ? os.service_provided.substring(0, 30) + '...'
                                                    : os.service_provided)
                                                : <span className="text-xs italic text-slate-400">Não informado</span>}
                                        </td>
                                        <td className="py-3">
                                            <StatusBadge status={os.status} />
                                        </td>
                                        <td className="py-3 font-semibold text-right">
                                            {formatMoney(os.total_cost)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState
                            icon={History}
                            title="Nenhuma Ordem de Serviço"
                            description="Não há histórico de O.S. para este veículo."
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleHistory;
