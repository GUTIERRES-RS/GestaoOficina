import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionContext = createContext({});

export const ConnectionProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [checking, setChecking] = useState(false);
    const [isInitialCheck, setIsInitialCheck] = useState(true);

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

    const checkConnection = async () => {
        setChecking(true);
        try {
            // Tenta uma rota simples de health check
            await axios.get(`http://${window.location.hostname}:3000/api/health`, { timeout: 3000 });
            setIsConnected(true);
        } catch (error) {
            if (!error.response) {
                setIsConnected(false);
            } else {
                // Se o servidor respondeu (mesmo com erro), ele está de pé
                setIsConnected(true);
            }
        } finally {
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
