import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('@GestaoOficinaPro:token');
        const storedUser = localStorage.getItem('@GestaoOficinaPro:user');

        if (storedToken && storedUser) {
            setUser(JSON.parse(storedUser));
            api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        }
        
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;

        localStorage.setItem('@GestaoOficinaPro:token', token);
        localStorage.setItem('@GestaoOficinaPro:user', JSON.stringify(user));

        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('@GestaoOficinaPro:token');
        localStorage.removeItem('@GestaoOficinaPro:user');
        setUser(null);
        api.defaults.headers.Authorization = '';
    };

    const updateAuthUser = (updatedUser) => {
        const newUser = { ...user, ...updatedUser };
        localStorage.setItem('@GestaoOficinaPro:user', JSON.stringify(newUser));
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
