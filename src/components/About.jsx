
import '../assets/css/About.css';

export default function About() {
    return (
        <section className="about" id="about">

            <div className="about-image">
                <div className="about-badge">
                    CS
                    <span>AB AUTO</span>
                </div>
            </div>

            <div className="about-content">

                <p className="section-label">
                    QUI SOMMES-NOUS ?
                </p>

                <h2>
                    VOTRE GARAGE,
                    <br />
                    <span>VOTRE CONFIANCE.</span>
                </h2>

                <p>
                    CS AB AUTO vous accompagne dans l'achat,
                    la vente et l'entretien de votre véhicule.
                </p>

                <p>
                    Notre objectif est simple : proposer un service
                    professionnel, transparent et adapté à chaque
                    client.
                </p>

                <a href="#contact" className="about-button">
                    NOUS CONTACTER →
                </a>

            </div>

        </section>
    );
}