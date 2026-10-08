import axiosClient from './axiosClient';

export async function getInterventions() {
    const response = await axiosClient.get('/interventions');
    return response.data;
}

export async function getIntervention(id) {
    const response = await axiosClient.get(`/interventions/${id}`);
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

export async function updateStatutIntervention(id, dataOrStatut, montant = null) {
    const payload = typeof dataOrStatut === 'object' && dataOrStatut !== null
        ? dataOrStatut
        : { statut: dataOrStatut, ...(montant !== null && { montant }) };
    const response = await axiosClient.patch(`/interventions/${id}/statut`, payload);
    return response.data;
}

export async function deleteIntervention(id) {
    await axiosClient.delete(`/interventions/${id}`);
}

export async function genererFacture(interventionId) {
    const response = await axiosClient.post(`/interventions/${interventionId}/facture`);
    return response.data;
}
