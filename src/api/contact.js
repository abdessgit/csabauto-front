import axiosClient from './axiosClient';

/**
 * Envoie un message via le formulaire de contact public.
 * Endpoint : POST /api/contact
 *
 * @param {Object} data { nom, email, telephone, sujet, message, site_web }
 * @returns {Promise<Object>}
 */
export const envoyerMessageContact = async (data) => {
    const response = await axiosClient.post('/contact', data);
    return response.data;
};

/**
 * Récupère la liste paginée et filtrée des messages de contact (rôle Modérateur ou Admin).
 * Endpoint : GET /api/messages-contact
 *
 * @param {Object} params { statut?: 'NOUVEAU' | 'TRAITE', page?: number, limit?: number }
 * @returns {Promise<Object>}
 */
export const getMessagesContact = async (params = {}) => {
    const response = await axiosClient.get('/messages-contact', { params });
    return response.data;
};

/**
 * Récupère le détail d'un message de contact par son identifiant.
 * Endpoint : GET /api/messages-contact/:id
 *
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getMessageContactDetail = async (id) => {
    const response = await axiosClient.get(`/messages-contact/${id}`);
    return response.data;
};

/**
 * Envoie une réponse par e-mail au visiteur pour un message de contact donné.
 * Endpoint : POST /api/messages-contact/:id/repondre
 *
 * @param {number|string} id
 * @param {string} reponse
 * @returns {Promise<Object>}
 */
export const repondreMessageContact = async (id, reponse) => {
    const response = await axiosClient.post(`/messages-contact/${id}/repondre`, { reponse });
    return response.data;
};
