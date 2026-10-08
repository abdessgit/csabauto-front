import axiosClient from './axiosClient';

export async function login(email, password) {
    const response = await axiosClient.post('/login_check', { email, password });
    return response.data; // { token: "..." }
}

export async function register(userData) {
    const response = await axiosClient.post('/utilisateurs', userData);
    return response.data;
}

export async function verifyEmail(token) {
    const response = await axiosClient.post('/auth/verify-email', { token });
    return response.data;
}

export async function resendVerification(email) {
    const response = await axiosClient.post('/auth/resend-verification', { email });
    return response.data;
}

export async function forgotPassword(email) {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    return response.data;
}

export async function validateResetToken(token) {
    const response = await axiosClient.get('/auth/reset-password/validate', {
        params: { token },
    });
    return response.data;
}

export async function resetPassword({ token, password, confirmPassword }) {
    const response = await axiosClient.post('/auth/reset-password', {
        token,
        password,
        confirmPassword,
    });
    return response.data;
}