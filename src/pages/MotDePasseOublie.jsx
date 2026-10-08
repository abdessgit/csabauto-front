import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { useRateLimitHandler } from '../hooks/useRateLimitHandler';
import '../assets/css/MotDePasseOublie.css';

export default function MotDePasseOublie() {
    const [email, setEmail] = useState('');
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { isRateLimited, rateLimitMessage, retryAfterSeconds, handleError } = useRateLimitHandler(60);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        const targetEmail = email.trim().toLowerCase();
        if (!targetEmail) {
            setError('Veuillez saisir votre adresse e-mail.');
            return;
        }

        setLoading(true);

        try {
            await forgotPassword(targetEmail);
            setSubmittedEmail(targetEmail);
        } catch (err) {
            if (handleError(err)) {
                return;
            }
            const msg = err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi du lien.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="forgot-page">
            <div className="forgot-container">
                <div className="forgot-brand">
                    <Link to="/" className="forgot-logo">
                        <span>CS</span>
                        <strong>AB AUTO</strong>
                    </Link>
                </div>

                <div className="forgot-card">
                    <div className="forgot-header">
                        <p className="forgot-label">RÉCUPÉRATION DU COMPTE</p>
                        <h1>MOT DE PASSE OUBLIÉ</h1>
                        <p className="forgot-description">
                            Saisissez l'adresse e-mail associée à votre compte CS AB AUTO. Nous vous enverrons un lien pour définir un nouveau mot de passe.
                        </p>
                    </div>

                    {isRateLimited ? (
                        <div className="forgot-error">
                            {rateLimitMessage} Réessayez dans {retryAfterSeconds} seconde{retryAfterSeconds > 1 ? 's' : ''}.
                        </div>
                    ) : error ? (
                        <div className="forgot-error">{error}</div>
                    ) : null}

                    {submittedEmail ? (
                        <div className="forgot-success-section">
                            <div className="forgot-success-box">
                                <h2 className="forgot-success-title">✓ Demande envoyée !</h2>
                                <p className="forgot-success-desc">
                                    Si un compte est associé à cette adresse, un e-mail vient d'être envoyé à :
                                </p>
                                <div className="forgot-email-badge">
                                    {submittedEmail}
                                </div>
                                <p className="forgot-success-hint">
                                    Veuillez cliquer sur le lien contenu dans cet e-mail pour réinitialiser votre mot de passe (valable 1 heure). Pensez à vérifier vos courriers indésirables (spams).
                                </p>
                            </div>

                            <Link to="/login" className="forgot-submit">
                                Retourner à la page de connexion →
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="forgot-field">
                                <label htmlFor="email">VOTRE ADRESSE E-MAIL</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className="forgot-input"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || isRateLimited}
                                className="forgot-submit"
                            >
                                {loading ? 'ENVOI EN COURS...' : 'ENVOYER LE LIEN DE RÉINITIALISATION →'}
                            </button>

                            <div className="forgot-footer">
                                <Link to="/login" className="forgot-back-link">
                                    Retour à la page de connexion
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}
