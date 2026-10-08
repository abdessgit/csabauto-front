import axiosClient from './axiosClient';

export async function createMessage(data) {
    const response = await axiosClient.post('/messages', data);
    return response.data?.data || response.data;
}

export async function marquerMessageLu(id) {
    const response = await axiosClient.patch(`/messages/${id}/lu`);
    return response.data;
}
