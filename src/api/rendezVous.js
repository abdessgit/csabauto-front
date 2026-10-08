import axiosClient from './axiosClient';

export async function getRendezVous() {
    const response = await axiosClient.get('/rendez-vous');
    return response.data;
}

export async function getRendezVousById(id) {
    const response = await axiosClient.get(`/rendez-vous/${id}`);
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

export async function updateStatutRendezVous(id, statut) {
    const response = await axiosClient.patch(
        `/rendez-vous/${id}/statut`,
        { statut }
    );

    return response.data;
}

export async function deleteRendezVous(id) {
    await axiosClient.delete(`/rendez-vous/${id}`);
}