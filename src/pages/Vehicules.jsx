import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VehiculeCard from '../components/VehiculeCard';
import { getAnnoncesPubliques } from '../api/annonces';
import '../assets/css/VehiculesCatalogue.css';

const CARBURANTS = [
    { label: 'Tous carburants', value: '' },
    { label: 'Essence', value: 'essence' },
    { label: 'Diesel', value: 'diesel' },
    { label: 'Hybride', value: 'hybride' },
    { label: 'Électrique', value: 'electrique' },
    { label: 'GPL', value: 'gpl' },
];

const BOITES = [
    { label: 'Toutes boîtes', value: '' },
    { label: 'Manuelle', value: 'manuelle' },
    { label: 'Automatique', value: 'automatique' },
];

const TRIS = [
    { label: 'Plus récents', value: 'recent' },
    { label: 'Prix : Moins cher au plus cher', value: 'prix_asc' },
    { label: 'Prix : Plus cher au moins cher', value: 'prix_desc' },
    { label: 'Kilométrage croissant', value: 'km_asc' },
    { label: 'Kilométrage décroissant', value: 'km_desc' },
    { label: 'Année la plus récente', value: 'annee_desc' },
];

export default function Vehicules() {
    const [annonces, setAnnonces] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    // Filtres
    const [filters, setFilters] = useState({
        search: '',
        marque: '',
        prixMin: '',
        prixMax: '',
        anneeMin: '',
        anneeMax: '',
        carburant: '',
        boite: '',
        tri: 'recent',
    });

    const fetchAnnonces = useCallback(async (targetPage = 1, append = false) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError('');

        try {
            const params = {
                page: targetPage,
                limit: 12,
                tri: filters.tri || 'recent',
            };

            if (filters.search.trim()) params.search = filters.search.trim();
            if (filters.marque.trim()) params.marque = filters.marque.trim();
            if (filters.prixMin) params.prixMin = filters.prixMin;
            if (filters.prixMax) params.prixMax = filters.prixMax;
            if (filters.anneeMin) params.anneeMin = filters.anneeMin;
            if (filters.anneeMax) params.anneeMax = filters.anneeMax;
            if (filters.carburant) params.carburant = filters.carburant;
            if (filters.boite) params.boite = filters.boite;

            const res = await getAnnoncesPubliques(params);

            const items = Array.isArray(res)
                ? res
                : Array.isArray(res?.items)
                    ? res.items
                    : [];
            const totalCount = res?.total !== undefined ? res.total : items.length;
            const pagesCount = res?.pages !== undefined ? res.pages : 1;

            if (append) {
                setAnnonces((prev) => [...prev, ...items]);
            } else {
                setAnnonces(items);
            }

            setTotal(totalCount);
            setTotalPages(pagesCount);
            setPage(targetPage);
        } catch (err) {
            console.error('Erreur récupération véhicules :', err);
            setError('Impossible de charger les véhicules. Veuillez réessayer.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filters]);

    // Recharger page 1 quand les filtres changent
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchAnnonces(1, false);
        }, 300);
        return () => clearTimeout(timeout);
    }, [fetchAnnonces]);

    function handleFilterChange(field, value) {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function handleResetFilters() {
        setFilters({
            search: '',
            marque: '',
            prixMin: '',
            prixMax: '',
            anneeMin: '',
            anneeMax: '',
            carburant: '',
            boite: '',
            tri: 'recent',
        });
    }

    function handleLoadMore() {
        if (page < totalPages && !loadingMore) {
            fetchAnnonces(page + 1, true);
        }
    }

    return (
        <div className="vehicules-page">
            <Navbar />

            <main className="vehicules-page-main">
                {/* HERO BANNER */}
                <div className="vehicules-hero">
                    <div className="vehicules-hero-label">PARC AUTOMOBILE • OCCASIONS RÉVISÉES</div>
                    <h1>
                        NOS VÉHICULES <span>D'OCCASION</span>
                    </h1>
                    <p>
                        Découvrez notre sélection de véhicules d'occasion rigoureusement contrôlés,
                        révisés et garantis par notre garage à Meurchin.
                    </p>
                </div>

                {/* FILTERS PANEL */}
                <div className="vehicules-filters-box">
                    <div className="vehicules-filters-grid">
                        {/* RECHERCHE LIBRE */}
                        <div className="filter-group">
                            <label>Recherche libre</label>
                            <input
                                type="text"
                                placeholder="Clio, Peugeot 308, etc."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        {/* MARQUE */}
                        <div className="filter-group">
                            <label>Marque</label>
                            <input
                                type="text"
                                placeholder="Toutes marques"
                                value={filters.marque}
                                onChange={(e) => handleFilterChange('marque', e.target.value)}
                            />
                        </div>

                        {/* PRIX MIN */}
                        <div className="filter-group">
                            <label>Prix Min (€)</label>
                            <input
                                type="number"
                                placeholder="Ex: 2000"
                                value={filters.prixMin}
                                onChange={(e) => handleFilterChange('prixMin', e.target.value)}
                            />
                        </div>

                        {/* PRIX MAX */}
                        <div className="filter-group">
                            <label>Prix Max (€)</label>
                            <input
                                type="number"
                                placeholder="Ex: 25000"
                                value={filters.prixMax}
                                onChange={(e) => handleFilterChange('prixMax', e.target.value)}
                            />
                        </div>

                        {/* ANNÉE MIN */}
                        <div className="filter-group">
                            <label>Année Min</label>
                            <input
                                type="number"
                                placeholder="Ex: 2015"
                                value={filters.anneeMin}
                                onChange={(e) => handleFilterChange('anneeMin', e.target.value)}
                            />
                        </div>

                        {/* CARBURANT */}
                        <div className="filter-group">
                            <label>Carburant</label>
                            <select
                                value={filters.carburant}
                                onChange={(e) => handleFilterChange('carburant', e.target.value)}
                            >
                                {CARBURANTS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* BOÎTE */}
                        <div className="filter-group">
                            <label>Boîte</label>
                            <select
                                value={filters.boite}
                                onChange={(e) => handleFilterChange('boite', e.target.value)}
                            >
                                {BOITES.map((b) => (
                                    <option key={b.value} value={b.value}>
                                        {b.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* TRI */}
                        <div className="filter-group">
                            <label>Trier par</label>
                            <select
                                value={filters.tri}
                                onChange={(e) => handleFilterChange('tri', e.target.value)}
                            >
                                {TRIS.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* BOUTON RESET */}
                        <div className="filter-actions">
                            <button
                                type="button"
                                className="btn-reset-filters"
                                onClick={handleResetFilters}
                                title="Réinitialiser tous les filtres"
                            >
                                ✕ Réinitialiser
                            </button>
                        </div>
                    </div>
                </div>

                {/* TOOLBAR INFO */}
                <div className="vehicules-toolbar">
                    <div className="vehicules-count">
                        <span>{total}</span> véhicule{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                    </div>
                </div>

                {/* GRID OR STATES */}
                {loading ? (
                    <div className="vehicules-catalog-loading">
                        <p>Chargement des véhicules en cours...</p>
                    </div>
                ) : error ? (
                    <div className="vehicules-catalog-error">
                        <p>{error}</p>
                        <button
                            onClick={() => fetchAnnonces(1, false)}
                            className="btn-load-more"
                            style={{ marginTop: '15px' }}
                        >
                            Réessayer
                        </button>
                    </div>
                ) : annonces.length === 0 ? (
                    <div className="vehicules-catalog-empty">
                        <div className="vehicules-catalog-empty-icon">🚗</div>
                        <h3>Aucun véhicule ne correspond à vos critères</h3>
                        <p>Essayez de modifier ou de réinitialiser vos filtres de recherche.</p>
                        <button
                            type="button"
                            className="btn-reset-filters"
                            onClick={handleResetFilters}
                            style={{ marginTop: '15px' }}
                        >
                            Effacer les filtres
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="vehicules-catalog-grid">
                            {annonces.map((annonce) => (
                                <VehiculeCard key={annonce.id} annonce={annonce} />
                            ))}
                        </div>

                        {/* LOAD MORE BUTTON */}
                        {page < totalPages && (
                            <div className="vehicules-pagination-wrap">
                                <button
                                    className="btn-load-more"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore
                                        ? 'Chargement en cours...'
                                        : 'Charger plus de véhicules ↓'}
                                </button>
                                <span className="pagination-info-text">
                                    Affichage de {annonces.length} sur {total} véhicule{total > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}