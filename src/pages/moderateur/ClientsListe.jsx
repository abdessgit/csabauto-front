import { useEffect, useMemo, useState } from 'react';
import BackToDashboardButton from '../../components/BackToDashboardButton';
import { useAuth } from '../../context/AuthContext';
import { getUtilisateurs, updateUtilisateur } from '../../api/utilisateurs';
import '../../assets/css/RendezVousModerateur.css';

function normalizeCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

function getRoleLabel(roles) {
    if (!roles || !roles.length) return 'CLIENT';
    if (roles.includes('ROLE_ADMIN')) return 'ADMINISTRATEUR';
    if (roles.includes('ROLE_MODERATEUR')) return 'MODÉRATEUR';
    return 'CLIENT';
}

function getRoleBadgeClass(roles) {
    if (!roles || !roles.length) return 'status-confirme';
    if (roles.includes('ROLE_ADMIN')) return 'status-annule';
    if (roles.includes('ROLE_MODERATEUR')) return 'status-en_attente';
    return 'status-confirme';
}

export default function ClientsListe() {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');

    const [utilisateurs, setUtilisateurs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('TOUS');

    // Modal Détail
    const [selectedClient, setSelectedClient] = useState(null);

    // Modal Édition Rôle (Admin only)
    const [editingClient, setEditingClient] = useState(null);
    const [selectedRole, setSelectedRole] = useState('CLIENT');
    const [adminPassword, setAdminPassword] = useState('');
    const [submittingRole, setSubmittingRole] = useState(false);

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const data = await getUtilisateurs();
            setUtilisateurs(normalizeCollection(data));
        } catch (err) {
            console.error('Erreur chargement utilisateurs :', err);
            setError('Impossible de charger la liste des utilisateurs.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredClients = useMemo(() => {
        const query = search.toLowerCase().trim();

        return utilisateurs.filter((u) => {
            const roles = u.roles || [];
            const matchesRole =
                roleFilter === 'TOUS' || roles.includes(roleFilter);

            const fullName = `${u.prenom || ''} ${u.nom || ''}`.toLowerCase();
            const email = (u.email || '').toLowerCase();
            const phone = (u.telephone || '').toLowerCase();

            const matchesSearch =
                !query ||
                fullName.includes(query) ||
                email.includes(query) ||
                phone.includes(query);

            return matchesRole && matchesSearch;
        });
    }, [utilisateurs, search, roleFilter]);

    async function handleUpdateRole(e) {
        e.preventDefault();
        if (!editingClient) return;

        setError('');
        setSuccess('');
        setSubmittingRole(true);

        try {
            await updateUtilisateur(editingClient.id, {
                prenom: editingClient.prenom,
                nom: editingClient.nom,
                email: editingClient.email,
                telephone: editingClient.telephone || '',
                adresse: editingClient.adresse || '',
                role: selectedRole,
                password: adminPassword,
            });

            setSuccess(`Le rôle de ${editingClient.prenom} ${editingClient.nom} a été mis à jour.`);
            setEditingClient(null);
            setAdminPassword('');
            loadData();
        } catch (err) {
            console.error('Erreur modification rôle :', err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Erreur lors du changement de rôle. Vérifiez le mot de passe.'
            );
        } finally {
            setSubmittingRole(false);
        }
    }

    return (
        <div className="rdv-page">

            {/* HEADER */}
            <div className="rdv-header">
                <div>
                    <BackToDashboardButton />
                    <h1>Gestion des Clients & Utilisateurs</h1>
                    <p>Consultez la liste des utilisateurs inscrits, leurs rôles et l'accès à leurs informations.</p>
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
                        placeholder="Rechercher par nom, prénom, email ou téléphone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="TOUS">Tous les rôles</option>
                    <option value="ROLE_CLIENT">Clients</option>
                    <option value="ROLE_MODERATEUR">Modérateurs</option>
                    <option value="ROLE_ADMIN">Administrateurs</option>
                </select>

                <div className="rdv-count">
                    {filteredClients.length} utilisateur{filteredClients.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* TABLEAU */}
            <div className="rdv-table-container">
                {loading ? (
                    <div className="rdv-loading">
                        <p>Chargement des utilisateurs...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="rdv-empty">
                        <div className="rdv-empty-icon">👥</div>
                        <h2>Aucun utilisateur trouvé</h2>
                        <p>Aucun profil ne correspond aux critères sélectionnés.</p>
                    </div>
                ) : (
                    <div className="rdv-table-wrapper">
                        <table className="rdv-table">
                            <thead>
                                <tr>
                                    <th>Nom & Prénom</th>
                                    <th>Email</th>
                                    <th>Téléphone</th>
                                    <th>Rôle</th>
                                    <th>Inscrit le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr key={client.id}>
                                        <td>
                                            <strong>{client.prenom} {client.nom}</strong>
                                        </td>
                                        <td>{client.email}</td>
                                        <td>{client.telephone || '-'}</td>
                                        <td>
                                            <span
                                                className={`rdv-status-select ${getRoleBadgeClass(client.roles)}`}
                                                style={{ display: 'inline-block' }}
                                            >
                                                {getRoleLabel(client.roles)}
                                            </span>
                                        </td>
                                        <td>{formatDate(client.dateCreation)}</td>
                                        <td>
                                            <div className="rdv-actions">
                                                <button
                                                    className="rdv-action-edit"
                                                    onClick={() => setSelectedClient(client)}
                                                >
                                                    Voir détail
                                                </button>

                                                {isAdmin && (
                                                    <button
                                                        className="rdv-primary-button"
                                                        style={{ padding: '6px 10px', fontSize: '11px' }}
                                                        onClick={() => {
                                                            setEditingClient(client);
                                                            const currentRole = client.roles?.includes('ROLE_ADMIN')
                                                                ? 'ADMIN'
                                                                : client.roles?.includes('ROLE_MODERATEUR')
                                                                    ? 'MODERATEUR'
                                                                    : 'CLIENT';
                                                            setSelectedRole(currentRole);
                                                            setAdminPassword('');
                                                        }}
                                                    >
                                                        Modifier rôle
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL DÉTAIL CLIENT */}
            {selectedClient && (
                <div
                    className="rdv-modal-overlay"
                    onClick={() => setSelectedClient(null)}
                >
                    <div
                        className="rdv-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rdv-modal-header">
                            <div>
                                <span>FICHE UTILISATEUR</span>
                                <h2>{selectedClient.prenom} {selectedClient.nom}</h2>
                            </div>
                            <button
                                className="rdv-close"
                                onClick={() => setSelectedClient(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ padding: '25px' }}>
                            <div className="rdv-form-grid" style={{ marginBottom: '25px' }}>
                                <div className="rdv-field">
                                    <label>Email</label>
                                    <div style={{ padding: '10px 12px', background: '#f9f9f9', borderRadius: '6px' }}>
                                        {selectedClient.email}
                                    </div>
                                </div>

                                <div className="rdv-field">
                                    <label>Téléphone</label>
                                    <div style={{ padding: '10px 12px', background: '#f9f9f9', borderRadius: '6px' }}>
                                        {selectedClient.telephone || 'Non renseigné'}
                                    </div>
                                </div>

                                <div className="rdv-field rdv-field-full">
                                    <label>Adresse postale</label>
                                    <div style={{ padding: '10px 12px', background: '#f9f9f9', borderRadius: '6px' }}>
                                        {selectedClient.adresse || 'Non renseignée'}
                                    </div>
                                </div>

                                <div className="rdv-field">
                                    <label>Rôle</label>
                                    <div>
                                        <span className={`rdv-status-select ${getRoleBadgeClass(selectedClient.roles)}`}>
                                            {getRoleLabel(selectedClient.roles)}
                                        </span>
                                    </div>
                                </div>

                                <div className="rdv-field">
                                    <label>Date d'inscription</label>
                                    <div style={{ padding: '10px 12px', background: '#f9f9f9', borderRadius: '6px' }}>
                                        {formatDate(selectedClient.dateCreation)}
                                    </div>
                                </div>
                            </div>

                            {/* VÉHICULES DU CLIENT */}
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <h3 style={{ fontSize: '16px', margin: '0 0 12px' }}>
                                    Véhicules enregistrés ({selectedClient.vehicules?.length || 0})
                                </h3>
                                {selectedClient.vehicules && selectedClient.vehicules.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {selectedClient.vehicules.map((v) => (
                                            <div
                                                key={v.id}
                                                style={{ padding: '12px', border: '1px solid #eee', borderRadius: '6px', background: '#fafafa' }}
                                            >
                                                <strong>{v.marque} {v.modele}</strong>
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                                                    Immatriculation : {v.immatriculation || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#888', fontSize: '13px' }}>
                                        Aucun véhicule enregistré pour ce compte.
                                    </p>
                                )}
                            </div>

                            <div className="rdv-modal-footer">
                                <button
                                    type="button"
                                    className="rdv-secondary-button"
                                    onClick={() => setSelectedClient(null)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ÉDITION RÔLE (ADMIN SEULEMENT) */}
            {editingClient && isAdmin && (
                <div
                    className="rdv-modal-overlay"
                    onClick={() => setEditingClient(null)}
                >
                    <div
                        className="rdv-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rdv-modal-header">
                            <div>
                                <span>ADMINISTRATION</span>
                                <h2>Modifier le rôle de l'utilisateur</h2>
                            </div>
                            <button
                                className="rdv-close"
                                onClick={() => setEditingClient(null)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRole}>
                            <p style={{ margin: '0 0 20px', color: '#555', fontSize: '14px' }}>
                                Vous modifiez les permissions d'accès pour <strong>{editingClient.prenom} {editingClient.nom}</strong> ({editingClient.email}).
                            </p>

                            <div className="rdv-form-grid">
                                <div className="rdv-field rdv-field-full">
                                    <label>Nouveau rôle attribué *</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        required
                                    >
                                        <option value="CLIENT">CLIENT (Accès Espace Client standard)</option>
                                        <option value="MODERATEUR">MODERATEUR (Gestion RDV, interventions, annonces)</option>
                                        <option value="ADMIN">ADMIN (Accès total)</option>
                                    </select>
                                </div>

                                <div className="rdv-field rdv-field-full">
                                    <label>Mot de passe actuel de l'utilisateur *</label>
                                    <input
                                        type="password"
                                        placeholder="Saisissez un mot de passe pour valider la mise à jour"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        required
                                    />
                                    <small style={{ color: '#777', marginTop: '4px' }}>
                                        Requis par le système de sécurité lors de la mise à jour de l'utilisateur.
                                    </small>
                                </div>
                            </div>

                            <div className="rdv-modal-footer">
                                <button
                                    type="button"
                                    className="rdv-secondary-button"
                                    onClick={() => setEditingClient(null)}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rdv-primary-button"
                                    disabled={submittingRole || !adminPassword}
                                >
                                    {submittingRole ? 'Enregistrement...' : 'Valider le changement de rôle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
