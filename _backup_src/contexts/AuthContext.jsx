import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedUserId = localStorage.getItem('sim_session_user_id');
        if (storedUserId) {
            db.getUser(storedUserId)
                .then((u) => {
                    if (u) setUser(u);
                    else localStorage.removeItem('sim_session_user_id');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const u = await db.login(username, password);
        setUser(u);
        localStorage.setItem('sim_session_user_id', u.id);
        return u;
    };

    const register = async (data) => {
        const u = await db.register(data);
        setUser(u);
        localStorage.setItem('sim_session_user_id', u.id);
        return u;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sim_session_user_id');
    };

    const refreshUser = async () => {
        if (user?.id) {
            const updated = await db.getUser(user.id);
            setUser(updated);
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
