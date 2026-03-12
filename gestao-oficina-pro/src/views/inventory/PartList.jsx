import React from 'react';
import { Loader, Edit, Trash2, ArrowUpCircle, ArrowDownCircle, Package } from 'lucide-react';
import TableEmptyState from '../../components/TableEmptyState';
import { formatMoney } from '../../utils/format';

const PartList = ({ 
    inventory, 
    filteredInventory, 
    loading, 
    getStatusInfo,
    onEdit,
    onDelete,
    onAdjustStock 
}) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader className="animate-spin text-primary-color" size={32} />
                <span className="ml-2">Carregando estoque...</span>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nome da Peça</th>
                        <th>Estoque Atual</th>
                        <th>Estoque Mínimo</th>
                        <th>Preço Custo</th>
                        <th>Preço Venda</th>
                        <th className="text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInventory.length > 0 ? filteredInventory.map((item, idx) => {
                        const status = getStatusInfo(item.stock_quantity, item.min_stock);
                        return (
                            <tr key={idx}>
                                <td className="text-xs font-medium text-secondary">{item.code || `INT-${item.id}`}</td>
                                <td className="font-medium">{item.name}</td>
                                <td>
                                    <span className={`badge ${status.color}`}>
                                        {item.stock_quantity} un
                                    </span>
                                </td>
                                <td className="text-secondary">{item.min_stock} un</td>
                                <td>{formatMoney(item.cost_price)}</td>
                                <td className="font-semibold">{formatMoney(item.sale_price)}</td>
                                <td className="text-right">
                                    <div className="action-buttons justify-end gap-2">
                                        <button 
                                            className="btn-icon text-success hover-bg" 
                                            title="Entrada de Estoque"
                                            onClick={() => onAdjustStock(item, 'entrada')}
                                        >
                                            <ArrowUpCircle size={16} />
                                        </button>
                                        <button 
                                            className="btn-icon text-warning hover-bg" 
                                            title="Saída de Estoque"
                                            onClick={() => onAdjustStock(item, 'saida')}
                                        >
                                            <ArrowDownCircle size={16} />
                                        </button>
                                        <button 
                                            className="btn-icon text-primary-color hover-bg" 
                                            title="Editar Peça"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            className="btn-icon text-danger hover-bg" 
                                            title="Excluir Peça"
                                            onClick={() => onDelete(item)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    }) : (
                        <TableEmptyState
                            colSpan={7}
                            icon={Package}
                            message="Nenhuma peça encontrada no estoque."
                        />
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PartList;
