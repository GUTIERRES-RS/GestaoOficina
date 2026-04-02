import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('@LocalSTRG:token');
        const storedUser = localStorage.getItem('@LocalSTRG:user');

        if (storedToken && storedUser) {
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;

        localStorage.setItem('@LocalSTRG:token', token);
        localStorage.setItem('@LocalSTRG:user', JSON.stringify(user));

        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('@LocalSTRG:token');
        localStorage.removeItem('@LocalSTRG:user');
        setUser(null);
    };

    const updateAuthUser = (updatedUser) => {
        const newUser = { ...user, ...updatedUser };
        localStorage.setItem('@LocalSTRG:user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ signed: !!user, user, login, logout, updateAuthUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    return context;
};
