import axiosClient from './axiosClient';

export async function getAnnonces(params) {
    const response = await axiosClient.get('/annonces', { params });
    return response.data?.data || response.data;
}

export async function getAnnonce(id) {
    const response = await axiosClient.get(`/annonces/${id}`);
    return response.data?.data || response.data;
}

export async function createAnnonce(data) {
    const response = await axiosClient.post('/annonces', data);
    return response.data?.data || response.data;
}

export async function updateAnnonce(id, data) {
    const response = await axiosClient.put(`/annonces/${id}`, data);
    return response.data?.data || response.data;
}

export async function updateStatutAnnonce(id, statut) {
    const response = await axiosClient.patch(`/annonces/${id}/statut`, { statut });
    return response.data?.data || response.data;
}

export async function deleteAnnonce(id) {
    await axiosClient.delete(`/annonces/${id}`);
}

export async function uploadPhotoAnnonce(formData) {
    const response = await axiosClient.post('/annonces/upload-photo', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export async function getAnnoncesPubliques(params) {
    const response = await axiosClient.get('/annonces/publiques', { params });
    return response.data;
}

export async function getAnnoncePublique(id) {
    const response = await axiosClient.get(`/annonces/publiques/${id}`);
    return response.data;
}
