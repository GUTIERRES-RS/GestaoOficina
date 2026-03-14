import React from 'react';
import { Trash2, AlertTriangle, Loader } from 'lucide-react';
import Modal from './Modal';

/**
 * Standardized confirmation modal for destructive actions (deletions).
 * Following the system's premium aesthetic.
 */
const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirmar Exclusão", 
    message = "Tem certeza que deseja excluir este item?", 
    itemName = "", 
    isLoading = false,
    confirmText = "Sim, Excluir",
    cancelText = "Cancelar",
    variant = "danger" // danger, warning
}) => {
    
    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <button 
                className="btn btn-secondary" 
                onClick={onClose} 
                disabled={isLoading}
            >
                {cancelText}
            </button>
            <button 
                className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-warning'} px-6 shadow-lg`} 
                onClick={onConfirm} 
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader className="animate-spin" size={18} />
                        <span>Processando...</span>
                    </div>
                ) : confirmText}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
            size="medium"
        >
            <div className="py-6 text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${variant === 'danger' ? 'bg-danger/10 text-danger-color' : 'bg-warning/10 text-warning-color'}`}>
                    {variant === 'danger' ? <Trash2 size={40} className="opacity-80" /> : <AlertTriangle size={40} className="opacity-80" />}
                </div>
                
                <h3 className="text-xl font-bold text-primary-color mb-2">
                    {message}
                </h3>
                
                {itemName && (
                    <div className="inline-block px-4 py-2 rounded-lg bg-tertiary border border-color font-bold text-lg mb-4">
                        {itemName}
                    </div>
                )}
                
                <p className="text-secondary max-w-sm mx-auto">
                    {variant === 'danger' 
                        ? "Esta ação é permanente e não poderá ser desfeita após a confirmação." 
                        : "Por favor, revise as informações antes de prosseguir com esta alteração."}
                </p>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
