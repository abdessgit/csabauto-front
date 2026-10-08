import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                Chargement...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const roles = user.roles || [];
    const isStaff = roles.includes('ROLE_MODERATEUR') || roles.includes('ROLE_ADMIN');

    if (requiredRole === 'ROLE_CLIENT') {
        // Redirige le staff vers son dashboard respectif s'il tente d'accéder aux routes client
        if (roles.includes('ROLE_ADMIN')) {
            return <Navigate to="/dashboard/admin" replace />;
        }
        if (roles.includes('ROLE_MODERATEUR')) {
            return <Navigate to="/dashboard/moderateur" replace />;
        }
        // Redirige si l'utilisateur n'a pas le rôle client
        if (!roles.includes('ROLE_CLIENT')) {
            return <Navigate to="/login" replace />;
        }
    }

    if (requiredRole === 'ROLE_MODERATEUR') {
        // Redirige un client vers son espace client s'il tente d'accéder aux routes modérateur
        if (!isStaff) {
            return <Navigate to="/dashboard/client" replace />;
        }
    }

    if (requiredRole === 'ROLE_ADMIN') {
        if (!roles.includes('ROLE_ADMIN')) {
            return <Navigate to={isStaff ? '/dashboard/moderateur' : '/dashboard/client'} replace />;
        }
    }

    return children;
}