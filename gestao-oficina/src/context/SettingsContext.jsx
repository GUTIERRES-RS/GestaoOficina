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
        const savedTheme = localStorage.getItem('@GestaoOficinaPro:theme');
        return {
            workshop_name: '',
            workshop_phone: '',
            workshop_email: '',
            workshop_address: '',
            workshop_document: '',
            theme: savedTheme || 'dark',
            currency: 'BRL',
            logo_url: null,
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
            const token = localStorage.getItem('@GestaoOficinaPro:token');
            
            let res;
            if (token) {
                // Tenta buscar configurações completas se tiver token
                res = await api.get('/settings');
            } else {
                // Caso contrário, busca apenas o que é público (logo e tema)
                res = await api.get('/settings/public');
            }

            if (res.data) {
                setSettings(prev => ({ ...prev, ...res.data }));
                if (res.data.theme) {
                    localStorage.setItem('@GestaoOficinaPro:theme', res.data.theme);
                }
            }
        } catch (error) {
            // Se falhou ao buscar as completas por 401, tenta as públicas
            if (error.response?.status === 401) {
                try {
                    const publicRes = await api.get('/settings/public');
                    if (publicRes.data) {
                        setSettings(prev => ({ ...prev, ...publicRes.data }));
                        if (publicRes.data.theme) {
                            localStorage.setItem('@GestaoOficinaPro:theme', publicRes.data.theme);
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
            localStorage.setItem('@GestaoOficinaPro:theme', settings.theme);
        }
    }, [settings.theme]);

    useEffect(() => {
        if (settings.logo_url) {
            const link = document.querySelector("link[rel~='icon']");
            if (link) {
                link.href = settings.logo_url;
            } else {
                const newLink = document.createElement('link');
                newLink.rel = 'icon';
                newLink.href = settings.logo_url;
                document.getElementsByTagName('head')[0].appendChild(newLink);
            }
        }
    }, [settings.logo_url]);

    const updateSettingsState = (newSettings) => {
        setSettings(newSettings);
        if (newSettings.theme) {
            localStorage.setItem('@GestaoOficinaPro:theme', newSettings.theme);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateSettingsState }}>
            {children}
        </SettingsContext.Provider>
    );
};
