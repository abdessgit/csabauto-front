import { useEffect, useState } from 'react';
import BackToDashboardButton from '../../components/BackToDashboardButton';
import {
    getMessagesContact,
    getMessageContactDetail,
    repondreMessageContact,
} from '../../api/contact';
import '../../assets/css/MessagesContactModerateur.css';

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

export default function MessagesContactListe() {
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [filterStatut, setFilterStatut] = useState('ALL'); // 'ALL' | 'NOUVEAU' | 'TRAITE'
    const [nouveauxCount, setNouveauxCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);

    const [replyText, setReplyText] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function loadList(statut = filterStatut) {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (statut !== 'ALL') {
                params.statut = statut;
            }
            const data = await getMessagesContact(params);
            const list = Array.isArray(data.items) ? data.items : [];
            setMessages(list);
            setNouveauxCount(data.nouveaux || 0);

            // Si un message est sélectionné, on rafraîchit son état
            if (selectedMessage) {
                const refreshed = list.find((m) => m.id === selectedMessage.id);
                if (refreshed) {
                    setSelectedMessage(refreshed);
                }
            } else if (list.length > 0 && window.innerWidth >= 1024) {
                // Auto-sélection du premier élément sur écran large
                selectMessage(list[0].id);
            }
        } catch (err) {
            console.error('Erreur chargement messages contact :', err);
            setError('Impossible de charger les messages de contact.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadList(filterStatut);
    }, [filterStatut]);

    async function selectMessage(id) {
        setLoadingDetail(true);
        setError('');
        setSuccess('');
        setReplyText('');
        try {
            const detail = await getMessageContactDetail(id);
            setSelectedMessage(detail);
        } catch (err) {
            console.error('Erreur chargement détail message :', err);
            setError('Impossible de charger le détail du message.');
        } finally {
            setLoadingDetail(false);
        }
    }

    async function handleSendReply(e) {
        e.preventDefault();
        if (!selectedMessage) return;

        const trimmed = replyText.trim();
        if (trimmed.length < 5) {
            setError('Votre réponse doit comporter au moins 5 caractères.');
            return;
        }

        setSendingReply(true);
        setError('');
        setSuccess('');

        try {
            const updated = await repondreMessageContact(selectedMessage.id, trimmed);
            setSelectedMessage(updated);
            setReplyText('');
            setSuccess('La réponse a été envoyée par e-mail avec succès au visiteur.');
            // Rafraîchir la liste sans perdre la sélection
            loadList(filterStatut);
        } catch (err) {
            console.error('Erreur envoi réponse :', err);
            if (err.response?.status === 429) {
                setError(err.response.data?.message || 'Trop de réponses envoyées. Veuillez patienter.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Une erreur est survenue lors de l'envoi de la réponse.");
            }
        } finally {
            setSendingReply(false);
        }
    }

    return (
        <div className="contact-msg-page">
            <div className="contact-msg-header">
                <BackToDashboardButton />
                <h1>Messages de Contact</h1>
                <p>Consultez les demandes envoyées depuis le site public et répondez-y directement par e-mail.</p>
            </div>

            <div className="contact-msg-toolbar">
                <div className="contact-msg-filters">
                    <button
                        type="button"
                        className={`contact-msg-filter-btn ${filterStatut === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilterStatut('ALL')}
                    >
                        Tous les messages
                    </button>
                    <button
                        type="button"
                        className={`contact-msg-filter-btn ${filterStatut === 'NOUVEAU' ? 'active' : ''}`}
                        onClick={() => setFilterStatut('NOUVEAU')}
                    >
                        Nouveaux
                        {nouveauxCount > 0 && (
                            <span className="contact-msg-badge-counter">{nouveauxCount}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        className={`contact-msg-filter-btn ${filterStatut === 'TRAITE' ? 'active' : ''}`}
                        onClick={() => setFilterStatut('TRAITE')}
                    >
                        Traités
                    </button>
                </div>
            </div>

            {error && <div className="contact-msg-alert contact-msg-alert-error">{error}</div>}
            {success && <div className="contact-msg-alert contact-msg-alert-success">{success}</div>}

            <div className="contact-msg-layout">
                {/* COLONNE GAUCHE : LISTE */}
                <div className="contact-msg-list-col">
                    {loading && messages.length === 0 ? (
                        <div className="contact-msg-empty">Chargement des messages...</div>
                    ) : messages.length === 0 ? (
                        <div className="contact-msg-empty">Aucun message de contact dans cette vue.</div>
                    ) : (
                        <div className="contact-msg-list">
                            {messages.map((m) => {
                                const isSelected = selectedMessage?.id === m.id;
                                const isNouveau = m.statut === 'NOUVEAU';
                                return (
                                    <div
                                        key={m.id}
                                        className={`contact-msg-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => selectMessage(m.id)}
                                    >
                                        <div className="contact-msg-card-top">
                                            <span className="contact-msg-card-name">{m.nom}</span>
                                            <span
                                                className={`contact-msg-badge ${isNouveau
                                                        ? 'contact-msg-badge-nouveau'
                                                        : 'contact-msg-badge-traite'
                                                    }`}
                                            >
                                                {isNouveau ? 'Nouveau' : 'Traité'}
                                            </span>
                                        </div>

                                        {m.sujet && (
                                            <div className="contact-msg-card-subject">
                                                {m.sujet}
                                            </div>
                                        )}

                                        <p className="contact-msg-card-preview">{m.message}</p>

                                        <div className="contact-msg-card-footer">
                                            <span>{m.email}</span>
                                            <span>{formatDate(m.dateEnvoi)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* COLONNE DROITE : DÉTAIL & RÉPONSE */}
                <div className="contact-msg-detail-col">
                    {loadingDetail ? (
                        <div className="contact-msg-empty">Chargement de la demande...</div>
                    ) : selectedMessage ? (
                        <div className="contact-msg-detail-card">
                            <div className="contact-msg-detail-header">
                                <div>
                                    <h2 className="contact-msg-detail-title">
                                        Demande de {selectedMessage.nom}
                                    </h2>
                                    <span
                                        className={`contact-msg-badge ${selectedMessage.statut === 'NOUVEAU'
                                                ? 'contact-msg-badge-nouveau'
                                                : 'contact-msg-badge-traite'
                                            }`}
                                    >
                                        {selectedMessage.statut === 'NOUVEAU' ? 'À traiter' : 'Traité'}
                                    </span>
                                </div>
                            </div>

                            <div className="contact-msg-meta-grid">
                                <div className="contact-msg-meta-item">
                                    <strong>E-mail</strong>
                                    <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                                </div>
                                <div className="contact-msg-meta-item">
                                    <strong>Téléphone</strong>
                                    {selectedMessage.telephone ? (
                                        <a href={`tel:${selectedMessage.telephone}`}>{selectedMessage.telephone}</a>
                                    ) : (
                                        <span>Non communiqué</span>
                                    )}
                                </div>
                                <div className="contact-msg-meta-item">
                                    <strong>Sujet</strong>
                                    <span>{selectedMessage.sujet || 'Non renseigné'}</span>
                                </div>
                                <div className="contact-msg-meta-item">
                                    <strong>Date d'envoi</strong>
                                    <span>{formatDate(selectedMessage.dateEnvoi)}</span>
                                </div>
                            </div>

                            <div className="contact-msg-content-box">
                                <h4>Message envoyé par le visiteur</h4>
                                <p className="contact-msg-content-text">{selectedMessage.message}</p>
                            </div>

                            {/* SI LE MESSAGE A DÉJÀ ÉTÉ TRAITÉ */}
                            {selectedMessage.statut === 'TRAITE' ? (
                                <div className="contact-msg-replied-box">
                                    <h4>✓ Réponse envoyée par e-mail</h4>
                                    <p className="contact-msg-replied-text">{selectedMessage.reponse}</p>
                                    <p className="contact-msg-replied-author">
                                        Répondu le {formatDate(selectedMessage.dateReponse)}
                                        {selectedMessage.repondPar && (
                                            <> par {selectedMessage.repondPar.prenom} {selectedMessage.repondPar.nom}</>
                                        )}
                                    </p>
                                </div>
                            ) : (
                                /* FORMULAIRE DE RÉPONSE */
                                <form className="contact-msg-reply-form" onSubmit={handleSendReply}>
                                    <h3>Répondre à {selectedMessage.nom}</h3>
                                    <p>
                                        Votre réponse sera envoyée par e-mail à l'adresse <strong>{selectedMessage.email}</strong> en rappelant sa demande.
                                    </p>

                                    <textarea
                                        className="contact-msg-textarea"
                                        rows="6"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Rédigez votre réponse ici..."
                                        disabled={sendingReply}
                                        required
                                    ></textarea>

                                    <button
                                        type="submit"
                                        className="contact-msg-submit-btn"
                                        disabled={sendingReply || replyText.trim().length < 5}
                                    >
                                        {sendingReply ? 'Envoi en cours...' : 'Envoyer la réponse par e-mail'}
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="contact-msg-empty">
                            Sélectionnez un message dans la liste à gauche pour consulter son contenu et y répondre.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
