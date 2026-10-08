import axiosClient from './axiosClient';

export async function getServices() {
    const response = await axiosClient.get('/services');
    return response.data;
}
