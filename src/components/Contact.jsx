import { useState } from 'react';
import '../assets/css/Contact.css';
import { envoyerMessageContact } from '../api/contact';

export default function Contact() {
    const [formData, setFormData] = useState({
        nom: '',
        email: '',
        telephone: '',
        sujet: '',
        message: '',
        site_web: '', // Champ honeypot invisible anti-spam
    });

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        // Validation côté client
        if (!formData.nom.trim()) {
            setErrorMessage('Veuillez renseigner votre nom.');
            return;
        }

        if (!formData.email.trim() || !formData.email.includes('@')) {
            setErrorMessage('Veuillez renseigner une adresse e-mail valide.');
            return;
        }

        if (!formData.message.trim() || formData.message.trim().length < 10) {
            setErrorMessage('Votre message doit comporter au moins 10 caractères.');
            return;
        }

        setLoading(true);

        try {
            const res = await envoyerMessageContact(formData);
            setSuccessMessage(
                res.message || 'Votre message a bien été envoyé. Notre équipe vous répondra dans les plus brefs délais.'
            );
            // Réinitialiser le formulaire
            setFormData({
                nom: '',
                email: '',
                telephone: '',
                sujet: '',
                message: '',
                site_web: '',
            });
        } catch (err) {
            if (err.response?.status === 429) {
                setErrorMessage(
                    err.response.data?.message ||
                    'Trop de messages envoyés depuis votre connexion. Veuillez patienter avant de réessayer.'
                );
            } else if (err.response?.data?.error) {
                setErrorMessage(err.response.data.error);
            } else {
                setErrorMessage(
                    "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer ultérieurement."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="contact" id="contact">
            <div className="contact-container">
                <div className="contact-info">
                    <p className="section-label">CONTACT</p>
                    <h2>
                        PARLONS DE
                        <br />
                        <span>VOTRE PROJET.</span>
                    </h2>
                    <p>
                        Besoin d'un renseignement, d'une réparation ou d'un véhicule ? Contactez CS AB AUTO.
                    </p>

                    <div className="contact-details">
                        <div>
                            <strong>📍 GARAGE</strong>
                            <span>3 Bis Rue Albert Thomas, 62410 Meurchin</span>
                        </div>
                        <div>
                            <strong>📞 TÉLÉPHONE</strong>
                            <span>06 63 40 76 94</span>
                        </div>
                        <div>
                            <strong>🕐 HORAIRES</strong>
                            <span>Du lundi au samedi sur rendez-vous</span>
                        </div>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                    {/* Champ honeypot invisible pour piéger les robots */}
                    <div className="contact-honeypot" aria-hidden="true">
                        <label htmlFor="contact_site_web">Ne pas remplir ce champ si vous êtes humain</label>
                        <input
                            type="text"
                            id="contact_site_web"
                            name="site_web"
                            value={formData.site_web}
                            onChange={handleChange}
                            tabIndex="-1"
                            autoComplete="off"
                        />
                    </div>

                    {successMessage && (
                        <div className="contact-alert contact-alert-success" role="status">
                            ✓ {successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="contact-alert contact-alert-error" role="alert">
                            ⚠ {errorMessage}
                        </div>
                    )}

                    <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder="Votre nom *"
                        required
                        disabled={loading}
                    />

                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Votre email *"
                        required
                        disabled={loading}
                    />

                    <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        placeholder="Votre téléphone (optionnel)"
                        disabled={loading}
                    />

                    <select
                        name="sujet"
                        value={formData.sujet}
                        onChange={handleChange}
                        disabled={loading}
                    >
                        <option value="">Votre demande (sujet)</option>
                        <option value="Achat d'un véhicule">Achat d'un véhicule</option>
                        <option value="Vente d'un véhicule">Vente d'un véhicule</option>
                        <option value="Réparation mécanique / Atelier">Réparation mécanique / Atelier</option>
                        <option value="Demande de devis">Demande de devis</option>
                        <option value="Autre renseignement">Autre renseignement</option>
                    </select>

                    <textarea
                        rows="5"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Votre message (au moins 10 caractères) *"
                        required
                        disabled={loading}
                    ></textarea>

                    <button type="submit" disabled={loading}>
                        {loading ? 'ENVOI EN COURS...' : 'ENVOYER LE MESSAGE →'}
                    </button>
                </form>
            </div>
        </section>
    );
}