import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardAdmin } from '../api/dashboard';
import { getMessagesContact } from '../api/contact';
import '../assets/css/DashboardModerateur.css';

function formatMontant(val) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(val || 0);
}

export default function DashboardAdmin() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        repartitionUtilisateurs: { CLIENT: 0, MODERATEUR: 0, ADMIN: 0 },
        totalVehicules: 0,
        totalAnnoncesEnVente: 0,
        chiffreAffaireMoisEnCours: 0,
        facturesEnAttente: 0,
        messagesContact: 0,
        nouveauxMessagesContact: 0,
    });

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const prenom =
        user?.prenom ||
        user?.email?.split('@')[0] ||
        'Administrateur';

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                setSidebarOpen(false);
            }
        }
        if (sidebarOpen) {
            document.body.classList.add('no-scroll');
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => {
            document.body.classList.remove('no-scroll');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [sidebarOpen]);

    async function loadData() {
        try {
            setLoading(true);
            setError('');
            const [data, contactData] = await Promise.all([
                getDashboardAdmin(),
                getMessagesContact().catch(() => ({ total: 0, nouveaux: 0 })),
            ]);
            setStats({
                repartitionUtilisateurs: data?.repartitionUtilisateurs || { CLIENT: 0, MODERATEUR: 0, ADMIN: 0 },
                totalVehicules: data?.totalVehicules || 0,
                totalAnnoncesEnVente: data?.totalAnnoncesEnVente || 0,
                chiffreAffaireMoisEnCours: data?.chiffreAffaireMoisEnCours || 0,
                facturesEnAttente: data?.facturesEnAttente || 0,
                messagesContact: contactData?.total || 0,
                nouveauxMessagesContact: contactData?.nouveaux || 0,
            });
        } catch (err) {
            console.error('Erreur chargement dashboard admin :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de charger les données du tableau de bord administrateur.'
            );
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        logout();
        navigate('/login');
    }

    if (loading) {
        return (
            <div className="moderateur-loading">
                <div className="moderateur-loader"></div>
                <p>Chargement du tableau de bord administrateur...</p>
            </div>
        );
    }

    return (
        <div className="moderateur-dashboard">

            {/* SIDEBAR OVERLAY */}
            {sidebarOpen && (
                <div
                    className="moderateur-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`moderateur-sidebar ${sidebarOpen ? 'moderateur-sidebar--open' : ''}`}>

                <div className="moderateur-logo">
                    <Link to="/" className="moderateur-logo-link" aria-label="Retour au site public CS AB AUTO">
                        <span>CS</span>
                        <strong>AB AUTO</strong>
                    </Link>
                    <button
                        type="button"
                        className="moderateur-sidebar-close"
                        aria-label="Fermer le menu"
                        onClick={() => setSidebarOpen(false)}
                    >
                        ×
                    </button>
                </div>

                <div className="moderateur-role">
                    ESPACE ADMINISTRATEUR
                </div>

                <nav className="moderateur-nav">

                    <button
                        className="active"
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/admin');
                        }}
                    >
                        <span>▣</span>
                        Tableau de bord
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/rendez-vous');
                        }}
                    >
                        <span>▦</span>
                        Rendez-vous
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/clients');
                        }}
                    >
                        <span>◉</span>
                        Clients
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/vehicules');
                        }}
                    >
                        <span>▱</span>
                        Véhicules
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/interventions');
                        }}
                    >
                        <span>🔧</span>
                        Interventions
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/factures');
                        }}
                    >
                        <span>▤</span>
                        Factures
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/annonces');
                        }}
                    >
                        <span>◇</span>
                        Annonces
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/conversations');
                        }}
                    >
                        <span>✉</span>
                        Conversations
                    </button>

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/messages-contact');
                        }}
                    >
                        <span>📩</span>
                        Messages Contact
                        {stats.nouveauxMessagesContact > 0 && (
                            <span className="moderateur-nav-badge">
                                {stats.nouveauxMessagesContact}
                            </span>
                        )}
                    </button>

                </nav>

                <div className="moderateur-sidebar-bottom">

                    <button
                        className="moderateur-profile-link"
                        onClick={() => {
                            setSidebarOpen(false);
                            navigate('/dashboard/moderateur/clients');
                        }}
                    >
                        <span>⚙</span>
                        Mon profil
                    </button>

                    <button
                        className="moderateur-logout"
                        onClick={() => {
                            setSidebarOpen(false);
                            handleLogout();
                        }}
                    >
                        <span>↪</span>
                        Déconnexion
                    </button>

                </div>

            </aside>

            {/* MAIN */}
            <main className="moderateur-main">

                <header className="moderateur-header">

                    <div className="moderateur-header-left">
                        <button
                            type="button"
                            className="moderateur-menu-toggle"
                            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                            aria-expanded={sidebarOpen}
                            onClick={() => setSidebarOpen(true)}
                        >
                            ☰
                        </button>
                        <div>
                            <p className="moderateur-header-label">
                                ESPACE ADMINISTRATEUR
                            </p>

                            <h1>
                                Tableau de bord
                            </h1>
                        </div>
                    </div>

                    <div className="moderateur-user">

                        <div className="moderateur-avatar" style={{ background: '#f5c400', color: '#111' }}>
                            {prenom.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {prenom}
                            </strong>

                            <span>
                                Administrateur
                            </span>
                        </div>

                    </div>

                </header>

                {error && (
                    <div style={{ margin: '20px 40px 0', padding: '15px 20px', background: '#ffe0e0', color: '#a50000', borderRadius: '8px' }}>
                        {error}
                    </div>
                )}

                {/* WELCOME */}
                <section className="moderateur-welcome">

                    <div>
                        <span>CS AB AUTO — ADMINISTRATION</span>

                        <h2>
                            Bonjour {prenom} 👋
                        </h2>

                        <p>
                            Supervisez les statistiques globales, les finances et la gestion générale du garage.
                        </p>
                    </div>

                    <div className="moderateur-welcome-mark">
                        CS
                    </div>

                </section>

                {/* STATS PRINCIPALES */}
                <section className="moderateur-stats">

                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon yellow">
                            💶
                        </div>

                        <div>
                            <span>CHIFFRE D'AFFAIRES (MOIS)</span>
                            <strong>{formatMontant(stats.chiffreAffaireMoisEnCours)}</strong>
                        </div>
                    </div>

                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon">
                            ▤
                        </div>

                        <div>
                            <span>FACTURES EN ATTENTE</span>
                            <strong>{stats.facturesEnAttente}</strong>
                        </div>
                    </div>

                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon">
                            🚗
                        </div>

                        <div>
                            <span>VÉHICULES AU TOTAL</span>
                            <strong>{stats.totalVehicules}</strong>
                        </div>
                    </div>

                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon">
                            ◇
                        </div>

                        <div>
                            <span>ANNONCES EN VENTE</span>
                            <strong>{stats.totalAnnoncesEnVente}</strong>
                        </div>
                    </div>

                </section>

                {/* RÉPARTITION DES UTILISATEURS */}
                <div style={{ margin: '30px 40px 10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>
                        RÉPARTITION DES UTILISATEURS
                    </h3>
                </div>

                <section className="moderateur-secondary-stats">

                    <div>
                        <span>COMPTES CLIENTS</span>
                        <strong>{stats.repartitionUtilisateurs?.CLIENT ?? 0}</strong>
                    </div>

                    <div>
                        <span>MODÉRATEURS</span>
                        <strong>{stats.repartitionUtilisateurs?.MODERATEUR ?? 0}</strong>
                    </div>

                    <div>
                        <span>ADMINISTRATEURS</span>
                        <strong>{stats.repartitionUtilisateurs?.ADMIN ?? 0}</strong>
                    </div>

                </section>

                {/* ACCÈS RAPIDES DE GESTION */}
                <div style={{ margin: '35px 40px 15px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>
                        GESTION DU GARAGE
                    </h3>
                </div>

                <div className="moderateur-content-grid" style={{ paddingTop: 0 }}>

                    <div className="moderateur-panel" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/moderateur/clients')}>
                        <div className="moderateur-panel-header">
                            <div>
                                <span>UTILISATEURS</span>
                                <h3>Gestion des Clients & Équipe</h3>
                            </div>
                            <span style={{ fontSize: '20px' }}>◉</span>
                        </div>
                        <p style={{ margin: '15px 0 0', color: '#666', fontSize: '13px' }}>
                            Consultez les clients inscrits, assignez les rôles et suivez les historiques de véhicules.
                        </p>
                    </div>

                    <div className="moderateur-panel" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/moderateur/factures')}>
                        <div className="moderateur-panel-header">
                            <div>
                                <span>FINANCES</span>
                                <h3>Gestion des Factures</h3>
                            </div>
                            <span style={{ fontSize: '20px' }}>▤</span>
                        </div>
                        <p style={{ margin: '15px 0 0', color: '#666', fontSize: '13px' }}>
                            Téléchargez les factures au format PDF, filtrez par période et gérez les statuts de paiement.
                        </p>
                    </div>

                    <div className="moderateur-panel" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/moderateur/rendez-vous')}>
                        <div className="moderateur-panel-header">
                            <div>
                                <span>PLANNING</span>
                                <h3>Rendez-vous de l'Atelier</h3>
                            </div>
                            <span style={{ fontSize: '20px' }}>▦</span>
                        </div>
                        <p style={{ margin: '15px 0 0', color: '#666', fontSize: '13px' }}>
                            Visualisez les demandes de rendez-vous et assignez les modérateurs ou techniciens.
                        </p>
                    </div>

                    <div className="moderateur-panel" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/moderateur/interventions')}>
                        <div className="moderateur-panel-header">
                            <div>
                                <span>ATELIER</span>
                                <h3>Interventions & Prestations</h3>
                            </div>
                            <span style={{ fontSize: '20px' }}>🔧</span>
                        </div>
                        <p style={{ margin: '15px 0 0', color: '#666', fontSize: '13px' }}>
                            Suivez les réparations en cours, configurez les services et générez les factures finales.
                        </p>
                    </div>

                    <div className="moderateur-panel" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/moderateur/messages-contact')}>
                        <div className="moderateur-panel-header">
                            <div>
                                <span>COMMUNICATION</span>
                                <h3>Messages de Contact</h3>
                            </div>
                            <span style={{ fontSize: '20px' }}>📩</span>
                        </div>
                        <p style={{ margin: '15px 0 0', color: '#666', fontSize: '13px' }}>
                            Consultez les demandes des visiteurs ({stats.messagesContact} reçus
                            {stats.nouveauxMessagesContact > 0 ? `, dont ${stats.nouveauxMessagesContact} non traités` : ''}) et répondez par e-mail.
                        </p>
                    </div>

                </div>

            </main>

        </div>
    );
}
