import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resendVerification } from '../api/auth';
import { useRateLimitHandler } from '../hooks/useRateLimitHandler';
import '../assets/css/Login.css';

export default function Login() {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.prefillEmail || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnverified, setIsUnverified] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendFeedback, setResendFeedback] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const successMessage = location.state?.message;

    const { isRateLimited, rateLimitMessage, retryAfterSeconds, handleError } = useRateLimitHandler(60);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    async function handleSubmit(e) {
        e.preventDefault();

        setError('');
        setIsUnverified(false);
        setResendFeedback(null);
        setLoading(true);

        try {
            const user = await login(email, password);



            const roles = user?.roles || [];

            if (roles.includes('ROLE_ADMIN')) {
                navigate('/dashboard/admin', { replace: true });
                return;
            }

            if (roles.includes('ROLE_MODERATEUR')) {
                navigate('/dashboard/moderateur', { replace: true });
                return;
            }

            if (roles.includes('ROLE_CLIENT')) {
                if (location.state?.redirectTo) {
                    navigate(location.state.redirectTo, {
                        replace: true,
                        state: location.state.redirectState,
                    });
                    return;
                }
                navigate('/dashboard/client', { replace: true });
                return;
            }

            setError(
                'Votre compte ne possède pas de rôle valide.'
            );

        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Erreur connexion :', error);
            }

            // Gestion du rate limiting (429)
            if (handleError(error)) {
                return;
            }

            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 403 && (data?.code === 'EMAIL_NOT_VERIFIED' || data?.error === 'EMAIL_NOT_VERIFIED')) {
                setIsUnverified(true);
                setError(data?.message || "Votre adresse e-mail n'a pas encore été confirmée. Veuillez vérifier votre boîte mail.");
                return;
            }

            if (status === 401) {
                setError('Email ou mot de passe incorrect.');
            } else if (data?.message) {
                setError(data.message);
            } else if (data?.error) {
                setError(data.error);
            } else {
                setError(
                    'Impossible de se connecter. Vérifiez vos informations.'
                );
            }

        } finally {
            setLoading(false);
        }
    }

    async function handleResendVerification() {
        if (!email || resendCooldown > 0 || resendLoading) return;
        setResendLoading(true);
        setResendFeedback(null);

        try {
            const data = await resendVerification(email);
            setResendFeedback({
                type: 'success',
                text: data.message || 'Un e-mail de confirmation vient de vous être renvoyé.',
            });
            setResendCooldown(60);
        } catch (err) {
            setResendFeedback({
                type: 'error',
                text: err.response?.data?.message || 'Impossible d\'envoyer un nouvel e-mail. Veuillez réessayer plus tard.',
            });
        } finally {
            setResendLoading(false);
        }
    }

    return (
        <main className="login-page">
            <div className="login-container">

                <div className="login-brand">
                    <Link to="/" className="login-logo">
                        <span>CS</span>
                        <strong>AB AUTO</strong>
                    </Link>
                </div>

                <div className="login-card">

                    <div className="login-header">
                        <p className="login-label">
                            ESPACE CLIENT
                        </p>

                        <h1>CONNEXION</h1>

                        <p>
                            Connectez-vous à votre espace CS AB AUTO.
                        </p>
                    </div>

                    {isRateLimited ? (
                        <div className="login-error">
                            {rateLimitMessage} Réessayez dans {retryAfterSeconds} seconde{retryAfterSeconds > 1 ? 's' : ''}.
                        </div>
                    ) : isUnverified ? (
                        <div className="login-unverified-box">
                            <p className="login-unverified-message">
                                {error}
                            </p>
                            {resendFeedback && (
                                <div className={`login-resend-feedback ${resendFeedback.type}`}>
                                    {resendFeedback.text}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resendLoading || resendCooldown > 0}
                                className="login-resend-btn"
                            >
                                {resendLoading
                                    ? 'Envoi...'
                                    : resendCooldown > 0
                                        ? `Renvoyer dans ${resendCooldown}s`
                                        : "Renvoyer l'e-mail de confirmation"}
                            </button>
                        </div>
                    ) : error ? (
                        <div className="login-error">
                            {error}
                        </div>
                    ) : successMessage ? (
                        <div className="login-success">
                            {successMessage}
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit}>

                        <div className="login-field">
                            <label htmlFor="email">
                                EMAIL
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="login-field">

                            <div className="login-password-header">
                                <label htmlFor="password">
                                    MOT DE PASSE
                                </label>

                                <Link to="/mot-de-passe-oublie">
                                    Mot de passe oublié ?
                                </Link>
                            </div>

                            <input
                                id="password"
                                type="password"
                                placeholder="Votre mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading || isRateLimited}
                        >
                            {isRateLimited
                                ? `Réessayez dans ${retryAfterSeconds}s`
                                : loading
                                    ? 'CONNEXION...'
                                    : 'SE CONNECTER →'}
                        </button>

                    </form>

                    <div className="login-register">
                        <span>
                            Vous n'avez pas encore de compte ?
                        </span>

                        <Link to="/register">
                            CRÉER UN COMPTE
                        </Link>
                    </div>

                </div>

                <Link to="/" className="login-back">
                    ← Retour au site
                </Link>

            </div>
        </main>
    );
}