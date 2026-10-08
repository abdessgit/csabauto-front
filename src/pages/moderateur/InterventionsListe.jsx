import { useEffect, useMemo, useState } from 'react';
import BackToDashboardButton from '../../components/BackToDashboardButton';
import {
    getInterventions,
    createIntervention,
    updateStatutIntervention,
    deleteIntervention,
    genererFacture,
} from '../../api/interventions';
import { getVehicules } from '../../api/vehicules';
import { getServices } from '../../api/services';
import { telechargerFacturePdf } from '../../api/factures';
import '../../assets/css/RendezVousModerateur.css';

function normalizeCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
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

function formatMontant(montant) {
    const num = parseFloat(montant || 0);
    return num.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    });
}

function getClientLabel(it) {
    if (!it) return 'Client inconnu';
    if (it.vehicule?.proprietaire) {
        const p = it.vehicule.proprietaire;
        const name = `${p.prenom || ''} ${p.nom || ''}`.trim();
        return name || p.email || `Client #${p.id || ''}`;
    }
    if (it.rendezVous?.client) {
        const c = it.rendezVous.client;
        const name = `${c.prenom || ''} ${c.nom || ''}`.trim();
        return name || c.email || `Client #${c.id || ''}`;
    }
    return 'Client inconnu';
}

function getVehicleLabel(vehicule) {
    if (!vehicule) return 'Véhicule inconnu';
    const marque = vehicule.marque || '';
    const modele = vehicule.modele || '';
    const immat = vehicule.immatriculation ? `(${vehicule.immatriculation})` : '';
    const owner = vehicule.proprietaire ? ` - ${vehicule.proprietaire.prenom || ''} ${vehicule.proprietaire.nom || ''}` : '';
    return `${marque} ${modele} ${immat}${owner}`.trim();
}

