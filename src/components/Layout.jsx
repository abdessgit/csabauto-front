import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    const isStaff = user?.roles?.includes('ROLE_MODERATEUR');

    return (
        <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ddd' }}>
                <nav style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/">Accueil</Link>
                    <Link to="/vehicules">Mes véhicules</Link>
                    {isStaff && <Link to="/admin/rendez-vous">Gestion RDV</Link>}
                    {isStaff && <Link to="/admin/annonces">Gestion annonces</Link>}
                </nav>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span>{user?.email} ({isStaff ? 'Staff' : 'Client'})</span>
                    <button onClick={handleLogout}>Déconnexion</button>
                </div>
            </header>
            <main style={{ padding: '1rem' }}>
                <Outlet />
            </main>
        </div>
    );
}