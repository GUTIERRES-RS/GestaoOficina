import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ConnectionContext = createContext({});

export const ConnectionProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [checking, setChecking] = useState(false);
    const [isInitialCheck, setIsInitialCheck] = useState(true);
    const checkingRef = useRef(false);

    useEffect(() => {
        const handleFailure = () => {
            setIsConnected(false);
        };

        window.addEventListener('api-connection-failed', handleFailure);

        // Verificação inicial de conexão
        checkConnection();

        return () => {
            window.removeEventListener('api-connection-failed', handleFailure);
        };
    }, []);

    // Polling de Auto-reconexão
    useEffect(() => {
        let interval;
        if (!isConnected) {
            // Se perdeu a conexão, checa a cada 5 segundos
            interval = setInterval(() => {
                checkConnection();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isConnected]);

    const checkConnection = async () => {
        if (checkingRef.current) return;
        checkingRef.current = true;
        setChecking(true);
        try {
            // Tenta uma rota simples de health check dinamicamente via baseURL flexível
            const apiPort = import.meta.env.VITE_API_PORT || 3000;
            const baseUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:${apiPort}/api`;
            await axios.get(`${baseUrl}/health`, { timeout: 3000 });
            setIsConnected(true);
        } catch (error) {
            if (!error.response) {
                setIsConnected(false);
            } else {
                // Se o servidor respondeu (mesmo com erro), ele está de pé
                setIsConnected(true);
            }
        } finally {
            checkingRef.current = false;
            setChecking(false);
            setIsInitialCheck(false);
        }
    };

    const setConnectionFailed = () => {
        setIsConnected(false);
    };

    return (
        <ConnectionContext.Provider value={{ isConnected, checking, isInitialCheck, checkConnection, setConnectionFailed }}>
            {children}
        </ConnectionContext.Provider>
    );
};

export const useConnection = () => {
    const context = useContext(ConnectionContext);
    return context;
};
