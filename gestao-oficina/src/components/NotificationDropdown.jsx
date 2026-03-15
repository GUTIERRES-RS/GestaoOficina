import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, ChevronRight } from 'lucide-react';
import './NotificationDropdown.css';

const NotificationDropdown = ({ reminders, onClose }) => {
    const navigate = useNavigate();

    const handleItemClick = () => {
        navigate('/financeiro');
        onClose();
    };

    const hasOverdue = reminders.overdue && reminders.overdue.length > 0;
    const hasPending = reminders.pending && reminders.pending.length > 0;
    const isEmpty = !hasOverdue && !hasPending;

    return (
        <div className="notification-dropdown">
            <div className="dropdown-header">
                <h3>Lembretes de Pagamento</h3>
            </div>
            
            <div className="dropdown-content">
                {isEmpty ? (
                    <div className="empty-notifications">
                        <p>Nenhum pagamento pendente.</p>
                    </div>
                ) : (
                    <>
                        {hasOverdue && (
                            <div className="notification-section">
                                <h4 className="section-title overdue">Vencidos</h4>
                                {reminders.overdue.map(item => (
                                    <div key={item.id} className="notification-item overdue" onClick={handleItemClick}>
                                        <div className="item-icon">
                                            <AlertCircle size={18} />
                                        </div>
                                        <div className="item-info">
                                            <p className="item-desc">{item.description}</p>
                                            <span className="item-amount">R$ {parseFloat(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            <span className="item-date">Venceu em: {new Date(item.payment_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                        </div>
                                        <ChevronRight size={16} className="item-arrow" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasPending && (
                            <div className="notification-section">
                                <h4 className="section-title pending">Próximos Vencimentos</h4>
                                {reminders.pending.map(item => (
                                    <div key={item.id} className="notification-item" onClick={handleItemClick}>
                                        <div className="item-icon">
                                            <Clock size={18} />
                                        </div>
                                        <div className="item-info">
                                            <p className="item-desc">{item.description}</p>
                                            <span className="item-amount">R$ {parseFloat(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            <span className="item-date">Vencimento: {item.payment_date ? new Date(item.payment_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem data'}</span>
                                        </div>
                                        <ChevronRight size={16} className="item-arrow" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <div className="dropdown-footer">
                <button onClick={() => { navigate('/financeiro'); onClose(); }}>Ver todas as finanças</button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
