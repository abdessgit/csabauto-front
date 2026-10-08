import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../api/auth';
import '../assets/css/VerifierEmail.css';

export default function VerifierEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [verifiedEmail, setVerifiedEmail] = useState('');

    // Formulaire de renvoi
    const [resendEmail, setResendEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState('');
    const [resendError, setResendError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const hasRequested = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage("Aucun jeton de confirmation n'a été trouvé dans le lien.");
            return;
        }

        if (hasRequested.current) {
            return;
        }
        hasRequested.current = true;

        setStatus('loading');

        verifyEmail(token)
            .then((data) => {
                setStatus('success');
                setMessage(data.message || 'Votre adresse e-mail a été confirmée avec succès. Vous pouvez maintenant vous connecter.');
                if (data.email) {
                    setVerifiedEmail(data.email);
                    setResendEmail(data.email);
                }
            })
            .catch((err) => {
                setStatus('error');
                const data = err.response?.data;
                const code = data?.error || '';
                const msg = data?.message || 'Ce lien de confirmation est invalide ou a expiré.';
                setErrorCode(code);
                setErrorMessage(msg);
            });
    }, [token]);

    // Décompte pour le bouton de renvoi
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    async function handleResend(e) {
        e.preventDefault();
        setResendSuccess('');
        setResendError('');

        const targetEmail = resendEmail.trim();
        if (!targetEmail) {
            setResendError('Veuillez saisir votre adresse e-mail.');
            return;
        }

        setResendLoading(true);
        try {
            const data = await resendVerification(targetEmail);
            setResendSuccess(data.message || 'Si un compte existe avec cette adresse, un nouvel e-mail de confirmation a été envoyé.');
            setResendCooldown(60);
        } catch (err) {
            if (err.response?.status === 429) {
                setResendError(err.response?.data?.message || 'Trop de demandes de renvoi. Veuillez patienter.');
            } else {
                setResendError(err.response?.data?.message || 'Impossible d\'envoyer le lien de confirmation.');
            }
        } finally {
            setResendLoading(false);
        }
    }

    return (
        <main className="verifier-page">
            <div className="verifier-container">
                <div className="verifier-brand">
                    <Link to="/" className="verifier-logo">
                        <span>CS</span>
                        <strong>AB AUTO</strong>
                    </Link>
                </div>

                <div className="verifier-card">
                    <div className="verifier-header">
                        <p className="verifier-label">AUTHENTIFICATION</p>
                        <h1>VÉRIFICATION DE L'E-MAIL</h1>
                    </div>

                    {status === 'loading' && (
                        <div className="verifier-loading">
                            <div className="verifier-spinner" />
                            <p>Vérification de votre lien en cours...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="verifier-content">
                            <div className="verifier-success-box">
                                <h2 className="verifier-success-title">✓ Compte activé avec succès !</h2>
                                <p className="verifier-success-desc">{message}</p>
                            </div>

                            <Link
                                to="/login"
                                state={{
                                    prefillEmail: verifiedEmail,
                                    message: 'Votre adresse a été confirmée. Vous pouvez maintenant vous connecter.'
                                }}
                                className="verifier-button-primary"
                            >
                                Se connecter à mon compte →
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="verifier-content">
                            <div className="verifier-error-box">
                                <h2 className="verifier-error-title">
                                    {errorCode === 'TOKEN_ALREADY_USED'
                                        ? 'Lien déjà utilisé'
                                        : errorCode === 'TOKEN_EXPIRED'
                                            ? 'Lien expiré'
                                            : 'Lien invalide'}
                                </h2>
                                <p className="verifier-error-desc">{errorMessage}</p>
                            </div>

                            {errorCode === 'TOKEN_ALREADY_USED' ? (
                                <Link to="/login" className="verifier-button-primary">
                                    Aller à la page de connexion →
                                </Link>
                            ) : (
                                <div className="verifier-resend-section">
                                    <h3 className="verifier-resend-title">Recevoir un nouveau lien</h3>
                                    <p className="verifier-resend-text">
                                        Indiquez votre adresse e-mail pour recevoir un nouveau lien d'activation valable 24 heures :
                                    </p>

                                    {resendError && (
                                        <div className="verifier-error-feedback">
                                            {resendError}
                                        </div>
                                    )}

                                    {resendSuccess && (
                                        <div className="verifier-info-feedback">
                                            {resendSuccess}
                                        </div>
                                    )}

                                    <form onSubmit={handleResend} className="verifier-resend-form">
                                        <input
                                            type="email"
                                            value={resendEmail}
                                            onChange={(e) => setResendEmail(e.target.value)}
                                            placeholder="votre@email.com"
                                            className="verifier-input"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={resendLoading || resendCooldown > 0}
                                            className="verifier-button-secondary"
                                        >
                                            {resendLoading
                                                ? 'Envoi en cours...'
                                                : resendCooldown > 0
                                                    ? `Renvoyer dans ${resendCooldown}s`
                                                    : 'Renvoyer l\'e-mail de confirmation'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div className="verifier-footer">
                                <Link to="/login" className="verifier-link-muted">
                                    Retourner à la page de connexion
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
