import axiosClient from './axiosClient';

export async function getConversations() {
    const response = await axiosClient.get('/conversations');
    return response.data;
}

export async function getConversation(id) {
    const response = await axiosClient.get(`/conversations/${id}`);
    return response.data;
}

export async function getMessagesConversation(id) {
    const response = await axiosClient.get(`/conversations/${id}/messages`);
    return response.data;
}

export async function createConversation(data) {
    const response = await axiosClient.post('/conversations', data);
    return response.data?.data || response.data;
}

export async function deleteConversation(id) {
    await axiosClient.delete(`/conversations/${id}`);
}
