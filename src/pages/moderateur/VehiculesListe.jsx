import { useEffect, useMemo, useState } from 'react';
import BackToDashboardButton from '../../components/BackToDashboardButton';
import {
    getVehicules,
    createVehicule,
    updateVehicule,
    deleteVehicule,
} from '../../api/vehicules';
import { getUtilisateurs } from '../../api/utilisateurs';
import '../../assets/css/RendezVousModerateur.css';

function normalizeCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
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
    proprietaireId: '',
};

export default function VehiculesListe() {
    const [vehicules, setVehicules] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const [vehiculesData, clientsData] = await Promise.all([
                getVehicules(),
                getUtilisateurs().catch(() => []),
            ]);
            setVehicules(normalizeCollection(vehiculesData));
            setClients(normalizeCollection(clientsData));
        } catch (err) {
            console.error('Erreur chargement véhicules :', err);
            setError('Impossible de charger les véhicules.');
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
            const proprietaire = v.proprietaire
                ? `${v.proprietaire.prenom || ''} ${v.proprietaire.nom || ''} ${v.proprietaire.email || ''}`.toLowerCase()
                : '';

            return (
                marque.includes(query) ||
                modele.includes(query) ||
                immat.includes(query) ||
                proprietaire.includes(query)
            );
        });
    }, [vehicules, search]);

    function openCreateModal() {
        setError('');
        setSuccess('');
        setForm({
            ...emptyForm,
            proprietaireId: clients[0]?.id ? String(clients[0].id) : '',
        });
        setShowModal(true);
    }

    function openEditModal(v) {
        setError('');
        setSuccess('');
        setForm({
            id: v.id,
            marque: v.marque || '',
            modele: v.modele || '',
            annee: v.annee ? String(v.annee) : '',
            immatriculation: v.immatriculation || '',
            kilometrage: v.kilometrage !== null && v.kilometrage !== undefined ? String(v.kilometrage) : '',
            couleur: v.couleur || '',
            proprietaireId: v.proprietaire?.id ? String(v.proprietaire.id) : '',
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
            console.error('Erreur suppression véhicule :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de supprimer ce véhicule. Il est peut-être lié à une intervention ou un rendez-vous.'
            );
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;

        setError('');
        setSuccess('');

        if (!form.proprietaireId) {
            setError('Veuillez sélectionner un propriétaire.');
            return;
        }

        const cleanImmat = form.immatriculation.trim().toUpperCase();
        const sivRegex = /^[A-Z]{2}[-\s]?[0-9]{3}[-\s]?[A-Z]{2}$/i;
        const fniRegex = /^[0-9]{1,4}[-\s]?[A-Z]{2,3}[-\s]?[0-9]{2}$/i;

        if (!sivRegex.test(cleanImmat) && !fniRegex.test(cleanImmat)) {
            setError('Format d’immatriculation invalide (ex: AB-123-CD ou 1234-AB-75).');
            return;
        }

        setSubmitting(true);

        const payload = {
            marque: form.marque.trim(),
            modele: form.modele.trim(),
            annee: parseInt(form.annee, 10),
            immatriculation: cleanImmat,
            kilometrage: parseInt(form.kilometrage, 10) || 0,
            couleur: form.couleur ? form.couleur.trim() : null,
            proprietaireId: parseInt(form.proprietaireId, 10),
        };

        try {
            if (form.id) {
                await updateVehicule(form.id, payload);
                setSuccess('Véhicule mis à jour avec succès.');
            } else {
                await createVehicule(payload);
                setSuccess('Véhicule créé avec succès.');
            }

            setShowModal(false);
            setForm(emptyForm);
            loadData();
        } catch (err) {
            console.error('Erreur enregistrement véhicule :', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
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
                    <BackToDashboardButton />
                    <h1>Gestion des Véhicules</h1>
                    <p>Consultez, modifiez et gérez l’ensemble des véhicules enregistrés par les clients.</p>
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
                        placeholder="Rechercher par marque, modèle, immatriculation ou propriétaire..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="rdv-count">
                    {filteredVehicules.length} véhicule{filteredVehicules.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* TABLEAU */}
            <div className="rdv-table-container">
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement des véhicules...</p>
                    </div>
                ) : filteredVehicules.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">🚗</div>
                        <h2>Aucun véhicule trouvé</h2>
                        <p>Aucun véhicule ne correspond aux critères de recherche.</p>
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
                                    <th>Propriétaire</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicules.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <strong>{v.marque} {v.modele}</strong>
                                            {v.couleur && (
                                                <div style={{ fontSize: '12px', color: '#777' }}>
                                                    {v.couleur}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                                                {v.immatriculation || '-'}
                                            </span>
                                        </td>
                                        <td>{v.annee || '-'}</td>
                                        <td>
                                            {v.kilometrage !== null && v.kilometrage !== undefined
                                                ? `${Number(v.kilometrage).toLocaleString('fr-FR')} km`
                                                : '-'}
                                        </td>
                                        <td>
                                            {v.proprietaire ? (
                                                <div className="rdv-client">
                                                    <strong>{v.proprietaire.prenom} {v.proprietaire.nom}</strong>
                                                    <span>{v.proprietaire.email}</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#999' }}>Sans propriétaire</span>
                                            )}
                                        </td>
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

            {/* MODAL CRÉATION / ÉDITION */}
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
                                <span>ESPACE MODÉRATEUR</span>
                                <h2>{form.id ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h2>
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
                                <div className="rdv-field rdv-field-full">
                                    <label>Propriétaire du véhicule *</label>
                                    <select
                                        value={form.proprietaireId}
                                        onChange={(e) =>
                                            setForm({ ...form, proprietaireId: e.target.value })
                                        }
                                        required
                                    >
                                        <option value="">-- Choisir un client --</option>
                                        {clients.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.prenom} {c.nom} ({c.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="rdv-field">
                                    <label>Marque *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Peugeot, Renault..."
                                        value={form.marque}
                                        onChange={(e) =>
                                            setForm({ ...form, marque: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Modèle *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 308, Clio..."
                                        value={form.modele}
                                        onChange={(e) =>
                                            setForm({ ...form, modele: e.target.value })
                                        }
                                        required
                                    />
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
                                </div>

                                <div className="rdv-field">
                                    <label>Année *</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 2021"
                                        min="1950"
                                        max={new Date().getFullYear() + 1}
                                        value={form.annee}
                                        onChange={(e) =>
                                            setForm({ ...form, annee: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Kilométrage *</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 48000"
                                        min="0"
                                        value={form.kilometrage}
                                        onChange={(e) =>
                                            setForm({ ...form, kilometrage: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Couleur</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Gris anthracite"
                                        value={form.couleur}
                                        onChange={(e) =>
                                            setForm({ ...form, couleur: e.target.value })
                                        }
                                    />
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
                                            : 'Créer le véhicule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
