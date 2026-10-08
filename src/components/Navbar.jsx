
import { useState } from 'react';
import { Link } from 'react-router-dom';

import '../assets/css/Navbar.css';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="navbar">

            <div className="navbar-container">

                <Link to="/" className="navbar-logo">
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
                    <a href="#accueil" onClick={() => setMenuOpen(false)}>
                        Accueil
                    </a>

                    <a href="#services" onClick={() => setMenuOpen(false)}>
                        Services
                    </a>

                    <a href="#about" onClick={() => setMenuOpen(false)}>
                        Notre garage
                    </a>

                    <Link to="/vehicules" onClick={() => setMenuOpen(false)}>
                        Véhicules
                    </Link>

                    <a href="#contact" onClick={() => setMenuOpen(false)}>
                        Contact
                    </a>

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

                    <a
                        href="#contact"
                        className="navbar-button"
                        onClick={() => setMenuOpen(false)}
                    >
                        PRENDRE RDV
                    </a>
                </nav>

            </div>

        </header>
    );
}
