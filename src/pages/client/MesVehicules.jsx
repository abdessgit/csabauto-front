import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getVehicules,
    createVehicule,
    updateVehicule,
    deleteVehicule,
} from '../../api/vehicules';
import '../../assets/css/RendezVousModerateur.css';

function normalizeCollection(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
}

const emptyForm = {
    id: null,
    marque: '',
    modele: '',
    annee: '',
    immatriculation: '',
    kilometrage: '',
    couleur: '',
};

export default function MesVehicules() {
    const { user } = useAuth();

    const [vehicules, setVehicules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const data = await getVehicules();
            setVehicules(normalizeCollection(data));
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur chargement véhicules :', err);
            }
            setError('Impossible de charger vos véhicules.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredVehicules = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return vehicules;

        return vehicules.filter((v) => {
            const marque = (v.marque || '').toLowerCase();
            const modele = (v.modele || '').toLowerCase();
            const immat = (v.immatriculation || '').toLowerCase();
            const couleur = (v.couleur || '').toLowerCase();

            return (
                marque.includes(query) ||
                modele.includes(query) ||
                immat.includes(query) ||
                couleur.includes(query)
            );
        });
    }, [vehicules, search]);

    function openCreateModal() {
        setError('');
        setSuccess('');
        setFieldErrors({});
        setForm(emptyForm);
        setShowModal(true);
    }

    function openEditModal(v) {
        setError('');
        setSuccess('');
        setFieldErrors({});
        setForm({
            id: v.id,
            marque: v.marque || '',
            modele: v.modele || '',
            annee: v.annee ? String(v.annee) : '',
            immatriculation: v.immatriculation || '',
            kilometrage: v.kilometrage !== null && v.kilometrage !== undefined ? String(v.kilometrage) : '',
            couleur: v.couleur || '',
        });
        setShowModal(true);
    }

    async function handleDelete(id) {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await deleteVehicule(id);
            setSuccess('Véhicule supprimé avec succès.');
            loadData();
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur suppression véhicule :', err);
            }
            setError(
                err.response?.data?.error ||
                'Impossible de supprimer ce véhicule. Il est peut-être lié à un rendez-vous ou une intervention.'
            );
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;

        setError('');
        setSuccess('');
        setFieldErrors({});

        const cleanImmat = form.immatriculation.trim().toUpperCase();
        const sivRegex = /^[A-Z]{2}[-\s]?[0-9]{3}[-\s]?[A-Z]{2}$/i;
        const fniRegex = /^[0-9]{1,4}[-\s]?[A-Z]{2,3}[-\s]?[0-9]{2}$/i;

        if (!sivRegex.test(cleanImmat) && !fniRegex.test(cleanImmat)) {
            setFieldErrors({
                immatriculation: 'Format d’immatriculation invalide (ex: AB-123-CD ou 1234-AB-75).',
            });
            return;
        }

        setSubmitting(true);

        const parsedAnnee = parseInt(form.annee, 10);
        const parsedKilometrage = form.kilometrage !== '' ? parseInt(form.kilometrage, 10) : 0;

        const payload = {
            marque: form.marque.trim(),
            modele: form.modele.trim(),
            annee: Number.isNaN(parsedAnnee) ? null : parsedAnnee,
            immatriculation: cleanImmat,
            kilometrage: Number.isNaN(parsedKilometrage) ? null : parsedKilometrage,
            couleur: form.couleur ? form.couleur.trim() : null,
        };

        try {
            if (form.id) {
                await updateVehicule(form.id, payload);
                setSuccess('Véhicule mis à jour avec succès.');
            } else {
                await createVehicule(payload);
                setSuccess('Véhicule ajouté avec succès.');
            }

            setShowModal(false);
            setForm(emptyForm);
            loadData();
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur enregistrement véhicule :', err);
            }

            const serverData = err.response?.data;
            const newFieldErrors = {};

            if (serverData?.errors && typeof serverData.errors === 'object') {
                Object.assign(newFieldErrors, serverData.errors);
            }

            if (err.response?.status === 409 || serverData?.error?.toLowerCase().includes('immatriculation')) {
                newFieldErrors.immatriculation =
                    serverData?.errors?.immatriculation ||
                    serverData?.error ||
                    'Un véhicule avec cette immatriculation existe déjà.';
            }

            setFieldErrors(newFieldErrors);

            setError(
                serverData?.error ||
                serverData?.message ||
                'Erreur lors de l’enregistrement du véhicule.'
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
                    <h1>Mes Véhicules</h1>
                    <p>Gérez votre parc automobile pour simplifier vos demandes de rendez-vous et vos réparations.</p>
                </div>

                <button
                    className="rdv-primary-button"
                    onClick={openCreateModal}
                >
                    + Ajouter un véhicule
                </button>
            </div>

            {/* ALERTS */}
            {error && <div className="rdv-alert rdv-alert-error">{error}</div>}
            {success && <div className="rdv-alert rdv-alert-success">{success}</div>}

            {/* TOOLBAR */}
            <div className="rdv-toolbar">
                <div className="rdv-search">
                    <input
                        type="text"
                        placeholder="Rechercher par marque, modèle ou immatriculation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="rdv-count">
                    {filteredVehicules.length} véhicule{filteredVehicules.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* TABLE */}
            <div className="rdv-table-container">
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement de vos véhicules...</p>
                    </div>
                ) : filteredVehicules.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">▣</div>
                        <h2>Aucun véhicule trouvé</h2>
                        <p>Vous n'avez pas encore enregistré de véhicule.</p>
                    </div>
                ) : (
                    <div className="rdv-table-wrapper">
                        <table className="rdv-table">
                            <thead>
                                <tr>
                                    <th>Véhicule</th>
                                    <th>Immatriculation</th>
                                    <th>Année</th>
                                    <th>Kilométrage</th>
                                    <th>Couleur</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicules.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <strong>{v.marque} {v.modele}</strong>
                                        </td>
                                        <td>
                                            <span className="rdv-immat">
                                                {v.immatriculation || '-'}
                                            </span>
                                        </td>
                                        <td>{v.annee || '-'}</td>
                                        <td>
                                            {v.kilometrage !== null && v.kilometrage !== undefined
                                                ? `${Number(v.kilometrage).toLocaleString('fr-FR')} km`
                                                : '-'}
                                        </td>
                                        <td>{v.couleur || '-'}</td>
                                        <td>
                                            <div className="rdv-actions">
                                                <button
                                                    className="rdv-action-edit"
                                                    onClick={() => openEditModal(v)}
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    className="rdv-action-delete"
                                                    onClick={() => handleDelete(v.id)}
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL CRÉATION / MODIFICATION */}
            {showModal && (
                <div
                    className="rdv-modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="rdv-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rdv-modal-header">
                            <div>
                                <span>ESPACE CLIENT</span>
                                <h2>{form.id ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</h2>
                            </div>
                            <button
                                className="rdv-close"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="rdv-form-grid">
                                <div className="rdv-field">
                                    <label>Marque *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Peugeot, Renault, Audi..."
                                        value={form.marque}
                                        onChange={(e) =>
                                            setForm({ ...form, marque: e.target.value })
                                        }
                                        required
                                    />
                                    {fieldErrors.marque && (
                                        <span className="rdv-field-error">{fieldErrors.marque}</span>
                                    )}
                                </div>

                                <div className="rdv-field">
                                    <label>Modèle *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 208, Clio, A3..."
                                        value={form.modele}
                                        onChange={(e) =>
                                            setForm({ ...form, modele: e.target.value })
                                        }
                                        required
                                    />
                                    {fieldErrors.modele && (
                                        <span className="rdv-field-error">{fieldErrors.modele}</span>
                                    )}
                                </div>

                                <div className="rdv-field">
                                    <label>Immatriculation *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: AB-123-CD"
                                        value={form.immatriculation}
                                        onChange={(e) =>
                                            setForm({ ...form, immatriculation: e.target.value })
                                        }
                                        required
                                    />
                                    {fieldErrors.immatriculation && (
                                        <span className="rdv-field-error">{fieldErrors.immatriculation}</span>
                                    )}
                                </div>

                                <div className="rdv-field">
                                    <label>Année *</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 2020"
                                        min="1950"
                                        max={new Date().getFullYear() + 1}
                                        value={form.annee}
                                        onChange={(e) =>
                                            setForm({ ...form, annee: e.target.value })
                                        }
                                        required
                                    />
                                    {fieldErrors.annee && (
                                        <span className="rdv-field-error">{fieldErrors.annee}</span>
                                    )}
                                </div>

                                <div className="rdv-field">
                                    <label>Kilométrage *</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 45000"
                                        min="0"
                                        value={form.kilometrage}
                                        onChange={(e) =>
                                            setForm({ ...form, kilometrage: e.target.value })
                                        }
                                        required
                                    />
                                    {fieldErrors.kilometrage && (
                                        <span className="rdv-field-error">{fieldErrors.kilometrage}</span>
                                    )}
                                </div>

                                <div className="rdv-field">
                                    <label>Couleur</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Noir, Blanc, Bleu..."
                                        value={form.couleur}
                                        onChange={(e) =>
                                            setForm({ ...form, couleur: e.target.value })
                                        }
                                    />
                                    {fieldErrors.couleur && (
                                        <span className="rdv-field-error">{fieldErrors.couleur}</span>
                                    )}
                                </div>
                            </div>

                            <div className="rdv-modal-footer">
                                <button
                                    type="button"
                                    className="rdv-secondary-button"
                                    onClick={() => setShowModal(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rdv-primary-button"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? 'Enregistrement...'
                                        : form.id
                                            ? 'Mettre à jour'
                                            : 'Ajouter le véhicule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
