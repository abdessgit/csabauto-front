import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const decoded = jwtDecode(token);

            const connectedUser = {
                id: decoded.id,
                email: decoded.username,
                roles: decoded.roles || [],
            };

            setUser(connectedUser);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Token invalide :', error);
            }

            localStorage.removeItem('token');
            setUser(null);
        }

        setLoading(false);
    }, []);

    async function login(email, password) {
        const response = await apiLogin(email, password);

        if (!response.token) {
            throw new Error('Token JWT absent de la réponse');
        }

        localStorage.setItem('token', response.token);

        const decoded = jwtDecode(response.token);

        const connectedUser = {
            id: decoded.id,
            email: decoded.username,
            roles: decoded.roles || [],
        };

        setUser(connectedUser);

        return connectedUser;
    }

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}