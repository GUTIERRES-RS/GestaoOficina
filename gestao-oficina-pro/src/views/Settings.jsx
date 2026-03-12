import React, { useState, useEffect } from 'react';
import { Building2, User, Monitor, Save, Loader, Settings as SettingsIcon, Upload, Hash, Phone, Mail, MapPin, Globe } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
    const { settings: globalSettings, updateSettingsState } = useSettings();
    const { user, updateAuthUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('workshop');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(globalSettings);

    // Profile state
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: ''
    });

    useEffect(() => {
        setSettings(globalSettings);
    }, [globalSettings]);

    useEffect(() => {
        if (user) {
            setProfileForm(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['workshop', 'profile', 'system'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/configuracoes?tab=${tab}`);
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            setSettings(res.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Erro ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (activeTab === 'profile') {
                const res = await api.put(`/users/profile/${user.id}`, profileForm);
                updateAuthUser({ name: profileForm.name, email: profileForm.email });
                setProfileForm(prev => ({ ...prev, password: '' })); // clear password
                toast.success('Perfil atualizado com sucesso!');
            } else {
                await api.put('/settings', settings);
                updateSettingsState(settings);
                toast.success('Configurações salvas com sucesso!');
            }
        } catch (error) {
            console.error('Error saving:', error);
            const msg = error.response?.data?.message || 'Erro ao salvar alterações.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('A imagem deve ter no máximo 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({
                    ...prev,
                    logo_url: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin text-accent-color" size={32} />
                <span className="ml-2">Carregando configurações...</span>
            </div>
        );
    }

    return (
        <div className="settings-container animation-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title"><SettingsIcon size={24} /> Configurações</h1>
                    <p className="page-subtitle">Gerencie os dados da sua oficina e preferências do sistema</p>
                </div>
            </div>

            <div className="settings-layout">
                {/* Sidebar Tabs */}
                <div className="settings-sidebar card">
                    <button
                        className={`settings-tab-btn ${activeTab === 'workshop' ? 'active' : ''}`}
                        onClick={() => handleTabChange('workshop')}
                    >
                        <Building2 size={20} />
                        <span>Dados da Oficina</span>
                    </button>
                    <button
                        className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => handleTabChange('profile')}
                    >
                        <User size={20} />
                        <span>Meu Perfil</span>
                    </button>
                    <button
                        className={`settings-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                        onClick={() => handleTabChange('system')}
                    >
                        <Monitor size={20} />
                        <span>Sistema</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="settings-content card">
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'workshop' && (
                            <div className="tab-pane animation-fade-in">
                                <h3 className="section-title">Informações da Oficina</h3>
                                <p className="section-desc">Estes dados serão utilizados em notas e comprovantes.</p>

                                {/* Group 1: Identity */}
                                <div className="settings-group">
                                    <div className="group-header">
                                        <Building2 size={20} />
                                        <h4>Identidade da Oficina</h4>
                                    </div>
                                    
                                    <div className="logo-upload-container mb-8">
                                        <div className="logo-preview">
                                            {settings.logo_url ? (
                                                <img src={settings.logo_url} alt="Logo da Oficina" className="logo-image" />
                                            ) : (
                                                <div className="logo-placeholder">
                                                    <Building2 size={40} className="text-secondary" />
                                                    <span className="text-sm text-secondary">Sem Logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="logo-upload-actions">
                                            <label htmlFor="logo-upload" className="btn btn-primary cursor-pointer">
                                                <Upload size={18} /> Selecionar Logo
                                            </label>
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                accept="image/png, image/jpeg, image/jpg, image/webp"
                                                className="hidden"
                                                onChange={handleLogoUpload}
                                            />
                                            <p className="text-xs text-secondary">PNG, JPG até 2MB. Recomendado: Fundo transparente.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Nome da Oficina</label>
                                            <div className="form-input-wrapper">
                                                <Building2 className="input-icon" size={18} />
                                                <input
                                                    type="text"
                                                    name="workshop_name"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.workshop_name}
                                                    onChange={handleChange}
                                                    placeholder="Ex: Auto Mecânica Silva"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">CNPJ / CPF</label>
                                            <div className="form-input-wrapper">
                                                <Hash className="input-icon" size={18} />
                                                <input
                                                    type="text"
                                                    name="workshop_document"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.workshop_document}
                                                    onChange={handleChange}
                                                    placeholder="00.000.000/0000-00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 2: Contacts */}
                                <div className="settings-group">
                                    <div className="group-header">
                                        <Phone size={20} />
                                        <h4>Canais de Atendimento</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Telefone Fixo</label>
                                            <div className="form-input-wrapper">
                                                <Phone className="input-icon" size={18} />
                                                <input
                                                    type="text"
                                                    name="workshop_phone"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.workshop_phone || ''}
                                                    onChange={handleChange}
                                                    placeholder="(00) 0000-0000"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">WhatsApp</label>
                                            <div className="form-input-wrapper">
                                                <Phone className="input-icon" size={18} />
                                                <input
                                                    type="text"
                                                    name="whatsapp"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.whatsapp || ''}
                                                    onChange={handleChange}
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">E-mail de Contato</label>
                                            <div className="form-input-wrapper">
                                                <Mail className="input-icon" size={18} />
                                                <input
                                                    type="email"
                                                    name="workshop_email"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.workshop_email || ''}
                                                    onChange={handleChange}
                                                    placeholder="contato@oficina.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">URL da Logomarca (Backup)</label>
                                            <div className="form-input-wrapper">
                                                <Globe className="input-icon" size={18} />
                                                <input
                                                    type="url"
                                                    name="logo_url"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.logo_url || ''}
                                                    onChange={handleChange}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 3: Location */}
                                <div className="settings-group">
                                    <div className="group-header">
                                        <MapPin size={20} />
                                        <h4>Localização</h4>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Endereço Completo</label>
                                        <div className="form-input-wrapper items-start">
                                            <MapPin className="input-icon mt-3" size={18} />
                                            <textarea
                                                name="workshop_address"
                                                className="form-control form-control-with-icon"
                                                rows="3"
                                                value={settings.workshop_address}
                                                onChange={handleChange}
                                                placeholder="Rua, Número, Bairro, Cidade - UF"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="tab-pane animation-fade-in">
                                <h3 className="section-title">Meu Perfil</h3>
                                <p className="section-desc">Gerencie suas informações de acesso.</p>

                                <div className="profile-info-card">
                                    <div className="avatar-initials">
                                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                                    </div>
                                    <div className="profile-details">
                                        <h4 className="font-bold">{user?.name}</h4>
                                        <p className="text-secondary text-sm">{user?.email}</p>
                                    </div>
                                </div>

                                {/* Group 1: Personal Info */}
                                <div className="settings-group mt-8">
                                    <div className="group-header">
                                        <User size={20} />
                                        <h4>Informações de Acesso</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Nome Completo</label>
                                            <div className="form-input-wrapper">
                                                <User className="input-icon" size={18} />
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    className="form-control form-control-with-icon" 
                                                    value={profileForm.name} 
                                                    onChange={handleProfileChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">E-mail de Login</label>
                                            <div className="form-input-wrapper">
                                                <Mail className="input-icon" size={18} />
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    className="form-control form-control-with-icon" 
                                                    value={profileForm.email} 
                                                    onChange={handleProfileChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 2: Security */}
                                <div className="settings-group">
                                    <div className="group-header">
                                        <Monitor size={20} />
                                        <h4>Segurança</h4>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Alterar Senha <span className="text-muted text-xs font-normal">(Opcional)</span></label>
                                        <div className="form-input-wrapper">
                                            <Monitor className="input-icon" size={18} />
                                            <input 
                                                type="password" 
                                                name="password"
                                                className="form-control form-control-with-icon" 
                                                placeholder="Digite a nova senha se desejar alterar"
                                                value={profileForm.password}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 border border-info-color border-opacity-20 bg-info-light rounded-lg">
                                        <p className="text-info-text text-sm">Estas alterações entrarão em vigor imediatamente após salvar.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="tab-pane animation-fade-in">
                                <h3 className="section-title">Preferências do Sistema</h3>
                                <p className="section-desc">Personalize sua experiência de uso.</p>

                                {/* Group 1: Visuals */}
                                <div className="settings-group mt-6">
                                    <div className="group-header">
                                        <Monitor size={20} />
                                        <h4>Interface e Localização</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Tema Visual</label>
                                            <div className="form-input-wrapper">
                                                <Monitor className="input-icon" size={18} />
                                                <select
                                                    name="theme"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.theme || 'light'}
                                                    onChange={handleChange}
                                                >
                                                    <option value="light">Claro (Padrão)</option>
                                                    <option value="dark">Escuro (Premium)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Moeda Principal</label>
                                            <div className="form-input-wrapper">
                                                <Globe className="input-icon" size={18} />
                                                <select
                                                    name="currency"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.currency || 'BRL'}
                                                    onChange={handleChange}
                                                >
                                                    <option value="BRL">Real (R$)</option>
                                                    <option value="USD">Dólar ($)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 2: Business Rules */}
                                <div className="settings-group">
                                    <div className="group-header">
                                        <Save size={20} />
                                        <h4>Regras e Automação</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="form-label">Prazos de Garantia (Dias)</label>
                                            <div className="form-input-wrapper">
                                                <MapPin className="input-icon" size={18} />
                                                <input
                                                    type="number"
                                                    name="review_days"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.review_days || ''}
                                                    onChange={handleChange}
                                                    placeholder="Ex: 30"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Próximo Nº Ordem de Serviço</label>
                                            <div className="form-input-wrapper">
                                                <Hash className="input-icon" size={18} />
                                                <input
                                                    type="number"
                                                    name="next_os_number"
                                                    className="form-control form-control-with-icon"
                                                    value={settings.next_os_number || ''}
                                                    onChange={handleChange}
                                                    placeholder="Contador OS"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end mt-8 pt-6 border-t border-color">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={saving}
                                style={{ padding: '0.75rem 2rem' }}
                            >
                                {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                                <span className="ml-2">Salvar Alterações</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
