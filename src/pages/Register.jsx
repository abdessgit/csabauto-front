import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, resendVerification } from '../api/auth';
import { useRateLimitHandler } from '../hooks/useRateLimitHandler';
import '../assets/css/Inscription.css';

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Écran post-inscription (vérification e-mail)
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendFeedback, setResendFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Note : Le délai de 300 secondes (5 minutes) affiché par défaut est indicatif pour l'affichage utilisateur,
    // car la véritable fenêtre de blocage côté backend Symfony est de 1 heure pour les inscriptions.
    // Ce compromis d'affichage permet de ne pas décourager l'utilisateur avec un blocage d'une heure d'emblée.
    // Le formulaire réautorise la soumission après ce délai et retentera naturellement un appel API.
    // Si la fenêtre de blocage backend d'1h n'est pas encore écoulée, le backend renverra à nouveau un code 429.
    // Dans cette situation, handleError relance automatiquement un nouveau décompte propre sans faire planter l'application.
    const { isRateLimited, rateLimitMessage, retryAfterSeconds, handleError } = useRateLimitHandler(300);

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setError('');
        setSuccess('');

        if (form.password.length < 8) {
            setError('Le mot de passe doit comporter au moins 8 caractères.');
            return;
        }

        if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
            setError('Le mot de passe doit contenir au moins une lettre et un chiffre.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);

        try {
            await register({
                nom: form.nom,
                prenom: form.prenom,
                email: form.email,
                telephone: form.telephone,
                adresse: form.adresse,
                password: form.password,
            });

            // Affichage de l'écran de confirmation d'e-mail
            setRegisteredEmail(form.email);
            setResendCooldown(60);

        } catch (error) {
            // Gestion du rate limiting (429)
            if (handleError(error)) {
                return;
            }

            const data = error.response?.data;

            if (data?.violations) {
                const messages = Array.isArray(data.violations)
                    ? data.violations
                        .map((violation) => {
                            if (typeof violation === 'string') {
                                return violation;
                            }

                            return violation.message || 'Champ invalide';
                        })
                        .join(' ')
                    : JSON.stringify(data.violations);

                setError(messages);
            } else if (data?.error) {
                setError(data.error);
            } else if (data?.message) {
                setError(data.message);
            } else {
                setError(
                    'Les informations envoyées sont invalides. Vérifiez les champs.'
                );
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleResendEmail() {
        if (!registeredEmail || resendCooldown > 0 || resendLoading) return;
        setResendLoading(true);
        setResendFeedback(null);

        try {
            const data = await resendVerification(registeredEmail);
            setResendFeedback({
                type: 'success',
                text: data.message || 'Un nouvel e-mail de confirmation vient d\'être envoyé.',
            });
            setResendCooldown(60);
        } catch (err) {
            setResendFeedback({
                type: 'error',
                text: err.response?.data?.message || 'Impossible d\'envoyer un nouvel e-mail pour le moment.',
            });
        } finally {
            setResendLoading(false);
        }
    }

    // Vue post-inscription : Vérifiez votre boîte mail
    if (registeredEmail) {
        return (
            <main className="inscription-page">
                <div className="inscription-card">
                    <div className="inscription-logo">
                        <Link to="/">
                            <span>CS</span>
                            <strong>AB AUTO</strong>
                        </Link>
                    </div>

                    <p className="inscription-label">
                        ESPACE CLIENT
                    </p>

                    <h1>VÉRIFIEZ VOTRE BOÎTE MAIL</h1>

                    <div className="inscription-confirm-box">
                        <p className="inscription-confirm-text">
                            Votre compte a été créé avec succès ! Un e-mail contenant votre lien d'activation a été envoyé à :
                        </p>
                        <div className="inscription-email-badge">
                            {registeredEmail}
                        </div>
                        <p className="inscription-confirm-hint">
                            Veuillez cliquer sur ce lien dans les 24 heures pour activer votre compte. Si vous ne le trouvez pas, vérifiez votre dossier de courriers indésirables (spams).
                        </p>
                    </div>

                    {resendFeedback && (
                        <div className={`inscription-resend-feedback ${resendFeedback.type}`}>
                            {resendFeedback.text}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={resendLoading || resendCooldown > 0}
                        className="inscription-button-secondary"
                    >
                        {resendLoading
                            ? 'ENVOI EN COURS...'
                            : resendCooldown > 0
                                ? `RENVOYER DANS ${resendCooldown}S`
                                : "RENVOYER L'E-MAIL DE CONFIRMATION"}
                    </button>

                    <Link to="/login" className="inscription-back-link">
                        Retourner à la page de connexion
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="inscription-page">

            <div className="inscription-card">

                <div className="inscription-logo">
                    <Link to="/">
                        <span>CS</span>
                        <strong>AB AUTO</strong>
                    </Link>
                </div>

                <p className="inscription-label">
                    ESPACE CLIENT
                </p>

                <h1>CRÉER UN COMPTE</h1>

                <p className="inscription-description">
                    Créez votre compte pour accéder à votre espace client.
                </p>

                {isRateLimited ? (
                    <div className="inscription-error">
                        {rateLimitMessage} Réessayez dans {retryAfterSeconds} seconde{retryAfterSeconds > 1 ? 's' : ''}.
                    </div>
                ) : error ? (
                    <div className="inscription-error">
                        {error}
                    </div>
                ) : success ? (
                    <div className="inscription-success">
                        {success}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit}>

                    <div className="inscription-row">

                        <div className="form-group">
                            <label>Prénom</label>

                            <input
                                type="text"
                                name="prenom"
                                value={form.prenom}
                                onChange={handleChange}
                                placeholder="Votre prénom"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Nom</label>

                            <input
                                type="text"
                                name="nom"
                                value={form.nom}
                                onChange={handleChange}
                                placeholder="Votre nom"
                                required
                            />
                        </div>

                    </div>

                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Votre adresse email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Téléphone</label>

                        <input
                            type="tel"
                            name="telephone"
                            value={form.telephone}
                            onChange={handleChange}
                            placeholder="Votre numéro de téléphone"
                        />
                    </div>

                    <div className="form-group">
                        <label>Adresse</label>

                        <input
                            type="text"
                            name="adresse"
                            value={form.adresse}
                            onChange={handleChange}
                            placeholder="Votre adresse"
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Votre mot de passe"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirmez votre mot de passe"
                            minLength={8}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isRateLimited}
                    >
                        {isRateLimited
                            ? `Réessayez dans ${retryAfterSeconds}s`
                            : loading
                                ? 'CRÉATION...'
                                : 'CRÉER MON COMPTE →'}
                    </button>

                </form>

                <p className="inscription-login">
                    Déjà un compte ?
                    {' '}
                    <Link to="/login">
                        Se connecter
                    </Link>
                </p>

            </div>

        </main>
    );
}
