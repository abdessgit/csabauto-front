import { Link } from 'react-router-dom';
import { getImageUrl, PLACEHOLDER_CAR_IMAGE } from '../utils/imageUrl';
import '../assets/css/VehiculeCard.css';

export default function VehiculeCard({ annonce }) {
    if (!annonce) return null;

    const mainPhoto =
        Array.isArray(annonce.photos) && annonce.photos.length > 0
            ? annonce.photos[0]
            : annonce.imagePrincipale;

    const isSold = annonce.statut === 'VENDUE' || annonce.statut === 'VENDU';

    const formattedPrice = Number(annonce.prix || 0).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    const formattedKm = Number(annonce.kilometrage || 0).toLocaleString('fr-FR');

    return (
        <div className={`vehicule-card ${isSold ? 'vehicule-card-sold' : ''}`}>
            <Link to={`/vehicules/${annonce.id}`} className="vehicule-card-image-wrap">
                <img
                    src={getImageUrl(mainPhoto)}
                    alt={annonce.titre || `${annonce.marque || ''} ${annonce.modele || ''}`}
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = PLACEHOLDER_CAR_IMAGE;
                    }}
                />
                {isSold && <span className="vehicule-badge-sold">VENDU</span>}
            </Link>

            <div className="vehicule-card-body">
                <div className="vehicule-card-top">
                    {(annonce.marque || annonce.modele) && (
                        <span className="vehicule-card-brand">
                            {annonce.marque} {annonce.modele}
                        </span>
                    )}
                    <h3 className="vehicule-card-title">
                        <Link to={`/vehicules/${annonce.id}`}>{annonce.titre}</Link>
                    </h3>
                </div>

                <div className="vehicule-card-specs">
                    {annonce.annee && (
                        <span className="vehicule-spec-pill">
                            <span className="spec-icon">📅</span> {annonce.annee}
                        </span>
                    )}
                    {annonce.kilometrage !== undefined && annonce.kilometrage !== null && (
                        <span className="vehicule-spec-pill">
                            <span className="spec-icon">🛣️</span> {formattedKm} km
                        </span>
                    )}
                    {annonce.carburant && (
                        <span className="vehicule-spec-pill">
                            <span className="spec-icon">⛽</span> {annonce.carburant}
                        </span>
                    )}
                    {annonce.boite && (
                        <span className="vehicule-spec-pill">
                            <span className="spec-icon">⚙️</span> {annonce.boite}
                        </span>
                    )}
                </div>

                <div className="vehicule-card-footer">
                    <div className="vehicule-card-price">
                        {formattedPrice} <span>€</span>
                    </div>

                    <Link to={`/vehicules/${annonce.id}`} className="vehicule-card-action">
                        {isSold ? 'Voir détails' : 'Découvrir →'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
