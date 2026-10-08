import axiosClient from './axiosClient';

// getUtilisateurs est déjà défini dans moderateur.js, on le réexporte pour éviter la duplication
export { getUtilisateurs } from './moderateur';

export async function getUtilisateur(id) {
    const response = await axiosClient.get(`/utilisateurs/${id}`);
    return response.data;
}

export async function updateUtilisateur(id, data) {
    const response = await axiosClient.put(`/utilisateurs/${id}`, data);
    return response.data;
}

export async function deleteUtilisateur(id) {
    await axiosClient.delete(`/utilisateurs/${id}`);
}
