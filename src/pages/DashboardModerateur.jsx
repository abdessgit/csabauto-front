import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
    getUtilisateurs,
    getRendezVous,

    getInterventions,
    getFactures,
    getConversations,
    getAnnonces,
} from '../api/moderateur';
import { getMessagesContact } from '../api/contact';
import { getVehicules } from '../api/vehicules';
import '../assets/css/DashboardModerateur.css';

export default function DashboardModerateur() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        clients: 0,
        vehicules: 0,
        rendezVous: 0,
        interventions: 0,
        factures: 0,
        conversations: 0,
        annonces: 0,
        messagesContact: 0,
        nouveauxMessagesContact: 0,
    });

    const [rendezVous, setRendezVous] = useState([]);
    const [interventions, setInterventions] = useState([]);
    const [conversations, setConversations] = useState([]);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const prenom =
        user?.prenom ||
        user?.email?.split('@')[0] ||
        'Modérateur';

    useEffect(() => {
        loadDashboard();
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

    async function loadDashboard() {
        try {
            setLoading(true);

            const [
                utilisateurs,
                vehicules,
                rendezVousData,
                interventionsData,
                factures,
                conversationsData,
                annonces,
                messagesContactData,
            ] = await Promise.all([
                getUtilisateurs(),
                getVehicules(),
                getRendezVous(),
                getInterventions(),
                getFactures(),
                getConversations(),
                getAnnonces(),
                getMessagesContact().catch(() => ({ total: 0, nouveaux: 0 })),
            ]);

            setStats({
                clients: utilisateurs.length,
                vehicules: vehicules.length,
                rendezVous: rendezVousData.length,
                interventions: interventionsData.length,
                factures: factures.length,
                conversations: conversationsData.length,
                annonces: annonces.length,
                messagesContact: messagesContactData.total || 0,
                nouveauxMessagesContact: messagesContactData.nouveaux || 0,
            });

            setRendezVous(rendezVousData);
            setInterventions(interventionsData);
            setConversations(conversationsData);

        } catch (error) {
            console.error(
                'Erreur chargement dashboard modérateur :',
                error
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
                <p>Chargement du tableau de bord...</p>
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
                    ESPACE MODÉRATEUR
                </div>

                <nav className="moderateur-nav">

                    <button
                        className="active"
                        onClick={() => setSidebarOpen(false)}
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
                                ESPACE MODÉRATEUR
                            </p>

                            <h1>
                                Tableau de bord
                            </h1>
                        </div>
                    </div>

                    <div className="moderateur-user">

                        <div className="moderateur-avatar">
                            {prenom.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {prenom}
                            </strong>

                            <span>
                                Modérateur
                            </span>
                        </div>

                    </div>

                </header>


                {/* WELCOME */}

                <section className="moderateur-welcome">

                    <div>
                        <span>
                            CS AB AUTO
                        </span>

                        <h2>
                            Bonjour {prenom} 👋
                        </h2>

                        <p>
                            Gérez les rendez-vous, clients,
                            véhicules et interventions du garage.
                        </p>
                    </div>

                    <div className="moderateur-welcome-mark">
                        CS
                    </div>

                </section>


                {/* STATS */}

                <section className="moderateur-stats">

                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon">
                            ◉
                        </div>

                        <div>
                            <span>CLIENTS</span>
                            <strong>{stats.clients}</strong>
                        </div>
                    </div>


                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon">
                            🚗
                        </div>

                        <div>
                            <span>VÉHICULES</span>
                            <strong>{stats.vehicules}</strong>
                        </div>
                    </div>


                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon">
                            ▦
                        </div>

                        <div>
                            <span>RENDEZ-VOUS</span>
                            <strong>{stats.rendezVous}</strong>
                        </div>
                    </div>


                    <div className="moderateur-stat-card">
                        <div className="moderateur-stat-icon yellow">
                            🔧
                        </div>

                        <div>
                            <span>INTERVENTIONS</span>
                            <strong>{stats.interventions}</strong>
                        </div>
                    </div>

                </section>


                {/* SECOND STATS */}

                <section className="moderateur-secondary-stats">

                    <div>
                        <span>FACTURES</span>
                        <strong>{stats.factures}</strong>
                    </div>

                    <div>
                        <span>CONVERSATIONS</span>
                        <strong>{stats.conversations}</strong>
                    </div>

                    <div>
                        <span>ANNONCES</span>
                        <strong>{stats.annonces}</strong>
                    </div>

                    <div
                        onClick={() => navigate('/dashboard/moderateur/messages-contact')}
                        style={{ cursor: 'pointer' }}
                    >
                        <span>MESSAGES CONTACT</span>
                        <strong>
                            {stats.messagesContact}
                            {stats.nouveauxMessagesContact > 0 && (
                                <span style={{ fontSize: '13px', color: '#f5c400', marginLeft: '6px' }}>
                                    ({stats.nouveauxMessagesContact} nouv.)
                                </span>
                            )}
                        </strong>
                    </div>

                </section>


                {/* CONTENT */}

                <section className="moderateur-content-grid">

                    {/* RENDEZ-VOUS */}

                    <div className="moderateur-panel">

                        <div className="moderateur-panel-header">

                            <div>
                                <span>PLANNING</span>

                                <h3>
                                    Rendez-vous
                                </h3>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(
                                        '/dashboard/moderateur/rendez-vous'
                                    )
                                }
                            >
                                Voir tout →
                            </button>

                        </div>

                        {rendezVous.length === 0 ? (

                            <div className="moderateur-empty">
                                Aucun rendez-vous.
                            </div>

                        ) : (

                            rendezVous
                                .slice(0, 5)
                                .map((rdv) => (

                                    <div
                                        className="moderateur-list-item"
                                        key={rdv.id}
                                    >

                                        <div className="moderateur-item-icon">
                                            ▦
                                        </div>

                                        <div className="moderateur-item-info">

                                            <strong>
                                                Rendez-vous #{rdv.id}
                                            </strong>

                                            <span>
                                                {rdv.motif || 'Intervention'}
                                            </span>

                                        </div>

                                        <span className="moderateur-item-status">
                                            {rdv.statut || 'EN_ATTENTE'}
                                        </span>

                                    </div>

                                ))

                        )}

                    </div>


                    {/* INTERVENTIONS */}

                    <div className="moderateur-panel">

                        <div className="moderateur-panel-header">

                            <div>
                                <span>ATELIER</span>

                                <h3>
                                    Interventions
                                </h3>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(
                                        '/dashboard/moderateur/interventions'
                                    )
                                }
                            >
                                Voir tout →
                            </button>

                        </div>

                        {interventions.length === 0 ? (

                            <div className="moderateur-empty">
                                Aucune intervention.
                            </div>

                        ) : (

                            interventions
                                .slice(0, 5)
                                .map((intervention) => (

                                    <div
                                        className="moderateur-list-item"
                                        key={intervention.id}
                                    >

                                        <div className="moderateur-item-icon yellow">
                                            🔧
                                        </div>

                                        <div className="moderateur-item-info">

                                            <strong>
                                                Intervention #{intervention.id}
                                            </strong>

                                            <span>
                                                {intervention.description ||
                                                    'Intervention véhicule'}
                                            </span>

                                        </div>

                                        <span className="moderateur-item-status">
                                            {intervention.statut || 'EN_COURS'}
                                        </span>

                                    </div>

                                ))

                        )}

                    </div>

                </section>


                {/* CONVERSATIONS */}

                <section className="moderateur-panel moderateur-conversations">

                    <div className="moderateur-panel-header">

                        <div>
                            <span>MESSAGERIE</span>

                            <h3>
                                Conversations récentes
                            </h3>
                        </div>

                        <button
                            onClick={() =>
                                navigate(
                                    '/dashboard/moderateur/conversations'
                                )
                            }
                        >
                            Voir tout →
                        </button>

                    </div>

                    {conversations.length === 0 ? (

                        <div className="moderateur-empty">
                            Aucune conversation.
                        </div>

                    ) : (

                        conversations
                            .slice(0, 5)
                            .map((conversation) => (

                                <div
                                    className="moderateur-list-item"
                                    key={conversation.id}
                                >

                                    <div className="moderateur-item-icon">
                                        ✉
                                    </div>

                                    <div className="moderateur-item-info">

                                        <strong>
                                            Conversation #{conversation.id}
                                        </strong>

                                        <span>
                                            {conversation.statut ||
                                                'OUVERTE'}
                                        </span>

                                    </div>

                                </div>

                            ))

                    )}

                </section>


                <footer className="moderateur-footer">
                    © {new Date().getFullYear()} CS AB AUTO
                </footer>

            </main>

        </div>
    );
}