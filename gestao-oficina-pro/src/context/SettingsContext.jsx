import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        workshop_name: 'Oficina Pro',
        workshop_phone: '',
        workshop_email: '',
        workshop_address: '',
        workshop_document: '',
        theme: 'dark',
        currency: 'BRL'
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            if (res.data) {
                setSettings(res.data);
            }
        } catch (error) {
            console.error('Error fetching settings in context:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
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
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateSettingsState }}>
            {children}
        </SettingsContext.Provider>
    );
};
