import { useEffect, useMemo, useState } from 'react';
import BackToDashboardButton from '../components/BackToDashboardButton';

import {
    getRendezVous,
    createRendezVous,
    updateRendezVous,
    updateStatutRendezVous,
    deleteRendezVous,
} from '../api/rendezVous';

import { getVehicules } from '../api/vehicules';
import axiosClient from '../api/axiosClient';

import '../assets/css/RendezVousModerateur.css';

const STATUTS = [
    'EN_ATTENTE',
    'CONFIRME',
    'ANNULE',
    'TERMINE',
];

const initialForm = {
    id: null,
    dateHeure: '',
    motif: '',
    clientId: '',
    vehiculeId: '',
    moderateurId: '',
};

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

function getClientName(client) {
    if (!client) return 'Client inconnu';

    const fullName = `${client.prenom || ''} ${client.nom || ''}`.trim();

    return fullName || client.email || `Client #${client.id}`;
}

function getVehiculeName(vehicule) {
    if (!vehicule) return 'Véhicule inconnu';

    const marque = vehicule.marque || '';
    const modele = vehicule.modele || '';

    const name = `${marque} ${modele}`.trim();

    return name || `Véhicule #${vehicule.id}`;
}

function getStatutLabel(statut) {
    const labels = {
        EN_ATTENTE: 'En attente',
        CONFIRME: 'Confirmé',
        ANNULE: 'Annulé',
        TERMINE: 'Terminé',
    };

    return labels[statut] || statut;
}

