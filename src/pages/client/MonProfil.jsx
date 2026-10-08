import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUtilisateur, updateUtilisateur } from '../../api/utilisateurs';
import '../../assets/css/RendezVousModerateur.css';

export default function MonProfil() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });

    useEffect(() => {
        async function loadProfile() {
            if (!user?.id) return;
            setLoading(true);
            setError('');
            try {
                const data = await getUtilisateur(user.id);
                setForm((prev) => ({
                    ...prev,
                    prenom: data.prenom || '',
                    nom: data.nom || '',
                    email: data.email || '',
                    telephone: data.telephone || '',
                    adresse: data.adresse || '',
                }));
            } catch (err) {
                console.error('Erreur chargement profil :', err);
                // Fallback avec les données du AuthContext
                setForm((prev) => ({
                    ...prev,
                    prenom: user.prenom || '',
                    nom: user.nom || '',
                    email: user.email || '',
                }));
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [user]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.currentPassword) {
            setError('Veuillez renseigner votre mot de passe actuel pour confirmer les modifications.');
            return;
        }

        if (form.newPassword) {
            if (form.newPassword.length < 6) {
                setError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
                return;
            }
            if (form.newPassword !== form.confirmNewPassword) {
                setError('La confirmation du nouveau mot de passe ne correspond pas.');
                return;
            }
        }

        setSubmitting(true);

        // Si l'utilisateur a saisi un nouveau mot de passe, on l'utilise, sinon on confirme avec le mot de passe actuel
        const passwordToSend = form.newPassword
            ? form.newPassword
            : form.currentPassword;

        const payload = {
            prenom: form.prenom.trim(),
            nom: form.nom.trim(),
            email: form.email.trim(),
            telephone: form.telephone ? form.telephone.trim() : '',
            adresse: form.adresse ? form.adresse.trim() : '',
            password: passwordToSend,
        };

        try {
            await updateUtilisateur(user.id, payload);
            setSuccess('Vos informations de profil ont été mises à jour avec succès.');
            setForm((prev) => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            }));
        } catch (err) {
            console.error('Erreur mise à jour profil :', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Erreur lors de la mise à jour du profil. Vérifiez votre mot de passe actuel.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="rdv-page">

            {/* HEADER */}
            <div className="rdv-header">
                <div>
                    <Link to="/dashboard/client" className="rdv-back">
                        ← Retour au tableau de bord
                    </Link>
                    <h1>Mon Profil</h1>
                    <p>Consultez et modifiez vos informations personnelles de contact et de sécurité.</p>
                </div>
            </div>

            {/* ALERTS */}
            {error && <div className="rdv-alert rdv-alert-error">{error}</div>}
            {success && <div className="rdv-alert rdv-alert-success">{success}</div>}

            {/* CARD FORM */}
            <div className="rdv-table-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '35px' }}>
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement de vos informations...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Informations personnelles</h3>
                            <p style={{ margin: 0, color: '#777', fontSize: '13px' }}>
                                Vos coordonnées utilisées pour les devis, factures et rappels de rendez-vous.
                            </p>
                        </div>

                        <div className="rdv-form-grid" style={{ marginBottom: '30px' }}>
                            <div className="rdv-field">
                                <label>Prénom *</label>
                                <input
                                    type="text"
                                    value={form.prenom}
                                    onChange={(e) =>
                                        setForm({ ...form, prenom: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="rdv-field">
                                <label>Nom *</label>
                                <input
                                    type="text"
                                    value={form.nom}
                                    onChange={(e) =>
                                        setForm({ ...form, nom: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="rdv-field">
                                <label>Adresse email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="rdv-field">
                                <label>Téléphone</label>
                                <input
                                    type="tel"
                                    placeholder="06 12 34 56 78"
                                    value={form.telephone}
                                    onChange={(e) =>
                                        setForm({ ...form, telephone: e.target.value })
                                    }
                                />
                            </div>

                            <div className="rdv-field rdv-field-full">
                                <label>Adresse postale</label>
                                <input
                                    type="text"
                                    placeholder="123 Rue de l'Auto, 75000 Paris"
                                    value={form.adresse}
                                    onChange={(e) =>
                                        setForm({ ...form, adresse: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>Changement de mot de passe (optionnel)</h3>
                            <p style={{ margin: 0, color: '#777', fontSize: '13px' }}>
                                Laissez ces deux champs vides si vous ne souhaitez pas modifier votre mot de passe.
                            </p>
                        </div>

                        <div className="rdv-form-grid" style={{ marginBottom: '30px' }}>
                            <div className="rdv-field">
                                <label>Nouveau mot de passe</label>
                                <input
                                    type="password"
                                    placeholder="Au moins 6 caractères"
                                    value={form.newPassword}
                                    onChange={(e) =>
                                        setForm({ ...form, newPassword: e.target.value })
                                    }
                                />
                            </div>

                            <div className="rdv-field">
                                <label>Confirmer le nouveau mot de passe</label>
                                <input
                                    type="password"
                                    placeholder="Répétez le nouveau mot de passe"
                                    value={form.confirmNewPassword}
                                    onChange={(e) =>
                                        setForm({ ...form, confirmNewPassword: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px', padding: '16px', background: '#fff9e6', border: '1px solid #fae19c', borderRadius: '8px' }}>
                            <div className="rdv-field">
                                <label style={{ color: '#855e00' }}>
                                    Mot de passe actuel (obligatoire) *
                                </label>
                                <input
                                    type="password"
                                    placeholder="Saisissez votre mot de passe actuel"
                                    value={form.currentPassword}
                                    onChange={(e) =>
                                        setForm({ ...form, currentPassword: e.target.value })
                                    }
                                    required
                                    style={{ borderColor: '#e6c364' }}
                                />
                                <small style={{ color: '#855e00', marginTop: '5px', fontWeight: 600 }}>
                                    Confirmez votre mot de passe pour enregistrer les modifications.
                                </small>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button
                                type="submit"
                                className="rdv-primary-button"
                                disabled={submitting}
                                style={{ minWidth: '200px' }}
                            >
                                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

        </div>
    );
}
