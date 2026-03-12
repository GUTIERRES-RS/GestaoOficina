import { Loader, History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import TableEmptyState from '../../components/TableEmptyState';

const MovementHistory = ({ movements, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader className="animate-spin text-primary-color" size={32} />
                <span className="ml-2">Carregando movimentações...</span>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Data e Hora</th>
                        <th>Tipo</th>
                        <th>Peça</th>
                        <th className="text-center">Quantidade</th>
                        <th>Observação</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.length > 0 ? movements.map((mov, idx) => (
                        <tr key={idx}>
                            <td className="text-secondary font-medium">
                                {new Date(mov.created_at).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </td>
                            <td>
                                <div className={`badge ${mov.type === 'entrada' ? 'badge-success' : 'badge-danger'} gap-1.5`}>
                                    {mov.type === 'entrada' ? (
                                        <ArrowUpCircle size={14} />
                                    ) : (
                                        <ArrowDownCircle size={14} />
                                    )}
                                    {mov.type === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                                </div>
                            </td>
                            <td className="font-semibold text-primary-color">{mov.part_name}</td>
                            <td className="text-center font-bold">
                                <span className={mov.type === 'entrada' ? 'text-success' : 'text-danger'}>
                                    {mov.type === 'entrada' ? '+' : '-'}{mov.quantity} un
                                </span>
                            </td>
                            <td className="text-sm text-secondary italic">
                                {mov.obs || <span className="text-tertiary">Sem observação</span>}
                            </td>
                        </tr>
                    )) : (
                        <TableEmptyState
                            colSpan={5}
                            icon={History}
                            message="Nenhuma movimentação registrada no histórico."
                        />
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MovementHistory;
