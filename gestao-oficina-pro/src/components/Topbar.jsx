import React from 'react';
import { Menu, Bell, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Topbar.css';

const Topbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="menu-btn mobile-only" onClick={toggleSidebar}>
                    <Menu size={24} aria-hidden="true" />
                </button>
            </div>

            <div className="topbar-right">
                <button className="icon-btn">
                    <Bell size={20} aria-hidden="true" />
                    <span className="notification-badge"></span>
                </button>

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
