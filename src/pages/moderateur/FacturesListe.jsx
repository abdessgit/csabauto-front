import { useEffect, useMemo, useState } from 'react';
import BackToDashboardButton from '../../components/BackToDashboardButton';
import { useAuth } from '../../context/AuthContext';
import {
    getFacturesFiltered,
    updateStatutFacture,
    deleteFacture,
    telechargerFacturePdf,
    envoyerFactureEmail,
} from '../../api/factures';
import '../../assets/css/RendezVousModerateur.css';

const STATUTS = ['TOUS', 'EN_ATTENTE', 'PAYEE', 'ANNULEE'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const MOIS = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
];

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

export default function FacturesListe() {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');

    const [factures, setFactures] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('TOUS');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    // États de chargement actions
    const [downloadingId, setDownloadingId] = useState(null);
    const [printingId, setPrintingId] = useState(null);
    const [sendingEmailId, setSendingEmailId] = useState(null);

    // Modal consultation détail
    const [selectedFacture, setSelectedFacture] = useState(null);

    async function loadData(month = selectedMonth, year = selectedYear) {
        setLoading(true);
        setError('');
        try {
            const data = await getFacturesFiltered(month || undefined, year || undefined);
            setFactures(normalizeCollection(data));
        } catch (err) {
            console.error('Erreur chargement factures :', err);
            setError('Impossible de charger les factures.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData(selectedMonth, selectedYear);
    }, [selectedMonth, selectedYear]);

    function handleYearChange(year) {
        setSelectedYear(year);
        if (!year) {
            setSelectedMonth('');
        }
    }

    const filteredFactures = useMemo(() => {
        const query = search.toLowerCase().trim();

        return factures.filter((f) => {
            const matchesStatus =
                statusFilter === 'TOUS' || f.statut === statusFilter;

            const num = (f.numeroFacture || '').toLowerCase();
            const client = f.intervention?.vehicule?.proprietaire
                ? `${f.intervention.vehicule.proprietaire.prenom || ''} ${f.intervention.vehicule.proprietaire.nom || ''} ${f.intervention.vehicule.proprietaire.email || ''}`.toLowerCase()
                : '';
            const vehicle = f.intervention?.vehicule
                ? `${f.intervention.vehicule.marque || ''} ${f.intervention.vehicule.modele || ''}`.toLowerCase()
                : '';

            const matchesSearch =
                !query ||
                num.includes(query) ||
                client.includes(query) ||
                vehicle.includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [factures, search, statusFilter]);

    async function handleStatusChange(factureId, newStatut) {
        setError('');
        setSuccess('');

        try {
            await updateStatutFacture(factureId, newStatut);
            setSuccess(`Statut de la facture mis à jour : ${newStatut}`);
            setFactures((prev) =>
                prev.map((f) =>
                    f.id === factureId ? { ...f, statut: newStatut } : f
                )
            );
        } catch (err) {
            console.error('Erreur mise à jour statut facture :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de modifier le statut de cette facture.'
            );
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await deleteFacture(id);
            setSuccess('Facture supprimée avec succès.');
            loadData(selectedMonth, selectedYear);
        } catch (err) {
            console.error('Erreur suppression facture :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de supprimer cette facture. Seul un administrateur peut effectuer cette action.'
            );
        }
    }

    async function handleDownload(id, numeroFacture) {
        setError('');
        setSuccess('');
        setDownloadingId(id);
        try {
            const blob = await telechargerFacturePdf(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${numeroFacture || `facture-${id}`}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            setError('Impossible de télécharger la facture.');
        } finally {
            setDownloadingId(null);
        }
    }

    async function handlePrint(id) {
        setError('');
        setSuccess('');
        setPrintingId(id);
        try {
            const blob = await telechargerFacturePdf(id);
            const url = window.URL.createObjectURL(blob);
            const printWindow = window.open(url);
            if (printWindow) {
                printWindow.onload = () => printWindow.print();
            }
        } catch (err) {
            console.error(err);
            setError("Impossible d'imprimer la facture.");
        } finally {
            setPrintingId(null);
        }
    }

    async function handleSendEmail(id) {
        setError('');
        setSuccess('');
        setSendingEmailId(id);
        try {
            await envoyerFactureEmail(id);
            setSuccess('Facture envoyée par email au client.');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Échec de l'envoi de l'email.");
        } finally {
            setSendingEmailId(null);
        }
    }

    return (
        <div className="rdv-page">

            {/* HEADER */}
            <div className="rdv-header">
                <div>
                    <BackToDashboardButton />
                    <h1>Gestion des Factures</h1>
                    <p>Suivez les factures émises, filtrez par période, téléchargez ou imprimez les PDF et transmettez-les par email aux clients.</p>
                </div>
            </div>

            {/* ALERTS */}
            {error && <div className="rdv-alert rdv-alert-error">{error}</div>}
            {success && <div className="rdv-alert rdv-alert-success">{success}</div>}

            {/* TOOLBAR */}
            <div className="rdv-toolbar">
                <div className="rdv-search">
                    <input
                        type="text"
                        placeholder="Rechercher par numéro, client ou véhicule..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                >
                    <option value="">Toutes les années</option>
                    {YEARS.map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={!selectedYear}
                >
                    <option value="">Tous les mois</option>
                    {MOIS.map((m) => (
                        <option key={m.value} value={m.value}>
                            {m.label}
                        </option>
                    ))}
                </select>

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
                    {filteredFactures.length} facture{filteredFactures.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* TABLEAU */}
            <div className="rdv-table-container">
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement des factures...</p>
                    </div>
                ) : filteredFactures.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">▤</div>
                        <h2>Aucune facture trouvée</h2>
                        <p>Aucune facture ne correspond à vos critères de recherche ou de période.</p>
                    </div>
                ) : (
                    <div className="rdv-table-wrapper">
                        <table className="rdv-table">
                            <thead>
                                <tr>
                                    <th>Numéro Facture</th>
                                    <th>Date Émission</th>
                                    <th>Client</th>
                                    <th>Véhicule</th>
                                    <th>Montant Total</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFactures.map((f) => {
                                    const client = f.intervention?.vehicule?.proprietaire;
                                    const vehicule = f.intervention?.vehicule;

                                    return (
                                        <tr key={f.id}>
                                            <td>
                                                <strong style={{ letterSpacing: '0.5px' }}>
                                                    {f.numeroFacture}
                                                </strong>
                                            </td>
                                            <td>{formatDate(f.dateEmission)}</td>
                                            <td>
                                                {client ? (
                                                    <div className="rdv-client">
                                                        <strong>{client.prenom} {client.nom}</strong>
                                                        <span>{client.email}</span>
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                {vehicule
                                                    ? `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation || '-'})`
                                                    : '-'}
                                            </td>
                                            <td>
                                                <strong style={{ fontSize: '15px' }}>
                                                    {parseFloat(f.montantTotal || 0).toFixed(2)} €
                                                </strong>
                                            </td>
                                            <td>
                                                <select
                                                    className={`rdv-status-select status-${(
                                                        f.statut || 'en_attente'
                                                    ).toLowerCase()}`}
                                                    value={f.statut || 'EN_ATTENTE'}
                                                    onChange={(e) =>
                                                        handleStatusChange(f.id, e.target.value)
                                                    }
                                                >
                                                    <option value="EN_ATTENTE">EN_ATTENTE</option>
                                                    <option value="PAYEE">PAYÉE</option>
                                                    <option value="ANNULEE">ANNULÉE</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className="rdv-actions" style={{ flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="rdv-action-edit"
                                                        onClick={() => setSelectedFacture(f)}
                                                    >
                                                        Détail
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rdv-action-edit"
                                                        onClick={() => handleDownload(f.id, f.numeroFacture)}
                                                        disabled={downloadingId === f.id}
                                                        title="Télécharger le fichier PDF"
                                                    >
                                                        {downloadingId === f.id ? 'Téléchargement...' : 'PDF'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rdv-action-edit"
                                                        onClick={() => handlePrint(f.id)}
                                                        disabled={printingId === f.id}
                                                        title="Imprimer la facture"
                                                    >
                                                        {printingId === f.id ? 'Impression...' : 'Imprimer'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rdv-action-edit"
                                                        onClick={() => handleSendEmail(f.id)}
                                                        disabled={sendingEmailId === f.id}
                                                        title="Envoyer la facture par email au client"
                                                        style={{ background: '#f8f9fa' }}
                                                    >
                                                        {sendingEmailId === f.id ? 'Envoi...' : 'Email'}
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            className="rdv-action-delete"
                                                            onClick={() => handleDelete(f.id)}
                                                        >
                                                            Supprimer
                                                        </button>
                                                    )}
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

            {/* MODAL CONSULTATION DÉTAIL FACTURE */}
            {selectedFacture && (
                <div
                    className="rdv-modal-overlay"
                    onClick={() => setSelectedFacture(null)}
                >
                    <div
                        className="rdv-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rdv-modal-header">
                            <div>
                                <span>FACTURE CLIENT</span>
                                <h2>{selectedFacture.numeroFacture}</h2>
                            </div>
                            <button
                                className="rdv-close"
                                onClick={() => setSelectedFacture(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ padding: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px' }}>Date d'émission :</h4>
                                    <p style={{ margin: 0, color: '#666' }}>
                                        {formatDate(selectedFacture.dateEmission)}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h4 style={{ margin: '0 0 5px' }}>Statut actuel :</h4>
                                    <span className={`rdv-status-select status-${(selectedFacture.statut || 'en_attente').toLowerCase()}`}>
                                        {selectedFacture.statut}
                                    </span>
                                </div>
                            </div>

                            {/* LIGNES DE FACTURATION */}
                            <h4 style={{ margin: '20px 0 10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                Lignes de facturation :
                            </h4>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left', fontSize: '13px' }}>
                                        <th style={{ padding: '8px' }}>Description</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Quantité</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Prix Unitaire</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Sous-total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedFacture.lignesFacture && selectedFacture.lignesFacture.length > 0 ? (
                                        selectedFacture.lignesFacture.map((line) => (
                                            <tr key={line.id} style={{ borderBottom: '1px solid #eee', fontSize: '13px' }}>
                                                <td style={{ padding: '10px 8px' }}>{line.description}</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{line.quantite}</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                                    {parseFloat(line.prixUnitaire || 0).toFixed(2)} €
                                                </td>
                                                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>
                                                    {parseFloat(line.sousTotal || 0).toFixed(2)} €
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '12px 8px', color: '#888', textAlign: 'center' }}>
                                                {selectedFacture.intervention?.description || 'Prestation mécanique générale'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #111', paddingTop: '12px' }}>
                                <div style={{ fontSize: '18px', fontWeight: 900 }}>
                                    Total TTC : {parseFloat(selectedFacture.montantTotal || 0).toFixed(2)} €
                                </div>
                            </div>

                            <div className="rdv-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className="rdv-action-edit"
                                        onClick={() => handleDownload(selectedFacture.id, selectedFacture.numeroFacture)}
                                        disabled={downloadingId === selectedFacture.id}
                                    >
                                        {downloadingId === selectedFacture.id ? 'Téléchargement...' : 'Télécharger PDF'}
                                    </button>
                                    <button
                                        type="button"
                                        className="rdv-action-edit"
                                        onClick={() => handlePrint(selectedFacture.id)}
                                        disabled={printingId === selectedFacture.id}
                                    >
                                        {printingId === selectedFacture.id ? 'Ouverture...' : 'Imprimer'}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="rdv-secondary-button"
                                    onClick={() => setSelectedFacture(null)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
