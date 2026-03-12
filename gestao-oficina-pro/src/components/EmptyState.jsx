import React from 'react';
import './EmptyState.css';

const EmptyState = ({ icon: Icon, title, description, action }) => {
    return (
        <div className="empty-state-global animation-fade-in">
            {Icon && (
                <div className="empty-state-icon">
                    <Icon size={48} strokeWidth={1.5} />
                </div>
            )}
            {title && <h3 className="empty-state-title">{title}</h3>}
            {description && <p className="empty-state-desc">{description}</p>}
            {action && <div className="empty-state-action">{action}</div>}
        </div>
    );
};

export default EmptyState;
