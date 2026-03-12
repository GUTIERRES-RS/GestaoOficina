import React from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, size }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className={`modal-content animation-fade-in ${size || ''}`}>
                <div className="modal-header">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button className="btn-icon" onClick={onClose} aria-label="Fechar modal" title="Fechar">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