export default function RendezVousModerateur() {
    const [rendezVous, setRendezVous] = useState([]);
    const [clients, setClients] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [moderateurs, setModerateurs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState('TOUS');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(initialForm);

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const [
                rendezVousData,
                clientsResponse,
                vehiculesData,
            ] = await Promise.all([
                getRendezVous(),
                axiosClient.get('/utilisateurs'),
                getVehicules(),
            ]);

            setRendezVous(normalizeCollection(rendezVousData));
            setVehicules(normalizeCollection(vehiculesData));

            const users = normalizeCollection(clientsResponse.data);

            // Uniquement les utilisateurs avec le rôle CLIENT
            const clientsOnly = users.filter((user) =>
                (user.roles || []).includes('ROLE_CLIENT')
            );

            // Uniquement les utilisateurs avec le rôle MODERATEUR
            const moderateursOnly = users.filter((user) =>
                (user.roles || []).includes('ROLE_MODERATEUR')
            );

            setClients(clientsOnly);
            setModerateurs(moderateursOnly);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.error ||
                'Impossible de charger les rendez-vous.'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredRendezVous = useMemo(() => {
        return rendezVous.filter((rdv) => {
            const clientName = getClientName(rdv.client).toLowerCase();
            const vehicleName = getVehiculeName(rdv.vehicule).toLowerCase();
            const motif = (rdv.motif || '').toLowerCase();

            const searchValue = search.toLowerCase().trim();

            const matchesSearch =
                !searchValue ||
                clientName.includes(searchValue) ||
                vehicleName.includes(searchValue) ||
                motif.includes(searchValue);

            const matchesStatus =
                filterStatut === 'TOUS' ||
                rdv.statut === filterStatut;

            return matchesSearch && matchesStatus;
        });
    }, [rendezVous, search, filterStatut]);

    const vehiculesDuClient = useMemo(() => {
        if (!form.clientId) return [];
        return vehicules.filter((v) => v.proprietaire?.id === Number(form.clientId));
    }, [vehicules, form.clientId]);

    function openCreateModal() {
        setForm(initialForm);
        setError('');
        setShowModal(true);
    }

    function openEditModal(rdv) {
        setForm({
            id: rdv.id,
            dateHeure: rdv.dateHeure
                ? rdv.dateHeure.substring(0, 16)
                : '',
            motif: rdv.motif || '',
            clientId: rdv.client?.id || '',
            vehiculeId: rdv.vehicule?.id || '',
            moderateurId: rdv.moderateur?.id || '',
        });

        setError('');
        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;

        setShowModal(false);
        setForm(initialForm);
    }

    function handleChange(event) {
        const { name, value } = event.target;

        if (name === 'clientId') {
            const newClientId = value ? Number(value) : null;
            const currentVehicule = vehicules.find((v) => v.id === Number(form.vehiculeId));
            const stillBelongs = currentVehicule && newClientId && currentVehicule.proprietaire?.id === newClientId;

            setForm((previous) => ({
                ...previous,
                clientId: value,
                vehiculeId: stillBelongs ? previous.vehiculeId : '',
            }));
            return;
        }

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            if (!form.dateHeure) {
                setError('La date et l’heure sont obligatoires.');
                return;
            }

            if (!form.clientId) {
                setError('Veuillez sélectionner un client.');
                return;
            }

            if (!form.vehiculeId) {
                setError('Veuillez sélectionner un véhicule.');
                return;
            }

            const date = new Date(form.dateHeure);

            const dateHeure = date
                .toISOString()
                .replace(/\.\d{3}Z$/, '+00:00');

            const data = {
                dateHeure: form.dateHeure,
                motif: form.motif || null,
                clientId: Number(form.clientId),
                vehiculeId: Number(form.vehiculeId),
                moderateurId: form.moderateurId
                    ? Number(form.moderateurId)
                    : null,
            };

            if (form.id) {
                await updateRendezVous(form.id, data);
                setSuccess('Rendez-vous modifié avec succès.');
            } else {
                await createRendezVous(data);
                setSuccess('Rendez-vous créé avec succès.');
            }

            setShowModal(false);
            setForm(initialForm);

            await loadData();
        } catch (err) {
            console.error('Erreur rendez-vous :', err);
            console.error('Réponse API :', err.response?.data);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Une erreur est survenue.'
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleStatut(id, statut) {
        try {
            setError('');
            setSuccess('');

            await updateStatutRendezVous(id, statut);

            setRendezVous((previous) =>
                previous.map((rdv) =>
                    rdv.id === id
                        ? { ...rdv, statut }
                        : rdv
                )
            );

            setSuccess('Statut mis à jour.');
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.error ||
                'Impossible de modifier le statut.'
            );
        }
    }

    async function handleDelete(id) {
        const confirmed = window.confirm(
            'Voulez-vous vraiment supprimer ce rendez-vous ?'
        );

        if (!confirmed) return;

        try {
            setError('');
            setSuccess('');

            await deleteRendezVous(id);

            setRendezVous((previous) =>
                previous.filter((rdv) => rdv.id !== id)
            );

            setSuccess('Rendez-vous supprimé.');
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.error ||
                'Impossible de supprimer le rendez-vous.'
            );
        }
    }

    return (
        <div className="rdv-page">

            <header className="rdv-header">
                <div>
                    <BackToDashboardButton />

                    <h1>Gestion des rendez-vous</h1>

                    <p>
                        Gérez les rendez-vous clients de CS AB AUTO.
                    </p>
                </div>

                <button
                    className="rdv-primary-button"
                    onClick={openCreateModal}
                >
                    + Nouveau rendez-vous
                </button>
            </header>

            {error && (
                <div className="rdv-alert rdv-alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="rdv-alert rdv-alert-success">
                    {success}
                </div>
            )}

            <section className="rdv-toolbar">

                <div className="rdv-search">
                    <input
                        type="text"
                        placeholder="Rechercher un client, véhicule..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                <select
                    value={filterStatut}
                    onChange={(event) =>
                        setFilterStatut(event.target.value)
                    }
                >
                    <option value="TOUS">Tous les statuts</option>

                    {STATUTS.map((statut) => (
                        <option key={statut} value={statut}>
                            {getStatutLabel(statut)}
                        </option>
                    ))}
                </select>

                <div className="rdv-count">
                    {filteredRendezVous.length} rendez-vous
                </div>

            </section>

            <section className="rdv-table-container">

                {loading ? (
                    <div className="rdv-loading">
                        Chargement des rendez-vous...
                    </div>
                ) : filteredRendezVous.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">📅</div>

                        <h2>Aucun rendez-vous</h2>

                        <p>
                            Aucun rendez-vous ne correspond à votre recherche.
                        </p>
                    </div>
                ) : (
                    <div className="rdv-table-wrapper">

                        <table className="rdv-table">

                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Client</th>
                                    <th>Véhicule</th>
                                    <th>Motif</th>
                                    <th>Modérateur</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredRendezVous.map((rdv) => (

                                    <tr key={rdv.id}>

                                        <td>
                                            <strong>
                                                {formatDate(rdv.dateHeure)}
                                            </strong>
                                        </td>

                                        <td>
                                            <div className="rdv-client">
                                                <strong>
                                                    {getClientName(rdv.client)}
                                                </strong>

                                                <span>
                                                    {rdv.client?.email || ''}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            {getVehiculeName(rdv.vehicule)}
                                        </td>

                                        <td>
                                            {rdv.motif || '—'}
                                        </td>

                                        <td>
                                            {rdv.moderateur
                                                ? getClientName(rdv.moderateur)
                                                : 'Non assigné'}
                                        </td>

                                        <td>
                                            <select
                                                className={`rdv-status-select status-${(
                                                    rdv.statut || ''
                                                ).toLowerCase()}`}
                                                value={rdv.statut || ''}
                                                onChange={(event) =>
                                                    handleStatut(
                                                        rdv.id,
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                {STATUTS.map((statut) => (
                                                    <option
                                                        key={statut}
                                                        value={statut}
                                                    >
                                                        {getStatutLabel(statut)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            <div className="rdv-actions">

                                                <button
                                                    className="rdv-action-edit"
                                                    onClick={() =>
                                                        openEditModal(rdv)
                                                    }
                                                >
                                                    Modifier
                                                </button>

                                                <button
                                                    className="rdv-action-delete"
                                                    onClick={() =>
                                                        handleDelete(rdv.id)
                                                    }
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

            </section>

            {showModal && (
                <div
                    className="rdv-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >

                    <div className="rdv-modal">

                        <div className="rdv-modal-header">

                            <div>
                                <span>CS AB AUTO</span>

                                <h2>
                                    {form.id
                                        ? 'Modifier le rendez-vous'
                                        : 'Nouveau rendez-vous'}
                                </h2>
                            </div>

                            <button
                                className="rdv-close"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="rdv-form-grid">

                                <div className="rdv-field">
                                    <label>
                                        Date et heure *
                                    </label>

                                    <input
                                        type="datetime-local"
                                        name="dateHeure"
                                        value={form.dateHeure}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>
                                        Client *
                                    </label>

                                    <select
                                        name="clientId"
                                        value={form.clientId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Sélectionner un client
                                        </option>

                                        {clients.map((client) => (
                                            <option
                                                key={client.id}
                                                value={client.id}
                                            >
                                                {getClientName(client)}
                                                {client.email
                                                    ? ` — ${client.email}`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="rdv-field">
                                    <label>
                                        Véhicule *
                                    </label>

                                    <select
                                        name="vehiculeId"
                                        value={form.vehiculeId}
                                        onChange={handleChange}
                                        required
                                        disabled={!form.clientId || vehiculesDuClient.length === 0}
                                    >
                                        {!form.clientId ? (
                                            <option value="">
                                                Sélectionnez d'abord un client
                                            </option>
                                        ) : vehiculesDuClient.length === 0 ? (
                                            <option value="">
                                                Aucun véhicule enregistré pour ce client
                                            </option>
                                        ) : (
                                            <>
                                                <option value="">
                                                    Sélectionner un véhicule
                                                </option>

                                                {vehiculesDuClient.map((vehicule) => (
                                                    <option
                                                        key={vehicule.id}
                                                        value={vehicule.id}
                                                    >
                                                        {getVehiculeName(vehicule)}
                                                        {vehicule.immatriculation
                                                            ? ` — ${vehicule.immatriculation}`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="rdv-field">
                                    <label>
                                        Modérateur
                                    </label>

                                    <select
                                        name="moderateurId"
                                        value={form.moderateurId}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Non assigné
                                        </option>

                                        {moderateurs.map((moderateur) => (
                                            <option
                                                key={moderateur.id}
                                                value={moderateur.id}
                                            >
                                                {getClientName(moderateur)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="rdv-field rdv-field-full">
                                    <label>
                                        Motif
                                    </label>

                                    <textarea
                                        name="motif"
                                        value={form.motif}
                                        onChange={handleChange}
                                        placeholder="Motif du rendez-vous..."
                                        rows="4"
                                    />
                                </div>

                            </div>

                            <div className="rdv-modal-footer">

                                <button
                                    type="button"
                                    className="rdv-secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="rdv-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Enregistrement...'
                                        : form.id
                                            ? 'Enregistrer les modifications'
                                            : 'Créer le rendez-vous'}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}