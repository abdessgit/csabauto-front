import axiosClient from './axiosClient';

export async function getDashboardAdmin() {
    const response = await axiosClient.get('/dashboard/admin');
    return response.data;
}

export async function getDashboardModerateur() {
    const response = await axiosClient.get('/dashboard/moderateur');
    return response.data;
}

export async function getDashboardClient() {
    const response = await axiosClient.get('/dashboard/client');
    return response.data;
}
