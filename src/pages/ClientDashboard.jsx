import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getRendezVous } from '../api/rendezVous';
import { getVehicules } from '../api/vehicules';
import { getConversations } from '../api/conversations';
import { getFactures } from '../api/factures';
import '../assets/css/ClientDashboard.css';

function normalizeArray(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
}

export default function ClientDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [rendezVous, setRendezVous] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [factures, setFactures] = useState([]);
    const [loading, setLoading] = useState(true);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    const email = user?.email || 'Client';
    const firstName = user?.prenom || email.split('@')[0];
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);

                // Chargement parallèle de toutes les données du dashboard client
                const [rdvData, vehiculesData, conversationsData, facturesData] = await Promise.all([
                    getRendezVous().catch((err) => {
                        console.error('Erreur chargement rendez-vous :', err);
                        return [];
                    }),
                    getVehicules().catch((err) => {
                        console.error('Erreur chargement véhicules :', err);
                        return [];
                    }),
                    getConversations().catch((err) => {
                        console.error('Erreur chargement conversations :', err);
                        return [];
                    }),
                    getFactures().catch((err) => {
                        console.error('Erreur chargement factures :', err);
                        return [];
                    }),
                ]);

                const rdvItems = normalizeArray(rdvData);

                // On filtre et trie uniquement les rendez-vous confirmés par date croissante
                const rendezVousConfirmes = rdvItems
                    .filter((rdv) => rdv.statut === 'CONFIRME')
                    .sort(
                        (a, b) =>
                            new Date(a.dateHeure) -
                            new Date(b.dateHeure)
                    );

                setRendezVous(rendezVousConfirmes);
                setVehicules(normalizeArray(vehiculesData));
                setConversations(normalizeArray(conversationsData));
                setFactures(normalizeArray(facturesData));
            } catch (error) {
                console.error(
                    'Erreur chargement données dashboard client :',
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    function formatDate(date) {
        if (!date) {
            return '-';
        }

        return new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    function formatTime(date) {
        if (!date) {
            return '-';
        }

        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function getVehicleName(vehicule) {
        if (!vehicule) {
            return 'Véhicule';
        }

        const marque = vehicule.marque || '';
        const modele = vehicule.modele || '';

        const name = `${marque} ${modele}`.trim();

        return name || `Véhicule #${vehicule.id}`;
    }

    return (
        <div className="client-dashboard">

            {/* SIDEBAR OVERLAY */}
            {sidebarOpen && (
                <div
                    className="client-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`client-sidebar ${sidebarOpen ? 'client-sidebar--open' : ''}`}>

                <div className="client-sidebar-header">
                    <Link
                        to="/"
                        className="client-dashboard-logo"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span>CS</span>
                        <strong>AB AUTO</strong>
                    </Link>
                    <button
                        type="button"
                        className="client-sidebar-close"
                        aria-label="Fermer le menu"
                        onClick={() => setSidebarOpen(false)}
                    >
                        ×
                    </button>
                </div>

                <div className="client-sidebar-title">
                    MON ESPACE
                </div>

                <nav className="client-sidebar-nav">

                    <Link
                        to="/dashboard/client"
                        className="active"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span>⌂</span>
                        Tableau de bord
                    </Link>

                    <Link
                        to="/dashboard/client/rendez-vous"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span>◷</span>
                        Mes rendez-vous
                    </Link>

                    <Link
                        to="/dashboard/client/vehicules"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span>▣</span>
                        Mes véhicules
                    </Link>

                    <Link
                        to="/dashboard/client/demandes"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span>✉</span>
                        Mes demandes
                    </Link>

                    <Link
                        to="/dashboard/client/factures"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span>▤</span>
                        Mes factures
                    </Link>

                    <Link
                        to="/dashboard/client/profil"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span>◉</span>
                        Mon profil
                    </Link>

                </nav>

                <div className="client-sidebar-bottom">

                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            handleLogout();
                        }}
                        className="client-logout"
                    >
                        <span>↪</span>
                        Déconnexion
                    </button>

                </div>

            </aside>

            {/* MAIN */}
            <main className="client-main">

                {/* HEADER */}
                <header className="client-header">

                    <div className="client-header-left">
                        <button
                            type="button"
                            className="client-menu-toggle"
                            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                            aria-expanded={sidebarOpen}
                            onClick={() => setSidebarOpen(true)}
                        >
                            ☰
                        </button>
                        <div>
                            <p className="client-header-label">
                                ESPACE CLIENT
                            </p>

                            <h1>
                                Bonjour, <span>{firstName}</span>
                            </h1>
                        </div>
                    </div>

                    <div className="client-header-account">

                        <div className="client-avatar">
                            {firstName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <strong>{firstName}</strong>
                            <small>{email}</small>
                        </div>

                    </div>

                </header>

                {/* WELCOME */}
                <section className="client-welcome">

                    <div>
                        <p className="client-welcome-label">
                            CS AB AUTO
                        </p>

                        <h2>
                            Bienvenue dans<br />
                            <span>votre espace client.</span>
                        </h2>

                        <p>
                            Retrouvez ici vos rendez-vous, vos véhicules
                            et vos demandes auprès de notre garage.
                        </p>
                    </div>

                    <Link
                        to="/dashboard/client/rendez-vous"
                        className="client-welcome-button"
                    >
                        PRENDRE RENDEZ-VOUS →
                    </Link>

                </section>

                {/* STATS */}
                <section className="client-stats">

                    <div className="client-stat-card">

                        <div className="client-stat-icon">
                            ◷
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? '...'
                                    : rendezVous.length}
                            </strong>

                            <span>
                                Rendez-vous confirmés
                            </span>
                        </div>

                    </div>

                    <div className="client-stat-card">

                        <div className="client-stat-icon">
                            ▣
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? '...'
                                    : vehicules.length}
                            </strong>
                            <span>Véhicules</span>
                        </div>

                    </div>

                    <div className="client-stat-card">

                        <div className="client-stat-icon">
                            ✉
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? '...'
                                    : conversations.length}
                            </strong>
                            <span>Demandes</span>
                        </div>

                    </div>

                    <div className="client-stat-card">

                        <div className="client-stat-icon">
                            ▤
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? '...'
                                    : factures.length}
                            </strong>
                            <span>Factures</span>
                        </div>

                    </div>

                </section>

                {/* CONTENT */}
                <section className="client-content-grid">

                    {/* RENDEZ-VOUS */}
                    <div className="client-panel">

                        <div className="client-panel-header">

                            <div>
                                <p>AGENDA</p>
                                <h3>Mes rendez-vous</h3>
                            </div>

                            <Link to="/dashboard/client/rendez-vous">
                                VOIR TOUT →
                            </Link>

                        </div>

                        {loading ? (

                            <div className="client-empty">

                                <div className="client-empty-icon">
                                    ◷
                                </div>

                                <h4>
                                    Chargement...
                                </h4>

                                <p>
                                    Nous récupérons vos rendez-vous.
                                </p>

                            </div>

                        ) : rendezVous.length === 0 ? (

                            <div className="client-empty">

                                <div className="client-empty-icon">
                                    ◷
                                </div>

                                <h4>
                                    Aucun rendez-vous confirmé
                                </h4>

                                <p>
                                    Vos rendez-vous apparaîtront ici
                                    une fois confirmés par un modérateur.
                                </p>

                                <Link to="/dashboard/client/rendez-vous">
                                    PRENDRE RENDEZ-VOUS
                                </Link>

                            </div>

                        ) : (

                            <div className="client-rdv-list">

                                {rendezVous.slice(0, 3).map((rdv) => (

                                    <div
                                        className="client-rdv-card"
                                        key={rdv.id}
                                    >

                                        <div className="client-rdv-date">

                                            <strong>
                                                {formatDate(
                                                    rdv.dateHeure
                                                )}
                                            </strong>

                                            <span>
                                                {formatTime(
                                                    rdv.dateHeure
                                                )}
                                            </span>

                                        </div>

                                        <div className="client-rdv-info">

                                            <h4>
                                                {getVehicleName(
                                                    rdv.vehicule
                                                )}
                                            </h4>

                                            <p>
                                                {rdv.motif ||
                                                    'Rendez-vous au garage'}
                                            </p>

                                        </div>

                                        <div className="client-rdv-status">
                                            CONFIRMÉ
                                        </div>

                                    </div>

                                ))}

                                {rendezVous.length > 3 && (
                                    <Link
                                        to="/dashboard/client/rendez-vous"
                                        className="client-rdv-more"
                                    >
                                        Voir les {rendezVous.length} rendez-vous →
                                    </Link>
                                )}

                            </div>

                        )}

                    </div>

                    {/* VEHICULES */}
                    <div className="client-panel">

                        <div className="client-panel-header">

                            <div>
                                <p>GARAGE</p>
                                <h3>Mes véhicules</h3>
                            </div>

                            <Link to="/dashboard/client/vehicules">
                                VOIR TOUT →
                            </Link>

                        </div>

                        {loading ? (

                            <div className="client-empty">

                                <div className="client-empty-icon">
                                    ▣
                                </div>

                                <h4>
                                    Chargement...
                                </h4>

                                <p>
                                    Nous récupérons vos véhicules.
                                </p>

                            </div>

                        ) : vehicules.length === 0 ? (

                            <div className="client-empty">

                                <div className="client-empty-icon">
                                    ▣
                                </div>

                                <h4>
                                    Aucun véhicule
                                </h4>

                                <p>
                                    Ajoutez votre véhicule pour faciliter
                                    vos prochaines demandes.
                                </p>

                                <Link to="/dashboard/client/vehicules">
                                    AJOUTER UN VÉHICULE
                                </Link>

                            </div>

                        ) : (

                            <div className="client-rdv-list">

                                {vehicules.slice(0, 3).map((v) => (

                                    <div
                                        className="client-rdv-card"
                                        key={v.id}
                                    >

                                        <div className="client-rdv-date">

                                            <strong>
                                                {v.immatriculation || 'Sans immatriculation'}
                                            </strong>

                                            <span>
                                                {v.annee ? `Année ${v.annee}` : 'Véhicule'}
                                            </span>

                                        </div>

                                        <div className="client-rdv-info">

                                            <h4>
                                                {v.marque} {v.modele}
                                            </h4>

                                            <p>
                                                {v.kilometrage
                                                    ? `${Number(v.kilometrage).toLocaleString('fr-FR')} km`
                                                    : 'Kilométrage non renseigné'}
                                                {v.couleur ? ` • ${v.couleur}` : ''}
                                            </p>

                                        </div>

                                        <div className="client-rdv-status">
                                            ENREGISTRÉ
                                        </div>

                                    </div>

                                ))}

                                {vehicules.length > 3 && (
                                    <Link
                                        to="/dashboard/client/vehicules"
                                        className="client-rdv-more"
                                    >
                                        Voir les {vehicules.length} véhicules →
                                    </Link>
                                )}

                            </div>

                        )}

                    </div>

                </section>

                {/* FOOTER */}
                <footer className="client-footer">

                    © {new Date().getFullYear()} CS AB AUTO

                    <span>•</span>

                    Espace client

                </footer>

            </main>

        </div>
    );
}