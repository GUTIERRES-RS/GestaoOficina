import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    itemsPerPage, 
    totalItems,
    onItemsPerPageChange 
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="pagination-container">
            <div className="pagination-info text-sm text-secondary">
                Mostrando <span className="font-semibold">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> a{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
                <span className="font-semibold">{totalItems}</span> registros
            </div>

            <div className="pagination-controls flex items-center gap-1">
                <button
                    className="btn-icon btn-secondary"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="Primeira Página"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    className="btn-icon btn-secondary"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Anterior"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 mx-2">
                    {getPageNumbers().map(page => (
                        <button
                            key={page}
                            className={`btn-page ${currentPage === page ? 'active' : ''}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    className="btn-icon btn-secondary"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Próxima"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    className="btn-icon btn-secondary"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Última Página"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
