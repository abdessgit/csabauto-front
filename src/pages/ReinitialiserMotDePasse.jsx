import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { validateResetToken, resetPassword } from '../api/auth';
import '../assets/css/ReinitialiserMotDePasse.css';

export default function ReinitialiserMotDePasse() {
    const [searchParams] = useSearchParams();
    const rawToken = searchParams.get('token');

    // Mémoriser le jeton dans l'état avant de le retirer de l'URL
    const [token, setToken] = useState(rawToken || '');

    const [tokenStatus, setTokenStatus] = useState('validating'); // 'validating' | 'valid' | 'invalid'
    const [errorCode, setErrorCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const hasValidated = useRef(false);

    // 1. Nettoyer l'URL dès réception du jeton pour ne pas l'exposer dans l'historique
    useEffect(() => {
        if (rawToken) {
            setToken(rawToken);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [rawToken]);

    // 2. Valider le token au chargement (protégé contre le double appel de React StrictMode)
    useEffect(() => {
        const tokenToValidate = token || rawToken;

        if (!tokenToValidate) {
            setTokenStatus('invalid');
            setErrorCode('TOKEN_MISSING');
            setErrorMessage("Aucun jeton de réinitialisation n'a été trouvé dans le lien.");
            return;
        }

        if (hasValidated.current) {
            return;
        }
        hasValidated.current = true;

        setTokenStatus('validating');

        validateResetToken(tokenToValidate)
            .then(() => {
                setTokenStatus('valid');
            })
            .catch((err) => {
                setTokenStatus('invalid');
                const data = err.response?.data;
                setErrorCode(data?.error || '');
                setErrorMessage(data?.message || 'Ce lien de réinitialisation est invalide ou a expiré.');
            });
    }, [token, rawToken]);

    // Calcul de la robustesse du mot de passe
    function getStrength(pwd) {
        if (!pwd) return { score: 0, label: '', className: '' };
        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (pwd.length >= 12) score += 1;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

        if (score <= 2) return { score: 1, label: 'Faible', className: 'weak' };
        if (score <= 4) return { score: 2, label: 'Moyen', className: 'medium' };
        return { score: 3, label: 'Robuste', className: 'strong' };
    }

    const strength = getStrength(password);

    async function handleSubmit(e) {
        e.preventDefault();
        setFormError('');

        if (password.length < 8) {
            setFormError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            setFormError('Le mot de passe doit contenir au moins une lettre et un chiffre.');
            return;
        }

        if (password !== confirmPassword) {
            setFormError('Les deux mots de passe ne correspondent pas.');
            return;
        }

        setFormLoading(true);

        try {
            const data = await resetPassword({
                token,
                password,
                confirmPassword,
            });

            setSuccess(true);
            if (data.email) {
                setUserEmail(data.email);
            }
        } catch (err) {
            const data = err.response?.data;
            if (err.response?.status === 410 || data?.error === 'TOKEN_EXPIRED' || data?.error === 'TOKEN_ALREADY_USED') {
                setTokenStatus('invalid');
                setErrorCode(data?.error || '');
                setErrorMessage(data?.message || 'Ce lien de réinitialisation a expiré ou a déjà été utilisé.');
            } else {
                setFormError(data?.message || 'Une erreur est survenue lors de la réinitialisation.');
            }
        } finally {
            setFormLoading(false);
        }
    }

    return (
        <main className="reset-page">
            <div className="reset-container">
                <div className="reset-brand">
                    <Link to="/" className="reset-logo">
                        <span>CS</span>
                        <strong>AB AUTO</strong>
                    </Link>
                </div>

                <div className="reset-card">
                    <div className="reset-header">
                        <p className="reset-label">AUTHENTIFICATION</p>
                        <h1>NOUVEAU MOT DE PASSE</h1>
                        <p className="reset-description">
                            Définissez un nouveau mot de passe sécurisé pour accéder à votre espace CS AB AUTO.
                        </p>
                    </div>

                    {tokenStatus === 'validating' && (
                        <div className="reset-loading">
                            <div className="reset-spinner" />
                            <p>Vérification du lien de réinitialisation...</p>
                        </div>
                    )}

                    {tokenStatus === 'invalid' && (
                        <div className="reset-invalid-section">
                            <div className="reset-error-box">
                                <h2 className="reset-error-title">
                                    {errorCode === 'TOKEN_ALREADY_USED'
                                        ? 'Lien déjà utilisé'
                                        : errorCode === 'TOKEN_EXPIRED'
                                            ? 'Lien expiré'
                                            : 'Lien invalide'}
                                </h2>
                                <p className="reset-error-desc">{errorMessage}</p>
                            </div>

                            <Link to="/mot-de-passe-oublie" className="reset-submit">
                                Demander un nouveau lien de réinitialisation →
                            </Link>

                            <div className="reset-footer">
                                <Link to="/login" className="reset-back-link">
                                    Retourner à la page de connexion
                                </Link>
                            </div>
                        </div>
                    )}

                    {tokenStatus === 'valid' && (
                        <>
                            {success ? (
                                <div className="reset-success-section">
                                    <div className="reset-success-box">
                                        <h2 className="reset-success-title">✓ Mot de passe réinitialisé !</h2>
                                        <p className="reset-success-desc">
                                            Votre nouveau mot de passe a été enregistré avec succès. Toutes vos sessions antérieures ont été déconnectées par mesure de sécurité.
                                        </p>
                                    </div>

                                    <Link
                                        to="/login"
                                        state={{
                                            prefillEmail: userEmail,
                                            message: 'Mot de passe modifié avec succès. Connectez-vous avec vos nouveaux identifiants.'
                                        }}
                                        className="reset-submit"
                                    >
                                        Se connecter à mon compte →
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    {formError && (
                                        <div className="reset-form-error">
                                            {formError}
                                        </div>
                                    )}

                                    <div className="reset-field">
                                        <label htmlFor="new-password">NOUVEAU MOT DE PASSE</label>
                                        <div className="reset-input-wrapper">
                                            <input
                                                id="new-password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Au moins 8 caractères (lettres et chiffres)"
                                                className="reset-input"
                                                autoComplete="new-password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="reset-toggle-btn"
                                            >
                                                {showPassword ? 'Masquer' : 'Afficher'}
                                            </button>
                                        </div>

                                        {password && (
                                            <div className="reset-strength-container">
                                                <div className="reset-strength-bars">
                                                    <span className={`reset-strength-bar ${strength.score >= 1 ? `active-${strength.className}` : ''}`} />
                                                    <span className={`reset-strength-bar ${strength.score >= 2 ? `active-${strength.className}` : ''}`} />
                                                    <span className={`reset-strength-bar ${strength.score >= 3 ? `active-${strength.className}` : ''}`} />
                                                </div>
                                                <span className={`reset-strength-text ${strength.className}`}>
                                                    Robustesse : {strength.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="reset-field">
                                        <label htmlFor="confirm-password">CONFIRMER LE MOT DE PASSE</label>
                                        <div className="reset-input-wrapper">
                                            <input
                                                id="confirm-password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Retapez votre nouveau mot de passe"
                                                className="reset-input"
                                                autoComplete="new-password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="reset-toggle-btn"
                                            >
                                                {showConfirmPassword ? 'Masquer' : 'Afficher'}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="reset-submit"
                                    >
                                        {formLoading ? 'MODIFICATION EN COURS...' : 'ENREGISTRER MON NOUVEAU MOT DE PASSE →'}
                                    </button>

                                    <div className="reset-footer">
                                        <Link to="/login" className="reset-back-link">
                                            Annuler et retourner à la connexion
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
