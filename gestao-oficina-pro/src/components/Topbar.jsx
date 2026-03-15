import React, { useState, useEffect } from 'react';
import { Menu, Bell, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import reminderService from '../services/reminderService';
import NotificationDropdown from './NotificationDropdown';
import './Topbar.css';

const Topbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState({ pending: [], overdue: [], total: 0 });
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const data = await reminderService.getReminders();
                setReminders(data);
            } catch (error) {
                console.error('Falha ao carregar lembretes:', error);
            }
        };

        fetchReminders();
        // Atualiza a cada 5 minutos
        const interval = setInterval(fetchReminders, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="menu-btn mobile-only" onClick={toggleSidebar}>
                    <Menu size={24} aria-hidden="true" />
                </button>
            </div>

            <div className="topbar-right">
                <div className="notification-wrapper">
                    <button className="icon-btn" onClick={() => setShowDropdown(!showDropdown)}>
                        <Bell size={20} aria-hidden="true" />
                        {reminders.total > 0 && (
                            <span className="notification-badge">{reminders.total}</span>
                        )}
                    </button>
                    {showDropdown && (
                        <NotificationDropdown 
                            reminders={reminders} 
                            onClose={() => setShowDropdown(false)} 
                        />
                    )}
                </div>

                <Link to="/configuracoes?tab=profile" className="user-profile-link">
                    <div className="user-profile">
                        <div className="avatar">
                            <UserCog size={18} aria-hidden="true" />
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.name ? user.name.split(' ')[0] : 'Administrador'}</span>
                            <small className="user-role">{user?.role}</small>
                        </div>
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Topbar;
