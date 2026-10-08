import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getRendezVous,
    createRendezVous,
    updateStatutRendezVous,
} from '../../api/rendezVous';
import { getVehicules } from '../../api/vehicules';
import '../../assets/css/RendezVousModerateur.css';

const STATUTS = ['TOUS', 'EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE'];

function normalizeCollection(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data?.data)) {
        return data.data;
    }
    return [];
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

function getVehicleLabel(vehicule) {
    if (!vehicule) return 'Véhicule non spécifié';
    const marque = vehicule.marque || '';
    const modele = vehicule.modele || '';
    const immat = vehicule.immatriculation ? `(${vehicule.immatriculation})` : '';
    return `${marque} ${modele} ${immat}`.trim() || `Véhicule #${vehicule.id}`;
}

export default function MesRendezVous() {
    const { user } = useAuth();
    const [rendezVous, setRendezVous] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('TOUS');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        dateHeure: '',
        vehiculeId: '',
        motif: '',
    });

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const [rdvData, vehiculesData] = await Promise.all([
                getRendezVous(),
                getVehicules(),
            ]);
            setRendezVous(normalizeCollection(rdvData));
            setVehicules(normalizeCollection(vehiculesData));
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur chargement rendez-vous :', err);
            }
            setError('Impossible de charger vos rendez-vous.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredRendezVous = useMemo(() => {
        const query = search.toLowerCase().trim();

        return rendezVous.filter((rdv) => {
            const matchesStatus =
                statusFilter === 'TOUS' || rdv.statut === statusFilter;

            const vehicleLabel = getVehicleLabel(rdv.vehicule).toLowerCase();
            const motif = (rdv.motif || '').toLowerCase();
            const dateStr = formatDate(rdv.dateHeure).toLowerCase();

            const matchesSearch =
                !query ||
                vehicleLabel.includes(query) ||
                motif.includes(query) ||
                dateStr.includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [rendezVous, search, statusFilter]);

    async function handleCancel(id) {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await updateStatutRendezVous(id, 'ANNULE');
            setSuccess('Rendez-vous annulé avec succès.');
            loadData();
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur annulation RDV :', err);
            }
            setError(
                err.response?.data?.error ||
                'Impossible d’annuler ce rendez-vous.'
            );
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.vehiculeId) {
            setError('Veuillez sélectionner un véhicule.');
            return;
        }

        if (!form.dateHeure) {
            setError('Veuillez sélectionner une date et une heure.');
            return;
        }

        setSubmitting(true);

        try {
            await createRendezVous({
                dateHeure: form.dateHeure,
                motif: form.motif,
                vehiculeId: parseInt(form.vehiculeId, 10),
                clientId: user?.id,
            });

            setSuccess('Votre demande de rendez-vous a été enregistrée.');
            setShowModal(false);
            setForm({ dateHeure: '', vehiculeId: '', motif: '' });
            loadData();
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur création RDV :', err);
            }

            const serverData = err.response?.data;
            let errorMessage = 'Erreur lors de la prise de rendez-vous.';

            if (serverData?.error) {
                errorMessage = serverData.error;
            } else if (serverData?.errors) {
                if (typeof serverData.errors === 'object') {
                    errorMessage = Object.entries(serverData.errors)
                        .map(([field, msg]) => `${field} : ${msg}`)
                        .join(' | ');
                } else {
                    errorMessage = String(serverData.errors);
                }
            } else if (serverData?.message) {
                errorMessage = serverData.message;
            }

            setError(errorMessage);
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
                    <h1>Mes Rendez-vous</h1>
                    <p>Consultez vos rendez-vous et planifiez une nouvelle visite au garage.</p>
                </div>

                <button
                    className="rdv-primary-button"
                    onClick={() => {
                        setError('');
                        setSuccess('');
                        setForm({
                            dateHeure: '',
                            vehiculeId: vehicules[0]?.id ? String(vehicules[0].id) : '',
                            motif: '',
                        });
                        setShowModal(true);
                    }}
                >
                    + Prendre un rendez-vous
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
                        placeholder="Rechercher par véhicule, motif ou date..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    {STATUTS.map((st) => (
                        <option key={st} value={st}>
                            {st === 'TOUS' ? 'Tous les statuts' : st}
                        </option>
                    ))}
                </select>

                <div className="rdv-count">
                    {filteredRendezVous.length} rendez-vous
                </div>
            </div>

            {/* TABLEAU */}
            <div className="rdv-table-container">
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement de vos rendez-vous...</p>
                    </div>
                ) : filteredRendezVous.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">◷</div>
                        <h2>Aucun rendez-vous trouvé</h2>
                        <p>Vous n'avez pas de rendez-vous correspondant à ces critères.</p>
                    </div>
                ) : (
                    <div className="rdv-table-wrapper">
                        <table className="rdv-table">
                            <thead>
                                <tr>
                                    <th>Date & Heure</th>
                                    <th>Véhicule</th>
                                    <th>Motif</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRendezVous.map((rdv) => {
                                    const canCancel =
                                        rdv.statut !== 'ANNULE' &&
                                        rdv.statut !== 'TERMINE';

                                    return (
                                        <tr key={rdv.id}>
                                            <td>
                                                <strong>{formatDate(rdv.dateHeure)}</strong>
                                            </td>
                                            <td>
                                                {getVehicleLabel(rdv.vehicule)}
                                            </td>
                                            <td>
                                                {rdv.motif || 'Entretien général'}
                                            </td>
                                            <td>
                                                <span
                                                    className={`rdv-status-select status-${(
                                                        rdv.statut || 'en_attente'
                                                    ).toLowerCase()}`}
                                                    style={{ display: 'inline-block' }}
                                                >
                                                    {rdv.statut || 'EN_ATTENTE'}
                                                </span>
                                            </td>
                                            <td>
                                                {canCancel ? (
                                                    <div className="rdv-actions">
                                                        <button
                                                            className="rdv-action-delete"
                                                            onClick={() => handleCancel(rdv.id)}
                                                            title="Annuler ce rendez-vous"
                                                        >
                                                            Annuler
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '12px' }}>
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL CRÉATION DE RENDEZ-VOUS */}
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
                                <h2>Prendre un rendez-vous</h2>
                            </div>
                            <button
                                className="rdv-close"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div className="rdv-alert rdv-alert-error" style={{ margin: '15px 20px 0' }}>
                                {error}
                            </div>
                        )}

                        {vehicules.length === 0 ? (
                            <div style={{ padding: '25px', textAlign: 'center' }}>
                                <p style={{ marginBottom: '20px', color: '#666' }}>
                                    Vous n'avez aucun véhicule enregistré. Veuillez d'abord ajouter un véhicule pour pouvoir planifier un rendez-vous.
                                </p>
                                <Link
                                    to="/dashboard/client/vehicules"
                                    className="rdv-primary-button"
                                    style={{ display: 'inline-block', textDecoration: 'none' }}
                                >
                                    + Ajouter un véhicule d'abord
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="rdv-form-grid">
                                    <div className="rdv-field">
                                        <label>Date et heure *</label>
                                        <input
                                            type="datetime-local"
                                            value={form.dateHeure}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    dateHeure: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="rdv-field">
                                        <label>Sélectionner un véhicule *</label>
                                        <select
                                            value={form.vehiculeId}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    vehiculeId: e.target.value,
                                                })
                                            }
                                            required
                                        >
                                            <option value="">
                                                -- Choisir un véhicule --
                                            </option>
                                            {vehicules.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {getVehicleLabel(v)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="rdv-field rdv-field-full">
                                        <label>Motif de la visite</label>
                                        <textarea
                                            rows="3"
                                            placeholder="Ex: Révision des 30 000 km, contrôle des freins, vidange..."
                                            value={form.motif}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    motif: e.target.value,
                                                })
                                            }
                                            required
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
                                            : 'Confirmer le rendez-vous'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
