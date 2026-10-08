import axiosClient from './axiosClient';

/*
|--------------------------------------------------------------------------
| UTILISATEURS / CLIENTS
|--------------------------------------------------------------------------
*/

export async function getUtilisateurs() {
    const response = await axiosClient.get('/utilisateurs');
    return response.data;
}


/*
|--------------------------------------------------------------------------
| RENDEZ-VOUS
|--------------------------------------------------------------------------
*/

export async function getRendezVous() {
    const response = await axiosClient.get('/rendez-vous');
    return response.data;
}

export async function createRendezVous(data) {
    const response = await axiosClient.post('/rendez-vous', data);
    return response.data;
}

export async function updateRendezVous(id, data) {
    const response = await axiosClient.put(`/rendez-vous/${id}`, data);
    return response.data;
}

export async function updateRendezVousStatut(id, statut) {
    const response = await axiosClient.patch(
        `/rendez-vous/${id}/statut`,
        { statut }
    );

    return response.data;
}

export async function deleteRendezVous(id) {
    await axiosClient.delete(`/rendez-vous/${id}`);
}


/*
|--------------------------------------------------------------------------
| INTERVENTIONS
|--------------------------------------------------------------------------
*/

export async function getInterventions() {
    const response = await axiosClient.get('/interventions');
    return response.data;
}

export async function createIntervention(data) {
    const response = await axiosClient.post('/interventions', data);
    return response.data;
}

export async function updateIntervention(id, data) {
    const response = await axiosClient.put(`/interventions/${id}`, data);
    return response.data;
}

export async function deleteIntervention(id) {
    await axiosClient.delete(`/interventions/${id}`);
}

export async function generateFacture(interventionId) {
    const response = await axiosClient.post(
        `/interventions/${interventionId}/facture`
    );

    return response.data;
}


/*
|--------------------------------------------------------------------------
| FACTURES
|--------------------------------------------------------------------------
*/

export async function getFactures() {
    const response = await axiosClient.get('/factures');
    return response.data;
}

export async function updateFactureStatut(id, statut) {
    const response = await axiosClient.patch(
        `/factures/${id}/statut`,
        { statut }
    );

    return response.data;
}


/*
|--------------------------------------------------------------------------
| CONVERSATIONS
|--------------------------------------------------------------------------
*/

export async function getConversations() {
    const response = await axiosClient.get('/conversations');
    return response.data;
}

export async function getConversationMessages(id) {
    const response = await axiosClient.get(
        `/conversations/${id}/messages`
    );

    return response.data;
}

export async function createConversation(data) {
    const response = await axiosClient.post(
        '/conversations',
        data
    );

    return response.data;
}


/*
|--------------------------------------------------------------------------
| MESSAGES
|--------------------------------------------------------------------------
*/

export async function sendMessage(data) {
    const response = await axiosClient.post(
        '/messages',
        data
    );

    return response.data;
}


/*
|--------------------------------------------------------------------------
| ANNONCES
|--------------------------------------------------------------------------
*/

export async function getAnnonces() {
    const response = await axiosClient.get('/annonces');
    return response.data;
}

export async function createAnnonce(data) {
    const response = await axiosClient.post('/annonces', data);
    return response.data;
}

export async function updateAnnonce(id, data) {
    const response = await axiosClient.put(
        `/annonces/${id}`,
        data
    );

    return response.data;
}

export async function deleteAnnonce(id) {
    await axiosClient.delete(`/annonces/${id}`);
}