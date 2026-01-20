import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/hooks';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Configure API headers
            // Note: api interceptors in hooks.js should handle this, 
            // but we need to ensure token is set if we were using axios defaults.
            // For now, let's rely on hooks.js interceptor which reads from localStorage.
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, [token]);


    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.data);
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { user, token } = res.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        return user;
    };

    const register = async (email, password, name) => {
        const res = await api.post('/auth/register', { email, password, name });
        const { user, token } = res.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem('token', token);
        return user;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
