import axiosClient from './axiosClient';

export async function getVehicules() {
    const response = await axiosClient.get('/vehicules');
    return response.data;
}

export async function getVehicule(id) {
    const response = await axiosClient.get(`/vehicules/${id}`);
    return response.data;
}

export async function createVehicule(data) {
    const response = await axiosClient.post('/vehicules', data);
    return response.data;
}

export async function updateVehicule(id, data) {
    const response = await axiosClient.put(`/vehicules/${id}`, data);
    return response.data;
}

export async function deleteVehicule(id) {
    await axiosClient.delete(`/vehicules/${id}`);
}