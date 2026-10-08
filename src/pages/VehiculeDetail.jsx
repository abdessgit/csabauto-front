import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getAnnoncePublique } from '../api/annonces';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, PLACEHOLDER_CAR_IMAGE } from '../utils/imageUrl';
import '../assets/css/VehiculeDetail.css';

export default function VehiculeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [annonce, setAnnonce] = useState(null);
    const [activePhoto, setActivePhoto] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // État pour la visionneuse Lightbox plein écran
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        async function fetchDetail() {
            setLoading(true);
            setError('');
            try {
                const data = await getAnnoncePublique(id);
                setAnnonce(data);
                const photos = Array.isArray(data.photos) ? data.photos : [];
                const first = photos[0] || data.imagePrincipale || '';
                setActivePhoto(first);
            } catch (err) {
                console.error('Erreur chargement détail véhicule :', err);
                if (err.response?.status === 404) {
                    setError('Ce véhicule n’est plus disponible ou l’annonce a été retirée.');
                } else {
                    setError('Impossible de charger les informations de ce véhicule.');
                }
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchDetail();
        }
    }, [id]);

    const isSold = annonce?.statut === 'VENDUE' || annonce?.statut === 'VENDU';

    const photosList = Array.isArray(annonce?.photos) && annonce.photos.length > 0
        ? annonce.photos
        : (annonce?.imagePrincipale ? [annonce.imagePrincipale] : []);

    function openLightbox(photoToOpen) {
        let index = photosList.indexOf(photoToOpen);
        if (index === -1) index = 0;
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    }

    function closeLightbox() {
        setIsLightboxOpen(false);
    }

    function nextPhoto() {
        if (photosList.length <= 1) return;
        setLightboxIndex((prev) => (prev + 1) % photosList.length);
    }

    function prevPhoto() {
        if (photosList.length <= 1) return;
        setLightboxIndex((prev) => (prev - 1 + photosList.length) % photosList.length);
    }

    // Gestion du scroll et des touches clavier pour la Lightbox
    useEffect(() => {
        if (!isLightboxOpen) return;

        document.body.classList.add('no-scroll');

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowRight') {
                nextPhoto();
            } else if (e.key === 'ArrowLeft') {
                prevPhoto();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.classList.remove('no-scroll');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isLightboxOpen, photosList.length]);

    function handleContactGarage() {
        if (!annonce || isSold) return;

        if (user) {
            // Client déjà connecté : redirection directe vers la page Mes Demandes
            navigate(`/dashboard/client/demandes?annonceId=${annonce.id}`, {
                state: { annonceId: annonce.id },
            });
        } else {
            // Utilisateur non connecté : redirection vers login avec mémo pour revenir
            navigate('/login', {
                state: {
                    redirectTo: `/dashboard/client/demandes?annonceId=${annonce.id}`,
                    redirectState: { annonceId: annonce.id },
                    message: 'Connectez-vous à votre espace client pour faire une demande sur ce véhicule.',
                },
            });
        }
    }

    return (
        <div className="vehicule-detail-page">
            <Navbar />

            <main className="vehicule-detail-main">
                {/* BREADCRUMB */}
                <div className="vehicule-breadcrumb">
                    <Link to="/">Accueil</Link>
                    <span>/</span>
                    <Link to="/vehicules">Nos véhicules</Link>
                    <span>/</span>
                    <span className="current">
                        {annonce?.titre || (loading ? 'Chargement...' : 'Véhicule')}
                    </span>
                </div>

                {loading ? (
                    <div className="vehicule-detail-loading">
                        <p>Chargement des caractéristiques du véhicule...</p>
                    </div>
                ) : error || !annonce ? (
                    <div className="vehicule-detail-error">
                        <div style={{ fontSize: '42px', marginBottom: '15px' }}>🚗</div>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px' }}>
                            {error || 'Véhicule introuvable'}
                        </h2>
                        <p style={{ color: '#777', marginBottom: '25px' }}>
                            Le véhicule que vous cherchez n’est actuellement pas accessible.
                        </p>
                        <Link to="/vehicules" className="btn-contact-garage" style={{ display: 'inline-flex', width: 'auto' }}>
                            ← Retour aux véhicules disponibles
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* MAIN LAYOUT */}
                        <div className="vehicule-detail-layout">
                            {/* GALERIE PHOTOS */}
                            <div className="vehicule-gallery">
                                <div
                                    className="vehicule-gallery-main"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openLightbox(activePhoto)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openLightbox(activePhoto);
                                        }
                                    }}
                                    title="Cliquer pour afficher la photo en grand"
                                    aria-label="Agrandir la photo"
                                >
                                    <img
                                        src={getImageUrl(activePhoto)}
                                        alt={annonce.titre}
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = PLACEHOLDER_CAR_IMAGE;
                                        }}
                                    />
                                    <span className="vehicule-gallery-zoom-hint">
                                        🔍 Agrandir
                                    </span>
                                    {isSold && (
                                        <div className="vehicule-gallery-sold-badge">
                                            VÉHICULE VENDU
                                        </div>
                                    )}
                                </div>

                                {photosList.length > 1 && (
                                    <div className="vehicule-gallery-thumbs">
                                        {photosList.map((photo, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={`vehicule-gallery-thumb ${activePhoto === photo ? 'active' : ''
                                                    }`}
                                                onClick={() => {
                                                    setActivePhoto(photo);
                                                }}
                                                onDoubleClick={() => openLightbox(photo)}
                                                title={`Photo ${index + 1} - Cliquer pour sélectionner`}
                                            >
                                                <img
                                                    src={getImageUrl(photo)}
                                                    alt={`Vue ${index + 1}`}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.target.src = PLACEHOLDER_CAR_IMAGE;
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* FICHE SYNTHÉTIQUE ET ACTION */}
                            <div className="vehicule-info-card">
                                <div className="vehicule-info-header">
                                    {(annonce.marque || annonce.modele) && (
                                        <span className="vehicule-info-brand">
                                            {annonce.marque} {annonce.modele}
                                        </span>
                                    )}
                                    <h1 className="vehicule-info-title">{annonce.titre}</h1>

                                    <div className="vehicule-price-row">
                                        <div className="vehicule-main-price">
                                            {Number(annonce.prix || 0).toLocaleString('fr-FR')} <span>€</span>
                                        </div>
                                        <span
                                            className={`vehicule-status-tag ${isSold ? 'status-tag-sold' : 'status-tag-available'
                                                }`}
                                        >
                                            {isSold ? 'VENDU' : 'DISPONIBLE'}
                                        </span>
                                    </div>
                                </div>

                                {/* TABLEAU DES CARACTÉRISTIQUES */}
                                <div className="vehicule-specs-table">
                                    <div className="spec-item">
                                        <span className="spec-item-label">Année</span>
                                        <span className="spec-item-value">{annonce.annee || '-'}</span>
                                    </div>

                                    <div className="spec-item">
                                        <span className="spec-item-label">Kilométrage</span>
                                        <span className="spec-item-value">
                                            {annonce.kilometrage !== undefined && annonce.kilometrage !== null
                                                ? `${Number(annonce.kilometrage).toLocaleString('fr-FR')} km`
                                                : '-'}
                                        </span>
                                    </div>

                                    <div className="spec-item">
                                        <span className="spec-item-label">Carburant</span>
                                        <span className="spec-item-value">
                                            {annonce.carburant
                                                ? annonce.carburant.charAt(0).toUpperCase() +
                                                annonce.carburant.slice(1)
                                                : '-'}
                                        </span>
                                    </div>

                                    <div className="spec-item">
                                        <span className="spec-item-label">Boîte de vitesses</span>
                                        <span className="spec-item-value">
                                            {annonce.boite
                                                ? annonce.boite.charAt(0).toUpperCase() +
                                                annonce.boite.slice(1)
                                                : '-'}
                                        </span>
                                    </div>

                                    {annonce.puissance && (
                                        <div className="spec-item">
                                            <span className="spec-item-label">Puissance</span>
                                            <span className="spec-item-value">{annonce.puissance} ch</span>
                                        </div>
                                    )}

                                    {annonce.couleur && (
                                        <div className="spec-item">
                                            <span className="spec-item-label">Couleur</span>
                                            <span className="spec-item-value">{annonce.couleur}</span>
                                        </div>
                                    )}

                                    {annonce.nbPortes && (
                                        <div className="spec-item">
                                            <span className="spec-item-label">Nombre de portes</span>
                                            <span className="spec-item-value">{annonce.nbPortes}</span>
                                        </div>
                                    )}

                                    {annonce.nbPlaces && (
                                        <div className="spec-item">
                                            <span className="spec-item-label">Nombre de places</span>
                                            <span className="spec-item-value">{annonce.nbPlaces}</span>
                                        </div>
                                    )}
                                </div>

                                {/* BOUTON CONTACT */}
                                <div className="vehicule-actions-wrap">
                                    <button
                                        type="button"
                                        className="btn-contact-garage"
                                        onClick={handleContactGarage}
                                        disabled={isSold}
                                    >
                                        <span>💬</span>
                                        {isSold
                                            ? 'Véhicule vendu (indisponible)'
                                            : 'Contacter le garage / Faire une demande'}
                                    </button>

                                    {!isSold && (
                                        <p className="contact-helper-text">
                                            {user
                                                ? 'Une demande sera automatiquement ouverte avec la référence de ce véhicule.'
                                                : 'Vous serez invité à vous connecter pour transmettre votre message au garage.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION BASSE : DESCRIPTION (PLEINE LARGEUR) */}
                        <div className="vehicule-bottom-grid">
                            <div className="vehicule-desc-card">
                                <h2>Description détaillée</h2>
                                {annonce.description ? (
                                    <div className="vehicule-desc-content">{annonce.description}</div>
                                ) : (
                                    <p style={{ color: '#888', fontStyle: 'italic' }}>
                                        Aucune description spécifique fournie pour ce véhicule. N'hésitez pas à
                                        nous contacter pour obtenir tous les détails techniques.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* LIGHTBOX VISIONNEUSE PLEIN ÉCRAN */}
                        {isLightboxOpen && (
                            <div
                                className="vehicule-lightbox-overlay"
                                onClick={closeLightbox}
                                role="dialog"
                                aria-modal="true"
                                aria-label="Visionneuse photo en plein écran"
                            >
                                <div
                                    className="vehicule-lightbox-container"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        className="vehicule-lightbox-close"
                                        onClick={closeLightbox}
                                        aria-label="Fermer la visionneuse"
                                    >
                                        ✕
                                    </button>

                                    {photosList.length > 1 && (
                                        <div className="vehicule-lightbox-counter">
                                            {lightboxIndex + 1} / {photosList.length}
                                        </div>
                                    )}

                                    {photosList.length > 1 && (
                                        <button
                                            type="button"
                                            className="vehicule-lightbox-nav vehicule-lightbox-prev"
                                            onClick={prevPhoto}
                                            aria-label="Photo précédente"
                                        >
                                            ‹
                                        </button>
                                    )}

                                    <div className="vehicule-lightbox-img-wrap">
                                        <img
                                            src={getImageUrl(photosList[lightboxIndex])}
                                            alt={`${annonce.titre} - vue ${lightboxIndex + 1}`}
                                            className="vehicule-lightbox-img"
                                            onError={(e) => {
                                                e.target.src = PLACEHOLDER_CAR_IMAGE;
                                            }}
                                        />
                                    </div>

                                    {photosList.length > 1 && (
                                        <button
                                            type="button"
                                            className="vehicule-lightbox-nav vehicule-lightbox-next"
                                            onClick={nextPhoto}
                                            aria-label="Photo suivante"
                                        >
                                            ›
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