export default function InterventionsListe() {
    const [interventions, setInterventions] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [catalogueServices, setCatalogueServices] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('TOUS');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        dateIntervention: new Date().toISOString().slice(0, 16),
        description: '',
        kilometrageReleve: '',
        vehiculeId: '',
        selectedServices: [], // [{ serviceId, quantite }]
    });

    // Modal de validation / prestations et lignes de l'intervention
    const [validerModalOpen, setValiderModalOpen] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState(null);
    const [validerLignes, setValiderLignes] = useState([
        { designation: '', montant: '' }
    ]);
    const [validerSubmitting, setValiderSubmitting] = useState(false);
    const [validerError, setValiderError] = useState('');
    const [justFactured, setJustFactured] = useState(null);
    const [downloadingPdfId, setDownloadingPdfId] = useState(null);

    const { totalHT, totalTVA, totalTTC } = useMemo(() => {
        let ht = 0;
        validerLignes.forEach((l) => {
            const val = parseFloat(l.montant);
            if (!isNaN(val) && val > 0) {
                ht += val;
            }
        });
        const htRounded = Math.round(ht * 100) / 100;
        const tva = Math.round(htRounded * 0.20 * 100) / 100;
        const ttc = Math.round((htRounded + tva) * 100) / 100;
        return {
            totalHT: htRounded,
            totalTVA: tva,
            totalTTC: ttc,
        };
    }, [validerLignes]);

    function handleAddLigne() {
        setValiderLignes((prev) => [...prev, { designation: '', montant: '' }]);
        setValiderError('');
    }

    function handleRemoveLigne(index) {
        if (validerLignes.length <= 1) return;
        setValiderLignes((prev) => prev.filter((_, i) => i !== index));
        setValiderError('');
    }

    function handleUpdateLigne(index, field, value) {
        setValiderLignes((prev) =>
            prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
        );
        setValiderError('');
    }

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const [interventionsData, vehiculesData, servicesData] =
                await Promise.all([
                    getInterventions(),
                    getVehicules().catch(() => []),
                    getServices().catch(() => []),
                ]);

            setInterventions(normalizeCollection(interventionsData));
            setVehicules(normalizeCollection(vehiculesData));
            setCatalogueServices(normalizeCollection(servicesData));
        } catch (err) {
            console.error('Erreur chargement interventions :', err);
            setError('Impossible de charger les interventions.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredInterventions = useMemo(() => {
        const query = search.toLowerCase().trim();

        return interventions.filter((item) => {
            const matchesStatus =
                statusFilter === 'TOUS' || item.statut === statusFilter;

            const vehicle = getVehicleLabel(item.vehicule).toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const dateStr = formatDate(item.dateIntervention).toLowerCase();
            const clientOwner = item.vehicule?.proprietaire
                ? `${item.vehicule.proprietaire.prenom || ''} ${item.vehicule.proprietaire.nom || ''} ${item.vehicule.proprietaire.email || ''}`.toLowerCase()
                : '';
            const rdvClient = item.rendezVous?.client
                ? `${item.rendezVous.client.prenom || ''} ${item.rendezVous.client.nom || ''} ${item.rendezVous.client.email || ''}`.toLowerCase()
                : '';

            const matchesSearch =
                !query ||
                vehicle.includes(query) ||
                desc.includes(query) ||
                dateStr.includes(query) ||
                clientOwner.includes(query) ||
                rdvClient.includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [interventions, search, statusFilter]);

    async function handleDownloadPdf(factureId, numeroFacture) {
        if (!factureId) return;
        setError('');
        setDownloadingPdfId(factureId);
        try {
            const blob = await telechargerFacturePdf(factureId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${numeroFacture || `facture-${factureId}`}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur téléchargement facture PDF :', err);
            setError('Impossible de télécharger la facture PDF.');
        } finally {
            setDownloadingPdfId(null);
        }
    }

    function openValiderModal(it) {
        if (it.facture) {
            alert(
                `L'intervention #${it.id} a déjà été facturée (Facture ${it.facture.numeroFacture || it.facture.numero || ''}). Conformément à la réglementation fiscale, une facture émise est définitive et ne peut plus être modifiée.`
            );
            return;
        }

        setError('');
        setSuccess('');
        setSelectedIntervention(it);
        setValiderError('');

        // Pré-remplir les lignes avec les prestations si existantes
        if (it.interventionServices && it.interventionServices.length > 0) {
            setValiderLignes(
                it.interventionServices.map((is) => ({
                    designation: is.service?.nom
                        ? `${is.service.nom}${is.quantite > 1 ? ` (x${is.quantite})` : ''}`
                        : 'Prestation atelier',
                    montant: is.service?.prix
                        ? String(parseFloat(is.service.prix) * (is.quantite || 1))
                        : '',
                }))
            );
        } else {
            // Sinon, première ligne pré-remplie avec le motif du rendez-vous ou description
            let defaultDesignation = '';
            if (it.rendezVous?.motif) {
                defaultDesignation = it.rendezVous.motif;
            } else if (it.description) {
                defaultDesignation = it.description.replace(/^Rendez-vous\s*:\s*/i, '');
            } else {
                defaultDesignation = 'Prestation atelier';
            }

            const curr = parseFloat(it.montant || it.coutTotal || 0);
            setValiderLignes([
                {
                    designation: defaultDesignation,
                    montant: curr > 0 ? String(curr) : '',
                }
            ]);
        }

        setValiderModalOpen(true);
    }

    async function handleConfirmValider(e) {
        e.preventDefault();
        if (validerSubmitting) return;
        setValiderError('');

        if (validerLignes.length === 0) {
            setValiderError("Au moins une ligne d'intervention est obligatoire.");
            return;
        }

        for (let i = 0; i < validerLignes.length; i++) {
            const l = validerLignes[i];
            if (!l.designation.trim()) {
                setValiderError(`La désignation de la ligne ${i + 1} est obligatoire.`);
                return;
            }
            const montantNum = parseFloat(l.montant);
            if (!l.montant || isNaN(montantNum) || montantNum <= 0) {
                setValiderError(`Le montant HT de la ligne ${i + 1} doit être un nombre supérieur à 0.`);
                return;
            }
        }

        setValiderSubmitting(true);
        try {
            const payload = {
                statut: 'TERMINEE',
                lignes: validerLignes.map((l) => ({
                    designation: l.designation.trim(),
                    montant: parseFloat(l.montant),
                })),
            };

            const updated = await updateStatutIntervention(selectedIntervention.id, payload);

            const facture = updated.facture;
            const finalTTC = updated.montantTTC ?? updated.coutTotal ?? totalTTC;
            const numFac = facture?.numeroFacture || facture?.numero;

            setInterventions((prev) =>
                prev.map((item) =>
                    item.id === selectedIntervention.id
                        ? {
                            ...item,
                            ...updated,
                            statut: 'TERMINEE',
                            coutTotal: updated.coutTotal || String(finalTTC),
                            montant: updated.coutTotal || String(finalTTC),
                            facture: facture || item.facture,
                        }
                        : item
                )
            );

            if (facture) {
                setJustFactured({
                    id: facture.id,
                    numero: numFac,
                    montantHT: facture.montantHT ?? totalHT,
                    montantTVA: facture.montantTVA ?? totalTVA,
                    montantTTC: facture.montantTTC ?? finalTTC,
                });
            }

            setSuccess(
                numFac
                    ? `Intervention #${selectedIntervention.id} validée et facturée avec succès ! Facture n° ${numFac} émise (Total TTC : ${formatMontant(finalTTC)}).`
                    : `Intervention #${selectedIntervention.id} validée avec succès (${formatMontant(finalTTC)} TTC).`
            );
            setValiderModalOpen(false);
            setSelectedIntervention(null);
            setValiderLignes([{ designation: '', montant: '' }]);
        } catch (err) {
            console.error('Erreur validation intervention :', err);
            setValiderError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Erreur lors de la validation de l'intervention."
            );
        } finally {
            setValiderSubmitting(false);
        }
    }

    async function handleStatutChange(id, newStatut) {
        const item = interventions.find((i) => i.id === id);
        if (newStatut === 'TERMINEE') {
            if (item) openValiderModal(item);
            return;
        }

        try {
            setError('');
            setSuccess('');
            const updated = await updateStatutIntervention(id, { statut: newStatut });
            setInterventions((prev) =>
                prev.map((it) => (it.id === id ? { ...it, ...updated, statut: newStatut } : it))
            );
            setSuccess('Statut de l’intervention mis à jour.');
        } catch (err) {
            console.error('Erreur modification statut intervention :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de mettre à jour le statut de l’intervention.'
            );
        }
    }

    function openCreateModal() {
        setError('');
        setSuccess('');
        setForm({
            dateIntervention: new Date().toISOString().slice(0, 16),
            description: '',
            kilometrageReleve: '',
            vehiculeId: vehicules[0]?.id ? String(vehicules[0].id) : '',
            selectedServices: [],
        });
        setShowModal(true);
    }

    function toggleService(serviceId) {
        setForm((prev) => {
            const exists = prev.selectedServices.find(
                (s) => s.serviceId === serviceId
            );
            if (exists) {
                return {
                    ...prev,
                    selectedServices: prev.selectedServices.filter(
                        (s) => s.serviceId !== serviceId
                    ),
                };
            } else {
                return {
                    ...prev,
                    selectedServices: [
                        ...prev.selectedServices,
                        { serviceId, quantite: 1 },
                    ],
                };
            }
        });
    }

    function updateServiceQuantity(serviceId, quantite) {
        const q = Math.max(1, parseInt(quantite, 10) || 1);
        setForm((prev) => ({
            ...prev,
            selectedServices: prev.selectedServices.map((s) =>
                s.serviceId === serviceId ? { ...s, quantite: q } : s
            ),
        }));
    }

    async function handleGenererFacture(interventionId) {
        if (!window.confirm('Générer la facture pour cette intervention ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await genererFacture(interventionId);
            setSuccess('Facture générée avec succès.');
            loadData();
        } catch (err) {
            console.error('Erreur génération facture :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de générer la facture pour cette intervention.'
            );
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Supprimer cette intervention ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await deleteIntervention(id);
            setSuccess('Intervention supprimée avec succès.');
            loadData();
        } catch (err) {
            console.error('Erreur suppression intervention :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de supprimer cette intervention.'
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

        setSubmitting(true);

        const payload = {
            dateIntervention: form.dateIntervention,
            description: form.description.trim(),
            kilometrageReleve: parseInt(form.kilometrageReleve, 10) || 0,
            vehiculeId: parseInt(form.vehiculeId, 10),
            services: form.selectedServices.map((s) => ({
                serviceId: s.serviceId,
                quantite: s.quantite,
            })),
        };

        try {
            await createIntervention(payload);
            setSuccess('Intervention enregistrée avec succès.');
            setShowModal(false);
            loadData();
        } catch (err) {
            console.error('Erreur création intervention :', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Erreur lors de l’enregistrement de l’intervention.'
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
                    <h1>Gestion des Interventions</h1>
                    <p>Suivez les travaux réalisés en atelier, ajoutez les prestations et générez les factures clients.</p>
                </div>

                <button
                    className="rdv-primary-button"
                    onClick={openCreateModal}
                >
                    + Nouvelle intervention
                </button>
            </div>

            {/* ALERTS */}
            {error && <div className="rdv-alert rdv-alert-error">{error}</div>}
            {justFactured && (
                <div className="valider-success-banner">
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#1b5e20', marginBottom: '4px' }}>
                            ✓ Facture n° {justFactured.numero} émise avec succès !
                        </div>
                        <div style={{ fontSize: '13px', color: '#2e7d32' }}>
                            Total HT : <strong>{formatMontant(justFactured.montantHT)}</strong> &nbsp;|&nbsp;
                            TVA (20%) : <strong>{formatMontant(justFactured.montantTVA)}</strong> &nbsp;|&nbsp;
                            Total TTC : <strong style={{ fontSize: '15px', color: '#1b5e20' }}>{formatMontant(justFactured.montantTTC)}</strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            type="button"
                            className="rdv-primary-button"
                            style={{ background: '#2e7d32', color: '#fff', border: 'none' }}
                            disabled={downloadingPdfId === justFactured.id}
                            onClick={() => handleDownloadPdf(justFactured.id, justFactured.numero)}
                        >
                            {downloadingPdfId === justFactured.id ? 'Téléchargement...' : '📄 Télécharger le PDF'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setJustFactured(null)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#1b5e20',
                                fontSize: '16px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                            }}
                            title="Fermer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            {success && !justFactured && <div className="rdv-alert rdv-alert-success">{success}</div>}

            {/* TOOLBAR */}
            <div className="rdv-toolbar">
                <div className="rdv-search">
                    <input
                        type="text"
                        placeholder="Rechercher par véhicule, description ou date..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="TOUS">Tous les statuts</option>
                    <option value="EN_COURS">EN COURS</option>
                    <option value="TERMINEE">TERMINÉE</option>
                </select>

                <div className="rdv-count">
                    {filteredInterventions.length} intervention{filteredInterventions.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* TABLEAU */}
            <div className="rdv-table-container">
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement des interventions...</p>
                    </div>
                ) : filteredInterventions.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">🔧</div>
                        <h2>Aucune intervention trouvée</h2>
                        <p>Aucune intervention ne correspond à vos filtres.</p>
                    </div>
                ) : (
                    <div className="rdv-table-wrapper">
                        <table className="rdv-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Véhicule</th>
                                    <th>Description & Prestations</th>
                                    <th>Kilométrage</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th>Facture</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInterventions.map((it) => {
                                    const hasFacture = Boolean(it.facture);

                                    return (
                                        <tr key={it.id}>
                                            <td>
                                                <strong>{formatDate(it.dateIntervention)}</strong>
                                            </td>
                                            <td>{getVehicleLabel(it.vehicule)}</td>
                                            <td>
                                                {it.rendezVous && (
                                                    <div style={{ fontSize: '11px', color: '#1565c0', fontWeight: 600, marginBottom: '4px' }}>
                                                        📅 Issu du RDV du {formatDate(it.rendezVous.dateHeure)}
                                                    </div>
                                                )}
                                                <strong>{it.description}</strong>
                                                {it.interventionServices && it.interventionServices.length > 0 && (
                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                        {it.interventionServices.map((is) => (
                                                            <span key={is.id} style={{ display: 'inline-block', marginRight: '8px' }}>
                                                                • {is.service?.nom} (x{is.quantite})
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {it.kilometrageReleve
                                                    ? `${Number(it.kilometrageReleve).toLocaleString('fr-FR')} km`
                                                    : '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <strong style={{ fontSize: '14px', color: '#111' }}>
                                                        {formatMontant(it.montant || it.coutTotal)} TTC
                                                    </strong>
                                                    {it.facture?.montantHT && (
                                                        <span style={{ fontSize: '11px', color: '#666' }}>
                                                            {formatMontant(it.facture.montantHT)} HT
                                                        </span>
                                                    )}
                                                    {it.statut === 'TERMINEE' && !hasFacture && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openValiderModal(it)}
                                                            title="Modifier le montant de l'intervention"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#1565c0',
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                textDecoration: 'underline',
                                                                padding: 0,
                                                                marginTop: '3px',
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            Modifier
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <select
                                                        className={`rdv-status-select status-${(it.statut || 'en_cours').toLowerCase()}`}
                                                        value={it.statut || 'EN_COURS'}
                                                        onChange={(e) => handleStatutChange(it.id, e.target.value)}
                                                    >
                                                        <option value="EN_COURS">En cours</option>
                                                        <option value="TERMINEE">Terminée</option>
                                                    </select>

                                                    {it.statut !== 'TERMINEE' && (
                                                        <button
                                                            type="button"
                                                            className="rdv-primary-button"
                                                            style={{
                                                                padding: '5px 8px',
                                                                fontSize: '11px',
                                                                background: '#2e7d32',
                                                                color: '#fff',
                                                                border: 'none',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px',
                                                            }}
                                                            onClick={() => openValiderModal(it)}
                                                        >
                                                            ✓ Valider l'intervention
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {hasFacture ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span style={{ color: '#1b5e20', fontWeight: 700, fontSize: '12px' }}>
                                                            ✓ {it.facture.numeroFacture || it.facture.numero || 'Facturée'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            style={{
                                                                padding: '3px 8px',
                                                                fontSize: '11px',
                                                                background: '#e8f5e9',
                                                                color: '#1b5e20',
                                                                border: '1px solid #c8e6c9',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                            }}
                                                            disabled={downloadingPdfId === it.facture.id}
                                                            onClick={() => handleDownloadPdf(it.facture.id, it.facture.numeroFacture || it.facture.numero)}
                                                            title="Télécharger la facture PDF"
                                                        >
                                                            {downloadingPdfId === it.facture.id ? '...' : '📄 PDF'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="rdv-primary-button"
                                                        style={{ padding: '6px 10px', fontSize: '11px', background: '#f5c400' }}
                                                        onClick={() => handleGenererFacture(it.id)}
                                                    >
                                                        Générer facture
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <div className="rdv-actions">
                                                    <button
                                                        className="rdv-action-delete"
                                                        onClick={() => handleDelete(it.id)}
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

            {/* MODAL CRÉATION */}
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
                                <span>ATELIER MÉCANIQUE</span>
                                <h2>Créer une nouvelle intervention</h2>
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
                                    <label>Véhicule concerné *</label>
                                    <select
                                        value={form.vehiculeId}
                                        onChange={(e) =>
                                            setForm({ ...form, vehiculeId: e.target.value })
                                        }
                                        required
                                    >
                                        <option value="">-- Choisir un véhicule --</option>
                                        {vehicules.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {getVehicleLabel(v)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="rdv-field">
                                    <label>Date de l'intervention *</label>
                                    <input
                                        type="datetime-local"
                                        value={form.dateIntervention}
                                        onChange={(e) =>
                                            setForm({ ...form, dateIntervention: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="rdv-field">
                                    <label>Kilométrage relevé *</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 85200"
                                        value={form.kilometrageReleve}
                                        onChange={(e) =>
                                            setForm({ ...form, kilometrageReleve: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="rdv-field rdv-field-full">
                                    <label>Description des travaux à réaliser *</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Détaillez les réparations et constats de l'atelier..."
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({ ...form, description: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* SERVICES MULTIPLES DU CATALOGUE */}
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                                    Catalogue de prestations & pièces :
                                </label>
                                <p style={{ fontSize: '12px', color: '#777', margin: '0 0 12px' }}>
                                    Cochez les services à inclure dans l'intervention et ajustez la quantité si nécessaire.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                                    {catalogueServices.map((srv) => {
                                        const selected = form.selectedServices.find(
                                            (s) => s.serviceId === srv.id
                                        );

                                        return (
                                            <div
                                                key={srv.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    border: selected ? '1px solid #f5c400' : '1px solid #eee',
                                                    background: selected ? '#fffdf2' : '#fafafa',
                                                }}
                                            >
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, fontSize: '13px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(selected)}
                                                        onChange={() => toggleService(srv.id)}
                                                    />
                                                    <span>
                                                        <strong>{srv.nom}</strong> ({parseFloat(srv.prixStandard || 0).toFixed(2)} €)
                                                    </span>
                                                </label>

                                                {selected && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '12px', color: '#666' }}>Qté:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={selected.quantite}
                                                            onChange={(e) =>
                                                                updateServiceQuantity(srv.id, e.target.value)
                                                            }
                                                            style={{ width: '60px', height: '32px', textAlign: 'center' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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
                                    {submitting ? 'Enregistrement...' : 'Créer l’intervention'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL VALIDER L'INTERVENTION */}
            {validerModalOpen && selectedIntervention && (
                <div
                    className="rdv-modal-overlay"
                    onClick={() => !validerSubmitting && setValiderModalOpen(false)}
                >
                    <div
                        className="rdv-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rdv-modal-header">
                            <div>
                                <span>ATELIER CS AB AUTO</span>
                                <h2>Valider l'intervention #{selectedIntervention.id}</h2>
                            </div>
                            <button
                                type="button"
                                className="rdv-close"
                                onClick={() => !validerSubmitting && setValiderModalOpen(false)}
                                aria-label="Fermer"
                            >
                                ×
                            </button>
                        </div>

                        {validerError && (
                            <div className="rdv-alert rdv-alert-error" role="alert">
                                {validerError}
                            </div>
                        )}

                        <form onSubmit={handleConfirmValider}>
                            <div className="valider-summary-box">
                                <div className="valider-summary-item">
                                    <span className="valider-summary-label">Client : </span>
                                    <span className="valider-summary-val">{getClientLabel(selectedIntervention)}</span>
                                </div>
                                <div className="valider-summary-item">
                                    <span className="valider-summary-label">Véhicule : </span>
                                    <span className="valider-summary-val">{getVehicleLabel(selectedIntervention.vehicule)}</span>
                                </div>
                                <div className="valider-summary-item">
                                    <span className="valider-summary-label">Intervention : </span>
                                    <span>{selectedIntervention.description || 'Prestation mécanique générale'}</span>
                                </div>
                            </div>

                            <div className="valider-lignes-header">
                                <div>
                                    <h3 className="valider-lignes-title">Prestations et pièces facturables *</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                                        Saisissez les montants <strong>Hors Taxe (HT)</strong>. La TVA (20%) et le Total TTC sont calculés automatiquement.
                                    </p>
                                </div>
                            </div>

                            <div className="valider-lignes-list">
                                {validerLignes.map((ligne, idx) => (
                                    <div key={idx} className="valider-ligne-row">
                                        <div className="rdv-field valider-ligne-input-desc">
                                            <label htmlFor={`ligne-desc-${idx}`}>
                                                Désignation #{idx + 1}
                                            </label>
                                            <input
                                                id={`ligne-desc-${idx}`}
                                                type="text"
                                                placeholder="Ex : Plaquettes de frein avant"
                                                value={ligne.designation}
                                                onChange={(e) => handleUpdateLigne(idx, 'designation', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="rdv-field valider-ligne-input-montant">
                                            <label htmlFor={`ligne-montant-${idx}`}>
                                                Montant HT (€)
                                            </label>
                                            <input
                                                id={`ligne-montant-${idx}`}
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder="Ex : 85.00"
                                                value={ligne.montant}
                                                onChange={(e) => handleUpdateLigne(idx, 'montant', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="valider-ligne-delete-btn"
                                            onClick={() => handleRemoveLigne(idx)}
                                            disabled={validerLignes.length <= 1}
                                            title="Retirer cette ligne"
                                            aria-label={`Supprimer la ligne ${idx + 1}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="valider-add-btn"
                                onClick={handleAddLigne}
                            >
                                + Ajouter une ligne
                            </button>

                            <div className="valider-totals-card">
                                <div className="valider-total-row">
                                    <span>Total HT :</span>
                                    <strong>{formatMontant(totalHT)}</strong>
                                </div>
                                <div className="valider-total-row">
                                    <span>TVA (20 %) :</span>
                                    <strong>{formatMontant(totalTVA)}</strong>
                                </div>
                                <div className="valider-total-row valider-total-row-ttc">
                                    <span className="valider-total-title-ttc">TOTAL TTC :</span>
                                    <strong className="valider-total-price-ttc">{formatMontant(totalTTC)}</strong>
                                </div>
                            </div>

                            <div className="rdv-modal-footer">
                                <button
                                    type="button"
                                    className="rdv-secondary-button"
                                    onClick={() => setValiderModalOpen(false)}
                                    disabled={validerSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rdv-primary-button valider-submit-button"
                                    disabled={
                                        validerSubmitting ||
                                        totalHT <= 0 ||
                                        validerLignes.some((l) => !l.designation.trim() || !l.montant || parseFloat(l.montant) <= 0)
                                    }
                                >
                                    {validerSubmitting
                                        ? 'Émission de la facture...'
                                        : `Valider et générer la facture (${formatMontant(totalTTC)} TTC)`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
