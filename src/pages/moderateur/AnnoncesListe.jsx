import { useEffect, useMemo, useState } from 'react';
import BackToDashboardButton from '../../components/BackToDashboardButton';
import {
    getAnnonces,
    createAnnonce,
    updateAnnonce,
    updateStatutAnnonce,
    deleteAnnonce,
    uploadPhotoAnnonce,
} from '../../api/annonces';
import '../../assets/css/RendezVousModerateur.css';

function normalizeCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function getImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

const emptyForm = {
    id: null,
    titre: '',
    marque: '',
    modele: '',
    annee: '',
    kilometrage: '',
    prix: '',
    carburant: 'essence',
    boite: 'manuelle',
    puissance: '',
    couleur: '',
    nbPortes: '5',
    nbPlaces: '5',
    description: '',
    statut: 'BROUILLON',
    photos: [],
};

export default function AnnoncesListe() {
    const [annonces, setAnnonces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalError, setModalError] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('TOUS');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const data = await getAnnonces();
            setAnnonces(normalizeCollection(data));
        } catch (err) {
            console.error('Erreur chargement annonces :', err);
            setError('Impossible de charger les annonces.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredAnnonces = useMemo(() => {
        const query = search.toLowerCase().trim();

        return annonces.filter((a) => {
            const matchesStatus =
                statusFilter === 'TOUS' || a.statut === statusFilter;

            const titre = (a.titre || '').toLowerCase();
            const marque = (a.marque || '').toLowerCase();
            const modele = (a.modele || '').toLowerCase();
            const desc = (a.description || '').toLowerCase();

            const matchesSearch =
                !query ||
                titre.includes(query) ||
                marque.includes(query) ||
                modele.includes(query) ||
                desc.includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [annonces, search, statusFilter]);

    function openCreateModal() {
        setError('');
        setSuccess('');
        setModalError('');
        setForm(emptyForm);
        setShowModal(true);
    }

    function openEditModal(annonce) {
        setError('');
        setSuccess('');
        setModalError('');
        setForm({
            id: annonce.id,
            titre: annonce.titre || '',
            marque: annonce.marque || '',
            modele: annonce.modele || '',
            annee: annonce.annee ? String(annonce.annee) : '',
            kilometrage: annonce.kilometrage !== null && annonce.kilometrage !== undefined ? String(annonce.kilometrage) : '',
            prix: annonce.prix || '',
            carburant: annonce.carburant || 'essence',
            boite: annonce.boite || 'manuelle',
            puissance: annonce.puissance ? String(annonce.puissance) : '',
            couleur: annonce.couleur || '',
            nbPortes: annonce.nbPortes ? String(annonce.nbPortes) : '5',
            nbPlaces: annonce.nbPlaces ? String(annonce.nbPlaces) : '5',
            description: annonce.description || '',
            statut: annonce.statut || 'BROUILLON',
            photos: Array.isArray(annonce.photos) ? [...annonce.photos] : [],
        });
        setShowModal(true);
    }

    async function handleTogglePublish(annonce) {
        setError('');
        setSuccess('');
        const willPublish = annonce.statut !== 'PUBLIEE';
        const targetStatut = willPublish ? 'PUBLIEE' : 'BROUILLON';

        if (willPublish && (!annonce.photos || annonce.photos.length === 0)) {
            setError('Impossible de publier cette annonce : au moins une photo est requise. Modifiez l’annonce pour en ajouter.');
            return;
        }

        try {
            await updateStatutAnnonce(annonce.id, targetStatut);
            setSuccess(willPublish ? 'Annonce publiée avec succès !' : 'Annonce repassée en brouillon.');
            loadData();
        } catch (err) {
            console.error('Erreur changement statut annonce :', err);
            setError(err.response?.data?.error || 'Erreur lors du changement de statut.');
        }
    }

    async function handleMarkSold(annonce) {
        if (!window.confirm(`Marquer l'annonce "${annonce.titre}" comme VENDUE ?`)) {
            return;
        }
        setError('');
        setSuccess('');
        try {
            await updateStatutAnnonce(annonce.id, 'VENDUE');
            setSuccess('Annonce marquée comme vendue.');
            loadData();
        } catch (err) {
            console.error('Erreur marquage vendue :', err);
            setError(err.response?.data?.error || 'Erreur lors du changement de statut.');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await deleteAnnonce(id);
            setSuccess('Annonce supprimée avec succès.');
            loadData();
        } catch (err) {
            console.error('Erreur suppression annonce :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de supprimer cette annonce.'
            );
        }
    }

    async function handlePhotoUpload(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setModalError('');

        const currentCount = form.photos.length;
        if (currentCount + files.length > 8) {
            setModalError(`Limite atteinte : 8 photos maximum par annonce (vous en avez déjà ${currentCount}).`);
            e.target.value = '';
            return;
        }

        // Vérification de la taille (5 Mo max par photo)
        const maxSize = 5 * 1024 * 1024;
        for (const file of files) {
            if (file.size > maxSize) {
                setModalError(`Le fichier "${file.name}" dépasse la limite autorisée de 5 Mo.`);
                e.target.value = '';
                return;
            }
        }

        setUploadingPhotos(true);
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('images[]', file);
            });

            const res = await uploadPhotoAnnonce(formData);
            const uploadedUrls = res.urls || (res.url ? [res.url] : []);

            setForm((prev) => ({
                ...prev,
                photos: [...prev.photos, ...uploadedUrls].slice(0, 8),
            }));
        } catch (err) {
            console.error('Erreur upload photos :', err);
            setModalError(
                err.response?.data?.error ||
                'Erreur lors du téléversement des photos.'
            );
        } finally {
            setUploadingPhotos(false);
            e.target.value = '';
        }
    }

    function removePhoto(indexToRemove) {
        setForm((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, idx) => idx !== indexToRemove),
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setModalError('');
        setError('');
        setSuccess('');

        // Validation stricte côté client
        if (!form.titre.trim()) {
            setModalError('Le titre de l’annonce est obligatoire.');
            return;
        }
        if (!form.marque.trim()) {
            setModalError('La marque est obligatoire.');
            return;
        }
        if (!form.modele.trim()) {
            setModalError('Le modèle est obligatoire.');
            return;
        }
        if (!form.annee || parseInt(form.annee, 10) < 1900 || parseInt(form.annee, 10) > 2030) {
            setModalError('Veuillez renseigner une année valide (entre 1900 et 2030).');
            return;
        }
        if (form.kilometrage === '' || parseInt(form.kilometrage, 10) < 0) {
            setModalError('Le kilométrage doit être un nombre positif ou nul.');
            return;
        }
        if (!form.prix || parseFloat(form.prix) <= 0) {
            setModalError('Le prix doit être strictement supérieur à 0 €.');
            return;
        }

        if (form.statut === 'PUBLIEE' && form.photos.length === 0) {
            setModalError('Au moins une photo est obligatoire pour publier l’annonce.');
            return;
        }

        setSubmitting(true);

        const payload = {
            titre: form.titre.trim(),
            marque: form.marque.trim(),
            modele: form.modele.trim(),
            annee: parseInt(form.annee, 10),
            kilometrage: parseInt(form.kilometrage, 10),
            prix: parseFloat(form.prix),
            carburant: form.carburant || null,
            boite: form.boite || null,
            puissance: form.puissance ? parseInt(form.puissance, 10) : null,
            couleur: form.couleur?.trim() || null,
            nbPortes: form.nbPortes ? parseInt(form.nbPortes, 10) : null,
            nbPlaces: form.nbPlaces ? parseInt(form.nbPlaces, 10) : null,
            description: form.description?.trim() || null,
            photos: form.photos,
            statut: form.statut,
        };

        try {
            if (form.id) {
                await updateAnnonce(form.id, payload);
                setSuccess('Annonce mise à jour avec succès.');
            } else {
                await createAnnonce(payload);
                setSuccess(
                    form.statut === 'PUBLIEE'
                        ? 'Annonce créée et publiée avec succès !'
                        : 'Annonce enregistrée en brouillon.'
                );
            }

            setShowModal(false);
            setForm(emptyForm);
            loadData();
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur enregistrement annonce :', err);
            }

            const serverData = err.response?.data;
            let errorMessage = 'Erreur lors de l’enregistrement de l’annonce.';

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

            setModalError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    }

    function renderStatusBadge(statut) {
        const st = (statut || 'BROUILLON').toUpperCase();
        let bg = '#f0f0f0';
        let color = '#555';
        let label = 'Brouillon';

        if (st === 'PUBLIEE' || st === 'EN_VENTE') {
            bg = '#dff5e4';
            color = '#19733a';
            label = 'Publiée';
        } else if (st === 'VENDUE' || st === 'VENDU') {
            bg = '#ede7f6';
            color = '#512da8';
            label = 'Vendue';
        }

        return (
            <span
                style={{
                    display: 'inline-block',
                    background: bg,
                    color: color,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                {label}
            </span>
        );
    }

    return (
        <div className="rdv-page">

            {/* HEADER */}
            <div className="rdv-header">
                <div>
                    <BackToDashboardButton />
                    <h1>Gestion des Annonces de Véhicules</h1>
                    <p>Créez, modifiez, publiez et gérez le parc de véhicules d’occasion mis en vente.</p>
                </div>

                <button
                    className="rdv-primary-button"
                    onClick={openCreateModal}
                >
                    + Créer une annonce
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
                        placeholder="Rechercher par titre, marque, modèle ou description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="TOUS">Tous les statuts</option>
                    <option value="PUBLIEE">PUBLIÉE</option>
                    <option value="BROUILLON">BROUILLON</option>
                    <option value="VENDUE">VENDUE</option>
                </select>

                <div className="rdv-count">
                    {filteredAnnonces.length} annonce{filteredAnnonces.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* TABLEAU */}
            <div className="rdv-table-container">
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement des annonces...</p>
                    </div>
                ) : filteredAnnonces.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">🚗</div>
                        <h2>Aucune annonce trouvée</h2>
                        <p>Aucune annonce ne correspond aux critères sélectionnés.</p>
                    </div>
                ) : (
                    <div className="rdv-table-wrapper">
                        <table className="rdv-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '90px' }}>Visuel</th>
                                    <th>Titre & Véhicule</th>
                                    <th>Prix</th>
                                    <th>Statut</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAnnonces.map((a) => {
                                    const mainPhoto = a.photos?.[0] || a.imagePrincipale;
                                    const isPubliee = a.statut === 'PUBLIEE' || a.statut === 'EN_VENTE';
                                    const isVendue = a.statut === 'VENDUE' || a.statut === 'VENDU';

                                    return (
                                        <tr key={a.id}>
                                            {/* MINIATURE */}
                                            <td>
                                                {mainPhoto ? (
                                                    <img
                                                        src={getImageUrl(mainPhoto)}
                                                        alt={a.titre}
                                                        style={{
                                                            width: '80px',
                                                            height: '56px',
                                                            objectFit: 'cover',
                                                            borderRadius: '6px',
                                                            border: '1px solid #ddd',
                                                            display: 'block',
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: '80px',
                                                            height: '56px',
                                                            background: '#eee',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#999',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                        }}
                                                    >
                                                        Sans photo
                                                    </div>
                                                )}
                                            </td>

                                            {/* TITRE & INFOS */}
                                            <td>
                                                <strong style={{ fontSize: '15px', color: '#111' }}>
                                                    {a.titre}
                                                </strong>
                                                <div style={{ marginTop: '4px', fontSize: '13px', color: '#666' }}>
                                                    <span style={{ fontWeight: 600 }}>{a.marque} {a.modele}</span>
                                                    {' • '}
                                                    <span>{a.annee}</span>
                                                    {' • '}
                                                    <span>{a.kilometrage?.toLocaleString('fr-FR')} km</span>
                                                    {a.carburant && <span> • {a.carburant}</span>}
                                                    {a.boite && <span> • {a.boite}</span>}
                                                </div>
                                                {a.photos?.length > 1 && (
                                                    <span style={{ fontSize: '11px', color: '#888' }}>
                                                        📷 {a.photos.length} photos
                                                    </span>
                                                )}
                                            </td>

                                            {/* PRIX */}
                                            <td>
                                                <strong style={{ fontSize: '16px', color: '#111' }}>
                                                    {parseFloat(a.prix || 0).toLocaleString('fr-FR')} €
                                                </strong>
                                            </td>

                                            {/* STATUT */}
                                            <td>
                                                {renderStatusBadge(a.statut)}
                                            </td>

                                            {/* DATE */}
                                            <td>
                                                <span style={{ fontSize: '13px', color: '#555' }}>
                                                    {a.datePublication
                                                        ? `Publiée le ${formatDate(a.datePublication)}`
                                                        : `Créée le ${formatDate(a.dateCreation)}`}
                                                </span>
                                            </td>

                                            {/* ACTIONS */}
                                            <td>
                                                <div className="rdv-actions" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button
                                                        className="rdv-action-edit"
                                                        onClick={() => openEditModal(a)}
                                                        title="Modifier les informations"
                                                    >
                                                        Modifier
                                                    </button>

                                                    <button
                                                        style={{
                                                            border: '1px solid #ddd',
                                                            background: isPubliee ? '#fcfcfc' : '#f5c400',
                                                            color: '#111',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontWeight: 700,
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() => handleTogglePublish(a)}
                                                        title={isPubliee ? 'Repasser en brouillon' : 'Publier sur le site public'}
                                                    >
                                                        {isPubliee ? 'Dépublier' : 'Publier'}
                                                    </button>

                                                    {!isVendue && (
                                                        <button
                                                            style={{
                                                                border: '1px solid #dcd6f7',
                                                                background: '#ede7f6',
                                                                color: '#512da8',
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                fontWeight: 700,
                                                                fontSize: '12px',
                                                                cursor: 'pointer',
                                                            }}
                                                            onClick={() => handleMarkSold(a)}
                                                            title="Marquer comme vendue"
                                                        >
                                                            Vendu
                                                        </button>
                                                    )}

                                                    <button
                                                        className="rdv-action-delete"
                                                        onClick={() => handleDelete(a.id)}
                                                        title="Supprimer définitivement"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                        style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rdv-modal-header">
                            <div>
                                <span>GESTION DU STOCK</span>
                                <h2>{form.id ? 'Modifier l’annonce' : 'Créer une nouvelle annonce'}</h2>
                            </div>
                            <button
                                className="rdv-close"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        {modalError && (
                            <div className="rdv-alert rdv-alert-error" style={{ margin: '15px 20px 0' }}>
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                            <div className="rdv-form-grid">

                                {/* TITRE */}
                                <div className="rdv-field rdv-field-full">
                                    <label>Titre de l’annonce *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Peugeot 208 1.2 PureTech 100 GT Line"
                                        maxLength={255}
                                        value={form.titre}
                                        onChange={(e) => setForm({ ...form, titre: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* MARQUE & MODELE */}
                                <div className="rdv-field">
                                    <label>Marque *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Peugeot, Renault, Volkswagen..."
                                        maxLength={100}
                                        value={form.marque}
                                        onChange={(e) => setForm({ ...form, marque: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Modèle *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 208, Clio V, Golf VII..."
                                        maxLength={100}
                                        value={form.modele}
                                        onChange={(e) => setForm({ ...form, modele: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* ANNEE & KILOMETRAGE */}
                                <div className="rdv-field">
                                    <label>Année de mise en circulation *</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 2021"
                                        min={1900}
                                        max={2030}
                                        value={form.annee}
                                        onChange={(e) => setForm({ ...form, annee: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Kilométrage (km) *</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 45000"
                                        min={0}
                                        value={form.kilometrage}
                                        onChange={(e) => setForm({ ...form, kilometrage: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* PRIX & STATUT */}
                                <div className="rdv-field">
                                    <label>Prix de vente (€) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ex: 14900"
                                        min={1}
                                        value={form.prix}
                                        onChange={(e) => setForm({ ...form, prix: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Statut de publication</label>
                                    <select
                                        value={form.statut}
                                        onChange={(e) => setForm({ ...form, statut: e.target.value })}
                                    >
                                        <option value="BROUILLON">Brouillon (non visible au public)</option>
                                        <option value="PUBLIEE">Publiée (visible dans le stock en vente)</option>
                                        <option value="VENDUE">Vendue</option>
                                    </select>
                                </div>

                                {/* CARBURANT & BOITE */}
                                <div className="rdv-field">
                                    <label>Carburant</label>
                                    <select
                                        value={form.carburant}
                                        onChange={(e) => setForm({ ...form, carburant: e.target.value })}
                                    >
                                        <option value="essence">Essence</option>
                                        <option value="diesel">Diesel</option>
                                        <option value="hybride">Hybride</option>
                                        <option value="electrique">Électrique</option>
                                        <option value="gpl">GPL</option>
                                    </select>
                                </div>

                                <div className="rdv-field">
                                    <label>Boîte de vitesses</label>
                                    <select
                                        value={form.boite}
                                        onChange={(e) => setForm({ ...form, boite: e.target.value })}
                                    >
                                        <option value="manuelle">Manuelle</option>
                                        <option value="automatique">Automatique</option>
                                    </select>
                                </div>

                                {/* PUISSANCE & COULEUR */}
                                <div className="rdv-field">
                                    <label>Puissance (ch)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 110"
                                        min={1}
                                        value={form.puissance}
                                        onChange={(e) => setForm({ ...form, puissance: e.target.value })}
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Couleur</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Gris métallisé, Blanc perle..."
                                        maxLength={50}
                                        value={form.couleur}
                                        onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                                    />
                                </div>

                                {/* PORTES & PLACES */}
                                <div className="rdv-field">
                                    <label>Nombre de portes</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 5"
                                        min={2}
                                        max={7}
                                        value={form.nbPortes}
                                        onChange={(e) => setForm({ ...form, nbPortes: e.target.value })}
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Nombre de places</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 5"
                                        min={1}
                                        max={9}
                                        value={form.nbPlaces}
                                        onChange={(e) => setForm({ ...form, nbPlaces: e.target.value })}
                                    />
                                </div>

                                {/* DESCRIPTION */}
                                <div className="rdv-field rdv-field-full">
                                    <label>Description détaillée</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Historique du véhicule, équipements & options, état d'usure, garantie..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                {/* GESTION DES PHOTOS (UPLOAD MULTIPLE) */}
                                <div className="rdv-field rdv-field-full" style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <label style={{ margin: 0, fontWeight: 800 }}>
                                            Photos du véhicule ({form.photos.length} / 8 max)
                                            {form.statut === 'PUBLIEE' && <span style={{ color: '#d32f2f' }}> * (au moins 1 pour publier)</span>}
                                        </label>
                                        <span style={{ fontSize: '12px', color: '#777' }}>
                                            La première photo sera l'image principale.
                                        </span>
                                    </div>

                                    {/* LISTE DES VIGNETTES */}
                                    {form.photos.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '15px' }}>
                                            {form.photos.map((photoUrl, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: 'relative',
                                                        width: '110px',
                                                        height: '80px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: index === 0 ? '2px solid #f5c400' : '1px solid #ddd',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                                                    }}
                                                >
                                                    <img
                                                        src={getImageUrl(photoUrl)}
                                                        alt={`Photo ${index + 1}`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />

                                                    {index === 0 && (
                                                        <span
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: 0,
                                                                left: 0,
                                                                right: 0,
                                                                background: '#f5c400',
                                                                color: '#111',
                                                                fontSize: '10px',
                                                                fontWeight: 800,
                                                                textAlign: 'center',
                                                                padding: '2px 0',
                                                            }}
                                                        >
                                                            ★ PRINCIPALE
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '4px',
                                                            right: '4px',
                                                            background: 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '22px',
                                                            height: '22px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            lineHeight: '22px',
                                                            textAlign: 'center',
                                                            padding: 0,
                                                        }}
                                                        title="Supprimer cette image"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* BOUTON D'UPLOAD */}
                                    {form.photos.length < 8 && (
                                        <div>
                                            <input
                                                type="file"
                                                id="photo-upload-input"
                                                multiple
                                                accept="image/jpeg,image/png,image/webp"
                                                style={{ display: 'none' }}
                                                onChange={handlePhotoUpload}
                                                disabled={uploadingPhotos}
                                            />
                                            <label
                                                htmlFor="photo-upload-input"
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '10px 16px',
                                                    background: 'white',
                                                    border: '1px dashed #999',
                                                    borderRadius: '6px',
                                                    cursor: uploadingPhotos ? 'not-allowed' : 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    color: '#333',
                                                }}
                                            >
                                                {uploadingPhotos ? 'Téléversement en cours...' : '+ Ajouter des photos (JPG, PNG, WEBP - max 5 Mo)'}
                                            </label>
                                        </div>
                                    )}
                                </div>

                            </div>

                            <div className="rdv-modal-footer" style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="rdv-secondary-button"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting || uploadingPhotos}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rdv-primary-button"
                                    disabled={submitting || uploadingPhotos}
                                >
                                    {submitting
                                        ? 'Enregistrement en cours...'
                                        : form.id
                                            ? 'Enregistrer les modifications'
                                            : form.statut === 'PUBLIEE'
                                                ? 'Créer et publier'
                                                : 'Enregistrer le brouillon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
