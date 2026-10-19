import { Link } from 'react-router-dom';
import '../assets/css/Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <Link to="/" className="footer-logo" aria-label="CS AB AUTO Accueil">
                        <span>CSAB</span>
                        AUTO
                    </Link>
                    <p>
                        Achat, vente et mécanique automobile.
                        Votre garage automobile à Meurchin.
                    </p>
                </div>

                <div className="footer-links">
                    <Link to="/">Accueil</Link>
                    <Link to="/vehicules">Véhicules</Link>
                    <Link to="/#services">Services</Link>
                    <Link to="/#contact">Contact</Link>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-copyright">
                    © {new Date().getFullYear()} CS AB AUTO — Tous droits réservés.
                </div>

                <nav className="footer-legal" aria-label="Informations légales">
                    <Link to="/mentions-legales">Mentions légales</Link>
                    <Link to="/politique-de-confidentialite">Politique de confidentialité</Link>
                    <Link to="/cgu">CGU</Link>
                </nav>
            </div>
        </footer>
    );
}
