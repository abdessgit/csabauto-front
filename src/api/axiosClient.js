
import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

const axiosClient = axios.create({
    baseURL: `${rawApiUrl}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/login_check');
        const isLoginPage = window.location.pathname === '/login';

        if (
            error.response?.status === 401 &&
            !isLoginRequest &&
            !isLoginPage
        ) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default axiosClient;



