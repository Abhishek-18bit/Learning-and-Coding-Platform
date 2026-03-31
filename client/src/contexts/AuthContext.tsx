import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/authToken';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMe = async () => {
            const token = getAuthToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get<{ success: boolean; user: User }>('/users/me');
                setUser(response.data.user);
            } catch (error) {
                clearAuthToken();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, []);

    const login = (token: string, userData: User) => {
        setAuthToken(token);
        setUser(userData);
    };

    const logout = () => {
        clearAuthToken();
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        setUser((prev) => (prev ? { ...prev, ...updates } : prev));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
