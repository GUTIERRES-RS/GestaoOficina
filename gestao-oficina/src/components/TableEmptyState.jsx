import React from 'react';

const TableEmptyState = ({ colSpan, icon: Icon, message }) => {
    return (
        <tr>
            <td colSpan={colSpan} className="text-center py-12 text-secondary px-4">
                <div className="flex flex-col items-center justify-center gap-3 opacity-70">
                    {Icon && <Icon size={40} strokeWidth={1} />}
                    <p className="text-sm font-medium m-0">{message}</p>
                </div>
            </td>
        </tr>
    );
};

export default TableEmptyState;
