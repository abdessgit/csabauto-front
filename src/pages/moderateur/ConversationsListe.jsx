import { useEffect, useState } from 'react';
import BackToDashboardButton from '../../components/BackToDashboardButton';
import { useAuth } from '../../context/AuthContext';
import {
    getConversations,
    getMessagesConversation,
    deleteConversation,
} from '../../api/conversations';
import { createMessage } from '../../api/messages';
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

export default function ConversationsListe() {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newMessageText, setNewMessageText] = useState('');

    async function loadConversations() {
        setLoading(true);
        setError('');
        try {
            const data = await getConversations();
            const list = normalizeCollection(data);
            setConversations(list);

            if (selectedConv) {
                const refreshed = list.find((c) => c.id === selectedConv.id);
                if (refreshed) setSelectedConv(refreshed);
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur chargement conversations :', err);
            }
            setError('Impossible de charger les conversations.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadConversations();
    }, []);

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
            const msgs = await getMessagesConversation(selectedConv.id);
            setMessages(normalizeCollection(msgs));
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('Erreur envoi message :', err);
            }

            const serverData = err.response?.data;
            let errorMessage = 'Erreur lors de l’envoi de la réponse.';
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

    async function handleDeleteConversation(convId) {
        if (!window.confirm('Supprimer définitivement cette conversation ?')) {
            return;
        }

        setError('');
        setSuccess('');

        try {
            await deleteConversation(convId);
            setSuccess('Conversation supprimée.');
            if (selectedConv?.id === convId) {
                setSelectedConv(null);
                setMessages([]);
            }
            loadConversations();
        } catch (err) {
            console.error('Erreur suppression conversation :', err);
            setError(
                err.response?.data?.error ||
                'Impossible de supprimer cette conversation.'
            );
        }
    }

    return (
        <div className="rdv-page">

            {/* HEADER */}
            <div className="rdv-header">
                <div>
                    <BackToDashboardButton />
                    <h1>Messagerie & Demandes Clients</h1>
                    <p>Consultez l'ensemble des échanges clients et répondez directement aux demandes d'informations.</p>
                </div>
            </div>

            {/* ALERTS */}
            {error && <div className="rdv-alert rdv-alert-error">{error}</div>}
            {success && <div className="rdv-alert rdv-alert-success">{success}</div>}

            {/* MAIN MESSAGING VIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr', gap: '25px', marginTop: '10px' }}>

                {/* COLONNE GAUCHE : LISTE DES CONVERSATIONS */}
                <div className="rdv-table-container" style={{ padding: '0', height: 'fit-content', maxHeight: '75vh', overflowY: 'auto' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Toutes les conversations ({conversations.length})
                        </strong>
                    </div>

                    {loading ? (
                        <div className="rdv-loading">
                            <p>Chargement...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="rdv-empty" style={{ padding: '40px 20px' }}>
                            <div className="rdv-empty-icon">✉</div>
                            <h3 style={{ margin: '0 0 5px', fontSize: '16px' }}>Aucune conversation</h3>
                            <p style={{ fontSize: '13px', margin: 0 }}>
                                Aucun client n'a encore initié de demande.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {conversations.map((conv) => {
                                const isSelected = selectedConv?.id === conv.id;
                                const clientName = conv.client
                                    ? `${conv.client.prenom || ''} ${conv.client.nom || ''}`.trim() || conv.client.email
                                    : 'Client inconnu';

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
                                                {clientName}
                                            </strong>
                                            <span style={{ fontSize: '11px', color: '#888' }}>
                                                {formatDate(conv.dateCreation)}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '13px', color: '#111', fontWeight: 600, marginBottom: '4px' }}>
                                            {conv.objet || (conv.annonce
                                                ? `Réf annonce : ${conv.annonce.titre}`
                                                : `Demande générale #${conv.id}`)}
                                        </div>

                                        {conv.annonce && conv.objet && (
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                                Réf annonce : {conv.annonce.titre}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', color: '#777' }}>
                                                {conv.client?.email || ''}
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

                {/* COLONNE DROITE : FIL DE MESSAGES & RÉPONSE */}
                <div className="rdv-table-container" style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
                    {selectedConv ? (
                        <>
                            {/* EN-TÊTE CONVERSATION */}
                            <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                                        {selectedConv.objet || `Demande #${selectedConv.id}`}
                                    </h3>
                                    <small style={{ color: '#777' }}>
                                        Client : {selectedConv.client?.prenom} {selectedConv.client?.nom} ({selectedConv.client?.email})
                                        {selectedConv.annonce ? ` • Annonce : ${selectedConv.annonce.titre}` : ' • Demande générale'}
                                    </small>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className={`rdv-status-select status-${(selectedConv.statut || 'ouverte').toLowerCase()}`}>
                                        {selectedConv.statut || 'OUVERTE'}
                                    </span>
                                    <button
                                        className="rdv-action-delete"
                                        onClick={() => handleDeleteConversation(selectedConv.id)}
                                        title="Supprimer la conversation"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>

                            {/* MESSAGES THREAD */}
                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {loadingMessages ? (
                                    <p style={{ textAlign: 'center', color: '#888', margin: 'auto' }}>
                                        Chargement des messages...
                                    </p>
                                ) : messages.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#888', margin: 'auto' }}>
                                        Aucun message dans cette conversation.
                                    </p>
                                ) : (
                                    messages.map((m) => {
                                        const isMe = m.expediteur?.id === user?.id;
                                        const isClient = m.expediteur?.id === selectedConv.client?.id;

                                        return (
                                            <div
                                                key={m.id}
                                                style={{
                                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                    maxWidth: '75%',
                                                    background: isMe ? '#f5c400' : isClient ? '#ffffff' : '#f0f0f0',
                                                    border: isClient ? '1px solid #ddd' : 'none',
                                                    color: '#111',
                                                    padding: '12px 16px',
                                                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                }}
                                            >
                                                <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '4px', opacity: 0.85 }}>
                                                    {isMe
                                                        ? 'Moi (Modérateur)'
                                                        : isClient
                                                            ? `Client : ${m.expediteur?.prenom || ''} ${m.expediteur?.nom || ''}`
                                                            : `Autre membre : ${m.expediteur?.prenom || 'Staff'}`}
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

                            {/* ZONE D'ENVOI RÉPONSE */}
                            <form
                                onSubmit={handleSendMessage}
                                style={{ padding: '16px 20px', borderTop: '1px solid #eee', background: 'white', display: 'flex', gap: '10px' }}
                            >
                                <input
                                    type="text"
                                    placeholder="Répondre au client..."
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
                                    {sendingMessage ? '...' : 'Envoyer la réponse'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="rdv-empty" style={{ margin: 'auto' }}>
                            <div className="rdv-empty-icon">💬</div>
                            <h2>Sélectionnez une conversation</h2>
                            <p>Cliquez sur un message à gauche pour afficher l’historique d’échanges et répondre au client.</p>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
