
import { Link } from 'react-router-dom';

import '../assets/css/Hero.css';

export default function Hero() {
    return (
        <section className="hero" id="accueil">

            <div className="hero-overlay"></div>

            <div className="hero-content">

                <p className="hero-label">
                    CS AB AUTO — MEURCHIN
                </p>

                <h1>
                    L'AUTOMOBILE
                    <br />
                    <span>AUTREMENT.</span>
                </h1>

                <p className="hero-description">
                    Achat et vente de véhicules d'occasion,
                    entretien et mécanique automobile.
                </p>

                <div className="hero-buttons">

                    <Link to="/vehicules" className="hero-button primary">
                        NOS VÉHICULES
                    </Link>

                    <Link to="/#contact" className="hero-button secondary">
                        PRENDRE RENDEZ-VOUS
                    </Link>

                </div>

            </div>

            <div className="hero-scroll">
                <span></span>
                DÉCOUVRIR
            </div>

        </section>
    );
}