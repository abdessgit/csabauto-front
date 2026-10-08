import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnnoncesPubliques } from '../api/annonces';
import VehiculeCard from './VehiculeCard';
import '../assets/css/VehiclesPreview.css';

export default function VehiclesPreview() {
    const [annonces, setAnnonces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function fetchLatestVehicules() {
        setLoading(true);
        setError('');
        try {
            const data = await getAnnoncesPubliques({ limit: 3, tri: 'recent' });
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.items)
                    ? data.items
                    : [];
            setAnnonces(list.slice(0, 3));
        } catch (err) {
            console.error('Erreur chargement des derniers véhicules :', err);
            setError('Impossible de charger nos véhicules pour le moment.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLatestVehicules();
    }, []);

    return (
        <section className="vehicles-preview" id="vehicules">
            <div className="vehicles-header">
                <div>
                    <p className="section-label">NOTRE STOCK</p>
                    <h2>
                        NOS <span>VÉHICULES</span>
                    </h2>
                </div>

                <Link to="/vehicules" className="vehicles-header-link">
                    VOIR TOUS LES VÉHICULES →
                </Link>
            </div>

            {loading ? (
                <div className="vehicles-loading-state">
                    <p>Chargement des véhicules disponibles...</p>
                </div>
            ) : error ? (
                <div className="vehicles-error-state">
                    <p>{error}</p>
                    <button onClick={fetchLatestVehicules} className="vehicles-retry-btn">
                        Réessayer
                    </button>
                </div>
            ) : annonces.length === 0 ? (
                <div className="vehicles-empty">
                    <div>
                        <span>CS AB AUTO</span>
                        <h3>
                            Aucun véhicule disponible
                            <br />
                            pour le moment.
                        </h3>
                        <p style={{ color: '#ccc', marginBottom: '20px' }}>
                            Notre stock est régulièrement mis à jour. Revenez très bientôt !
                        </p>
                        <Link to="/vehicules">CONSULTER LE STOCK</Link>
                    </div>
                </div>
            ) : (
                <>
                    <div className="vehicles-grid">
                        {annonces.map((annonce) => (
                            <VehiculeCard key={annonce.id} annonce={annonce} />
                        ))}
                    </div>

                    <div className="vehicles-bottom-cta">
                        <Link to="/vehicules" className="vehicles-btn-all">
                            Voir tous nos véhicules ({annonces.length > 0 ? 'Stock complet' : ''}) →
                        </Link>
                    </div>
                </>
            )}
        </section>
    );
}