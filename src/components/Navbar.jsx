
import { useState } from 'react';
import { Link } from 'react-router-dom';

import '../assets/css/Navbar.css';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="navbar">

            <div className="navbar-container">

                <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
                    <span>CSAB</span>
                    <strong> AUTO</strong>
                </Link>

                <button
                    className="mobile-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                >
                    ☰
                </button>

                <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <Link to="/#accueil" onClick={() => setMenuOpen(false)}>
                        Accueil
                    </Link>

                    <Link to="/#services" onClick={() => setMenuOpen(false)}>
                        Services
                    </Link>

                    <Link to="/#about" onClick={() => setMenuOpen(false)}>
                        Notre garage
                    </Link>

                    <Link to="/vehicules" onClick={() => setMenuOpen(false)}>
                        Véhicules
                    </Link>

                    <Link to="/#contact" onClick={() => setMenuOpen(false)}>
                        Contact
                    </Link>

                    <div className="navbar-auth-buttons">
                        <Link
                            to="/login"
                            className="navbar-login"
                            onClick={() => setMenuOpen(false)}
                        >
                            CONNEXION
                        </Link>

                        <Link
                            to="/inscription"
                            className="navbar-register"
                            onClick={() => setMenuOpen(false)}
                        >
                            INSCRIPTION
                        </Link>
                    </div>

                    <Link
                        to="/#contact"
                        className="navbar-button"
                        onClick={() => setMenuOpen(false)}
                    >
                        PRENDRE RDV
                    </Link>
                </nav>

            </div>

        </header>
    );
}
