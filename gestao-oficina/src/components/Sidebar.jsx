import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Car,
    Wrench,
    Package,
    BadgeDollarSign,
    Settings,
    X,
    Wrench as LogoIcon,
    UserCog,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { settings } = useSettings();
    const { user, logout } = useAuth();
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
        { name: 'Veículos', path: '/veiculos', icon: <Car size={20} /> },
        { name: 'Ordens de Serviço', path: '/os', icon: <Wrench size={20} /> },
        { name: 'Estoque', path: '/estoque', icon: <Package size={20} /> },
        { name: 'Financeiro', path: '/financeiro', icon: <BadgeDollarSign size={20} /> },
        { name: 'Mecânicos', path: '/mecanicos', icon: <UserCog size={20} /> },
        { name: 'Comissões', path: '/comissoes', icon: <TrendingUp size={20} /> },
        { name: 'Usuários', path: '/usuarios', icon: <ShieldCheck size={20} /> },
        { name: 'Configurações', path: '/configuracoes', icon: <Settings size={20} /> },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        {settings?.logo_url ? (
                            <div className="logo-icon-wrap" style={{ background: 'transparent', width: 'auto', padding: 0 }}>
                                <img src={settings.logo_url} alt="Logo" style={{ maxHeight: '32px', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                        ) : (
                            <div className="logo-icon-wrap">
                                <LogoIcon size={20} color="white" />
                            </div>
                        )}
                        <span className="logo-text">Gestão Oficina <br /><span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-secondary)' }}>Versão - 1.0</span></span>
                    </div>
                    <button className="close-btn mobile-only" onClick={() => setIsOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <Link to="/configuracoes?tab=profile" className="user-profile-link">
                        <div className="user-profile">
                            <div className="avatar">
                                <UserCog size={18} />
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.name ? user.name.split(' ')[0] : 'Indefinido'}</span>
                                <span className="user-role" title={user?.role || ''}>
                                    {user?.role}
                                </span>
                            </div>
                        </div>
                    </Link>
                    <button
                        className="logout-btn"
                        onClick={logout}
                        title="Sair do sistema"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s',
                            marginTop: '0.5rem',
                            width: '100%',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--danger-color)';
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <X size={18} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
