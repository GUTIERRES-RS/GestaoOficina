import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Mail, KeyRound } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            // Assume toast error is handled by the api interceptor, but we can also set local error state if needed
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container animation-fade-in">
            <div className="login-card card">
                <div className="login-header">
                    {settings?.logo_url ? (
                        <div className="login-logo-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <img src={settings.logo_url} alt="Logo" style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <div className="logo-icon-wrap login-logo">
                            <Wrench size={28} color="white" />
                        </div>
                    )}
                    <h2>Gestão Oficina <span className="text-primary">Pro</span></h2>
                    <p className="text-secondary">Faça login para acessar o sistema</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">E-mail</label>
                        <div className="form-input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                id="email"
                                className="form-control form-control-with-icon"
                                placeholder="seu@email.com.br"
                                defaultValue="admin@oficinapro.com.br"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="form-label mb-0" htmlFor="password">Senha</label>
                            <a href="#" className="text-sm">Esqueceu a senha?</a>
                        </div>
                        <div className="form-input-wrapper">
                            <KeyRound className="input-icon" size={18} />
                            <input
                                type="password"
                                id="password"
                                className="form-control form-control-with-icon"
                                placeholder="••••••••"
                                defaultValue="123456"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full login-btn" disabled={loading}>
                        {loading ? 'Acessando...' : 'Entrar no Sistema'}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="text-sm text-secondary">
                        Ainda não tem conta? <a href="#">Cadastre sua oficina</a>
                    </p>
                </div>
            </div>

            {/* Visual background element */}
            <div className="login-bg-shape"></div>
        </div>
    );
};

export default Login;
