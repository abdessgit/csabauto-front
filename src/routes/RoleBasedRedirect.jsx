import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleBasedRedirect() {
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

    // Redirige vers le dashboard admin si ROLE_ADMIN
    if (roles.includes('ROLE_ADMIN')) {
        return <Navigate to="/dashboard/admin" replace />;
    }

    // Redirige vers le dashboard modérateur si ROLE_MODERATEUR
    if (roles.includes('ROLE_MODERATEUR')) {
        return <Navigate to="/dashboard/moderateur" replace />;
    }

    // Redirige vers le dashboard client si ROLE_CLIENT (et pas modérateur/admin)
    if (roles.includes('ROLE_CLIENT')) {
        return <Navigate to="/dashboard/client" replace />;
    }

    // Fallback par défaut si aucun rôle reconnu
    return <Navigate to="/login" replace />;
}
