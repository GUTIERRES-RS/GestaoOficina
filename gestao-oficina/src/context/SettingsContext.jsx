import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const auth = useAuth();
    const signed = auth?.signed;

    const [settings, setSettings] = useState(() => {
        const savedTheme = localStorage.getItem('@LocalSTRG:theme');
        const savedPublic = localStorage.getItem('@LocalSTRG:public_settings');
        let initialPublic = {};
        try {
            initialPublic = savedPublic ? JSON.parse(savedPublic) : {};
        } catch (e) {
            console.warn('Erro ao ler cache de marca no context:', e);
        }

        return {
            workshop_name: initialPublic.workshop_name || '',
            workshop_phone: '',
            workshop_email: '',
            workshop_address: '',
            workshop_document: '',
            theme: initialPublic.theme || savedTheme || 'dark',
            currency: 'BRL',
            logo_url: initialPublic.logo_url || null,
            whatsapp: '',
            review_days: 30,
            next_os_number: 1,
            items_per_page: null
        };
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('@LocalSTRG:token');

            // Se já temos dados carregados pelo index.html (window.__PUBLIC_SETTINGS__) 
            // e NÃO estamos logados, usamos eles em vez de fazer outro fetch
            if (!token && window.__PUBLIC_SETTINGS__ && !signed) {
                setSettings(prev => ({ ...prev, ...window.__PUBLIC_SETTINGS__ }));
                setLoading(false);
                return;
            }

            let res;
            if (token) {
                res = await api.get('/settings');
            } else {
                res = await api.get('/settings/public');
            }

            if (res.data) {
                setSettings(prev => ({ ...prev, ...res.data }));
                
                // Persistência para o anti-flash no próximo load
                if (res.data.workshop_name || res.data.logo_url) {
                    const publicData = {
                        workshop_name: res.data.workshop_name,
                        logo_url: res.data.logo_url,
                        theme: res.data.theme
                    };
                    localStorage.setItem('@LocalSTRG:public_settings', JSON.stringify(publicData));
                }

                if (res.data.theme) {
                    localStorage.setItem('@LocalSTRG:theme', res.data.theme);
                }
            }
        } catch (error) {
            if (error.response?.status === 401) {
                try {
                    const publicRes = await api.get('/settings/public');
                    if (publicRes.data) {
                        setSettings(prev => ({ ...prev, ...publicRes.data }));
                        localStorage.setItem('@LocalSTRG:public_settings', JSON.stringify(publicRes.data));
                        if (publicRes.data.theme) {
                            localStorage.setItem('@LocalSTRG:theme', publicRes.data.theme);
                        }
                    }
                } catch (publicError) {
                    console.error('Error fetching public settings:', publicError);
                }
            } else {
                console.error('Error fetching settings in context:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [signed]);

    useEffect(() => {
        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
            localStorage.setItem('@LocalSTRG:theme', settings.theme);
        }
    }, [settings.theme]);

    useEffect(() => {
        if (settings.logo_url) {
            let link = document.getElementById('dynamic-favicon');
            if (link) {
                link.href = settings.logo_url;
            } else {
                link = document.createElement('link');
                link.rel = 'icon';
                link.id = 'dynamic-favicon';
                link.href = settings.logo_url;
                document.getElementsByTagName('head')[0].appendChild(link);
            }
        }
    }, [settings.logo_url]);

    useEffect(() => {
        if (settings.workshop_name) {
            document.title = settings.workshop_name;
        }
    }, [settings.workshop_name]);

    const updateSettingsState = (newSettings) => {
        setSettings(newSettings);
        if (newSettings.theme) {
            localStorage.setItem('@LocalSTRG:theme', newSettings.theme);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateSettingsState }}>
            {children}
        </SettingsContext.Provider>
    );
};
