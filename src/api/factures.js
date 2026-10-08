import axiosClient from './axiosClient';

export async function getFactures() {
    const response = await axiosClient.get('/factures');
    return response.data;
}

export async function getFacturesFiltered(mois, annee) {
    const params = {};
    if (mois) params.mois = mois;
    if (annee) params.annee = annee;
    const response = await axiosClient.get('/factures', { params });
    return response.data;
}

export async function getFacture(id) {
    const response = await axiosClient.get(`/factures/${id}`);
    return response.data;
}

export async function updateStatutFacture(id, statut) {
    const response = await axiosClient.patch(`/factures/${id}/statut`, { statut });
    return response.data;
}

export async function deleteFacture(id) {
    await axiosClient.delete(`/factures/${id}`);
}

export async function telechargerFacturePdf(id) {
    const response = await axiosClient.get(`/factures/${id}/pdf`, { responseType: 'blob' });
    return response.data; // Blob
}

export async function envoyerFactureEmail(id) {
    const response = await axiosClient.post(`/factures/${id}/envoyer-email`);
    return response.data;
}
