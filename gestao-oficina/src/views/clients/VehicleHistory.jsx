import React, { useState, useEffect } from 'react';
import { Loader, History } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { StatusBadge } from '../../utils/statusStyles';
import { formatMoney, formatDate } from '../../utils/format';
import Pagination from '../../components/Pagination';
import { useSettings } from '../../context/SettingsContext';

const VehicleHistory = ({ history, loading }) => {
    const { settings } = useSettings();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = Number(settings?.items_per_page) || 10;

    // Reset to first page when history changes
    useEffect(() => {
        setCurrentPage(1);
    }, [history]);

    // Pagination Logic
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const currentItems = history.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="vehicle-history p-2">
            {loading ? (
                <div className="flex justify-center py-6">
                    <Loader className="animate-spin text-primary-color" size={24} />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="table-responsive">
                        {currentItems.length > 0 ? (
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
                                    {currentItems.map((os) => (
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

                    {history.length > itemsPerPage && (
                        <div className="pt-4 border-t border-color">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                itemsPerPage={itemsPerPage}
                                totalItems={history.length}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleHistory;
