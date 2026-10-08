import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getConversations,
    getMessagesConversation,
    createConversation,
} from '../../api/conversations';
import { createMessage } from '../../api/messages';
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

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export default function MesDemandes() {
    const { user } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const annonceIdParam =
        searchParams.get('annonceId') || location.state?.annonceId;

    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newMessageText, setNewMessageText] = useState('');

    const [showNewModal, setShowNewModal] = useState(false);
    const [newConvForm, setNewConvForm] = useState({
        objet: '',
        annonceId: annonceIdParam || '',
        initialMessage: '',
    });

    async function loadConversations() {
        setLoading(true);
        setError('');
        try {
            const data = await getConversations();
            const list = normalizeCollection(data);
            setConversations(list);

            // Si on a déjà une conversation sélectionnée, rafraîchir son objet
            if (selectedConv) {
                const refreshed = list.find((c) => c.id === selectedConv.id);
                if (refreshed) setSelectedConv(refreshed);
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur chargement conversations :', err);
            }
            setError('Impossible de charger vos demandes.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadConversations();
    }, []);

    // Si on arrive avec un annonceId, ouvrir automatiquement la modal de nouvelle demande
    useEffect(() => {
        if (annonceIdParam) {
            setNewConvForm((prev) => ({
                ...prev,
                annonceId: annonceIdParam,
            }));
            setShowNewModal(true);
        }
    }, [annonceIdParam]);

    async function selectConversation(conv) {
        setSelectedConv(conv);
        setLoadingMessages(true);
        setError('');
        try {
            const msgs = await getMessagesConversation(conv.id);
            setMessages(normalizeCollection(msgs));
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur chargement messages :', err);
            }
            setError('Impossible de charger les messages de cette conversation.');
        } finally {
            setLoadingMessages(false);
        }
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!newMessageText.trim() || !selectedConv) return;

        setSendingMessage(true);
        setError('');

        try {
            await createMessage({
                conversationId: selectedConv.id,
                expediteurId: user?.id,
                contenu: newMessageText.trim(),
            });

            setNewMessageText('');
            // Recharger les messages
            const msgs = await getMessagesConversation(selectedConv.id);
            setMessages(normalizeCollection(msgs));
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur envoi message :', err);
            }

            const serverData = err.response?.data;
            let errorMessage = 'Erreur lors de l’envoi du message.';
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
            setSendingMessage(false);
        }
    }

    async function handleCreateConversation(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newConvForm.objet?.trim()) {
            setError("Veuillez renseigner l'objet de la demande.");
            return;
        }

        if (!newConvForm.initialMessage?.trim()) {
            setError("Veuillez saisir votre premier message.");
            return;
        }

        try {
            const payload = {
                objet: newConvForm.objet.trim(),
            };

            if (user?.id) {
                payload.clientId = user.id;
            }

            if (newConvForm.annonceId && !isNaN(parseInt(newConvForm.annonceId, 10))) {
                payload.annonceId = parseInt(newConvForm.annonceId, 10);
            }

            const created = await createConversation(payload);
            const createdConv = created?.data || created;

            // Si un message initial est fourni, on l'envoie dans la foulée
            if (newConvForm.initialMessage.trim() && createdConv?.id) {
                await createMessage({
                    conversationId: createdConv.id,
                    expediteurId: user?.id,
                    contenu: newConvForm.initialMessage.trim(),
                });
            }

            setSuccess('Votre demande a été créée.');
            setShowNewModal(false);
            setNewConvForm({ objet: '', annonceId: '', initialMessage: '' });

            await loadConversations();
            if (createdConv) {
                selectConversation(createdConv);
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur création conversation :', err);
            }

            const serverData = err.response?.data;
            let errorMessage = 'Erreur lors de la création de la demande.';
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
                    <h1>Mes Demandes & Messages</h1>
                    <p>Échangez avec l’équipe CS AB AUTO au sujet de vos véhicules ou de nos annonces.</p>
                </div>

                <button
                    className="rdv-primary-button"
                    onClick={() => {
                        setError('');
                        setSuccess('');
                        setShowNewModal(true);
                    }}
                >
                    + Nouvelle demande
                </button>
            </div>

            {/* ALERTS */}
            {error && <div className="rdv-alert rdv-alert-error">{error}</div>}
            {success && <div className="rdv-alert rdv-alert-success">{success}</div>}

            {/* MAIN MESSAGING VIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '25px', marginTop: '10px' }}>

                {/* COLONNE GAUCHE : LISTE DES CONVERSATIONS */}
                <div className="rdv-table-container" style={{ padding: '0', height: 'fit-content', maxHeight: '75vh', overflowY: 'auto' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
                        <strong style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Conversations ({conversations.length})
                        </strong>
                    </div>

                    {loading ? (
                        <div className="rdv-loading">
                            <p>Chargement...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="rdv-empty" style={{ padding: '40px 20px' }}>
                            <div className="rdv-empty-icon">✉</div>
                            <h3 style={{ margin: '0 0 5px', fontSize: '16px' }}>Aucune demande</h3>
                            <p style={{ fontSize: '13px', margin: 0 }}>
                                Vous n'avez pas encore de conversation en cours.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {conversations.map((conv) => {
                                const isSelected = selectedConv?.id === conv.id;
                                const titre = conv.objet || (conv.annonce
                                    ? `Annonce : ${conv.annonce.titre || '#' + conv.annonce.id}`
                                    : `Demande générale #${conv.id}`);

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        style={{
                                            padding: '16px 20px',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            background: isSelected ? '#fffdf2' : 'white',
                                            borderLeft: isSelected ? '4px solid #f5c400' : '4px solid transparent',
                                            transition: '0.2s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong style={{ fontSize: '14px', color: '#111' }}>
                                                {titre}
                                            </strong>
                                            <span style={{ fontSize: '11px', color: '#888' }}>
                                                {formatDate(conv.dateCreation)}
                                            </span>
                                        </div>

                                        {conv.annonce && conv.objet && (
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                                Réf annonce : {conv.annonce.titre || '#' + conv.annonce.id}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                {conv.moderateur
                                                    ? `Modérateur : ${conv.moderateur.prenom || ''} ${conv.moderateur.nom || ''}`
                                                    : 'En attente d’un modérateur'}
                                            </span>
                                            <span
                                                className={`rdv-status-select status-${(conv.statut || 'ouverte').toLowerCase()}`}
                                                style={{ fontSize: '10px', padding: '4px 8px' }}
                                            >
                                                {conv.statut || 'OUVERTE'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* COLONNE DROITE : FIL DE MESSAGES */}
                <div className="rdv-table-container" style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
                    {selectedConv ? (
                        <>
                            {/* EN-TÊTE CONVERSATION */}
                            <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                                        {selectedConv.objet || (selectedConv.annonce
                                            ? `Objet : Annonce ${selectedConv.annonce.titre}`
                                            : `Demande #${selectedConv.id}`)}
                                    </h3>
                                    <small style={{ color: '#777' }}>
                                        {selectedConv.annonce ? `Annonce concernée : ${selectedConv.annonce.titre} • ` : ''}
                                        Créée le {formatDate(selectedConv.dateCreation)}
                                    </small>
                                </div>
                                <span className={`rdv-status-select status-${(selectedConv.statut || 'ouverte').toLowerCase()}`}>
                                    {selectedConv.statut || 'OUVERTE'}
                                </span>
                            </div>

                            {/* MESSAGES THREAD */}
                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {loadingMessages ? (
                                    <p style={{ textAlign: 'center', color: '#888', margin: 'auto' }}>
                                        Chargement des messages...
                                    </p>
                                ) : messages.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#888', margin: 'auto' }}>
                                        Aucun message dans cette conversation. Envoyez le premier message ci-dessous !
                                    </p>
                                ) : (
                                    messages.map((m) => {
                                        const isMe = m.expediteur?.id === user?.id;

                                        return (
                                            <div
                                                key={m.id}
                                                style={{
                                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                    maxWidth: '75%',
                                                    background: isMe ? '#f5c400' : '#f0f0f0',
                                                    color: '#111',
                                                    padding: '12px 16px',
                                                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                }}
                                            >
                                                <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px', opacity: 0.85 }}>
                                                    {isMe ? 'Moi' : `${m.expediteur?.prenom || 'Conseiller'} (${m.expediteur?.email || 'Garage'})`}
                                                </div>
                                                <div style={{ fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                    {m.contenu}
                                                </div>
                                                <div style={{ fontSize: '10px', textAlign: 'right', marginTop: '5px', opacity: 0.7 }}>
                                                    {formatDate(m.dateEnvoi)}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* ZONE D'ENVOI */}
                            <form
                                onSubmit={handleSendMessage}
                                style={{ padding: '16px 20px', borderTop: '1px solid #eee', background: 'white', display: 'flex', gap: '10px' }}
                            >
                                <input
                                    type="text"
                                    placeholder="Écrivez votre message..."
                                    value={newMessageText}
                                    onChange={(e) => setNewMessageText(e.target.value)}
                                    style={{
                                        flex: 1,
                                        height: '46px',
                                        padding: '0 14px',
                                        border: '1px solid #ddd',
                                        borderRadius: '7px',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    type="submit"
                                    className="rdv-primary-button"
                                    disabled={sendingMessage || !newMessageText.trim()}
                                    style={{ padding: '0 24px', height: '46px' }}
                                >
                                    {sendingMessage ? '...' : 'Envoyer'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="rdv-empty" style={{ margin: 'auto' }}>
                            <div className="rdv-empty-icon">💬</div>
                            <h2>Sélectionnez une demande</h2>
                            <p>Cliquez sur une conversation à gauche pour afficher son historique et répondre.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* MODAL NOUVELLE CONVERSATION */}
            {showNewModal && (
                <div
                    className="rdv-modal-overlay"
                    onClick={() => setShowNewModal(false)}
                >
                    <div
                        className="rdv-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="rdv-modal-header">
                            <div>
                                <span>ESPACE CLIENT</span>
                                <h2>Nouvelle demande / Message</h2>
                            </div>
                            <button
                                className="rdv-close"
                                onClick={() => setShowNewModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div className="rdv-alert rdv-alert-error" style={{ margin: '15px 20px 0' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateConversation}>
                            <div className="rdv-form-grid">
                                <div className="rdv-field rdv-field-full">
                                    <label>Identifiant d'annonce (optionnel)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 12 (si cette demande concerne un véhicule en vente)"
                                        value={newConvForm.annonceId}
                                        onChange={(e) =>
                                            setNewConvForm({
                                                ...newConvForm,
                                                annonceId: e.target.value,
                                            })
                                        }
                                    />
                                    <small style={{ color: '#777', marginTop: '3px' }}>
                                        Laissez vide pour une demande générale auprès de l’équipe.
                                    </small>
                                </div>

                                <div className="rdv-field rdv-field-full">
                                    <label>Objet de la demande *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex : Question sur la Peugeot 308"
                                        maxLength={120}
                                        value={newConvForm.objet}
                                        onChange={(e) =>
                                            setNewConvForm({
                                                ...newConvForm,
                                                objet: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>

                                <div className="rdv-field rdv-field-full">
                                    <label>Votre premier message *</label>
                                    <textarea
                                        rows="4"
                                        placeholder="Décrivez votre demande, question ou disponibilité..."
                                        value={newConvForm.initialMessage}
                                        onChange={(e) =>
                                            setNewConvForm({
                                                ...newConvForm,
                                                initialMessage: e.target.value,
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
                                    onClick={() => setShowNewModal(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="rdv-primary-button"
                                >
                                    Créer la demande
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
