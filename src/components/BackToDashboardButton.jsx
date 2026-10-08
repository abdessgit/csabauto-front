import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Composant de retour au tableau de bord dynamique.
 * Redirige automatiquement vers le dashboard approprié selon le rôle de l'utilisateur :
 * - ROLE_ADMIN       -> /dashboard/admin       ("← Retour au tableau de bord admin")
 * - ROLE_MODERATEUR  -> /dashboard/moderateur  ("← Retour au tableau de bord modérateur")
 * - ROLE_CLIENT / par défaut -> /dashboard/client ("← Retour au tableau de bord")
 *
 * Priorité : ROLE_ADMIN > ROLE_MODERATEUR > ROLE_CLIENT
 */
export default function BackToDashboardButton({ className = 'rdv-back' }) {
    const { user } = useAuth();
    const roles = user?.roles || [];

    if (roles.includes('ROLE_ADMIN')) {
        return (
            <Link to="/dashboard/admin" className={className}>
                ← Retour au tableau de bord admin
            </Link>
        );
    }

    if (roles.includes('ROLE_MODERATEUR')) {
        return (
            <Link to="/dashboard/moderateur" className={className}>
                ← Retour au tableau de bord modérateur
            </Link>
        );
    }

    return (
        <Link to="/dashboard/client" className={className}>
            ← Retour au tableau de bord
        </Link>
    );
}
