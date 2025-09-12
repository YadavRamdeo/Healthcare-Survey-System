import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect on 401 if user was previously authenticated
        if (error.response?.status === 401) {
            const token = localStorage.getItem('token');
            if (token) {
                // User had a token but it's invalid/expired
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (!window.location.pathname.includes('/login')) {
                    toast.error('Session expired. Please login again.');
                    window.location.href = '/login';
                }
            }
            // If no token, 401 is expected for protected routes
            return Promise.reject(error);
        }

        if (error.response?.status === 403) {
            toast.error('You do not have permission to perform this action');
            return Promise.reject(error);
        }

        if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
            return Promise.reject(error);
        }

        if (error.code === 'ECONNABORTED') {
            toast.error('Request timeout. Please check your connection.');
            return Promise.reject(error);
        }

        if (!error.response) {
            toast.error('Network error. Please check if the backend is running.');
            return Promise.reject(error);
        }

        // Show specific error message if available (but not for login page)
        if (!window.location.pathname.includes('/login')) {
            const message = error.response?.data?.detail ||
                error.response?.data?.message ||
                error.response?.data?.error ||
                'An error occurred';
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

// Test API connection - 401 is acceptable for protected endpoints
export const testConnection = async () => {
    try {
        const response = await fetch('http://localhost:8000/api/users/', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        // 401, 200, or 403 indicate the server is responding correctly
        if ([200, 401, 403].includes(response.status)) {
            return true;
        }

        return false;
    } catch (error) {
        return false;
    }
};

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/users/login/', credentials),
    register: (userData) => api.post('/users/register/', userData),
    logout: () => api.post('/users/logout/'),
    profile: () => api.get('/users/profile/'),
    updateProfile: (data) => api.put('/users/profile/update/', data),
    changePassword: (data) => api.post('/users/change-password/', data),
};

// Users API
export const usersAPI = {
    list: (params) => api.get('/users/', { params }),
    get: (id) => api.get(`/users/${id}/`),
    create: (data) => api.post('/users/', data),
    update: (id, data) => api.put(`/users/${id}/`, data),
    delete: (id) => api.delete(`/users/${id}/`),
    stats: () => api.get('/users/stats/'),
};

// Surveys API
export const surveysAPI = {
    list: (params) => api.get('/surveys/', { params }),
    get: (id) => api.get(`/surveys/${id}/`),
    create: (data) => api.post('/surveys/', data),
    update: (id, data) => api.put(`/surveys/${id}/`, data),
    delete: (id) => api.delete(`/surveys/${id}/`),
    duplicate: (id) => api.post(`/surveys/${id}/duplicate/`),
    analytics: (id) => api.get(`/surveys/${id}/analytics/`),
    dashboardStats: () => api.get('/surveys/dashboard/stats/'),
};

// Questions API
export const questionsAPI = {
    list: (surveyId) => api.get(`/surveys/${surveyId}/questions/`),
    get: (id) => api.get(`/surveys/questions/${id}/`),
    create: (surveyId, data) => api.post(`/surveys/${surveyId}/questions/`, data),
    update: (id, data) => api.put(`/surveys/questions/${id}/`, data),
    delete: (id) => api.delete(`/surveys/questions/${id}/`),
    bulkCreate: (surveyId, data) => api.post(`/surveys/${surveyId}/questions/bulk/`, data),
};

// Survey Responses API
export const responsesAPI = {
    list: (surveyId, params) => {
        const url = surveyId ? `/surveys/${surveyId}/responses/` : '/surveys/responses/';
        return api.get(url, { params });
    },
    get: (id) => api.get(`/surveys/responses/${id}/`),
    create: (data) => api.post('/surveys/responses/', data),
    update: (id, data) => api.put(`/surveys/responses/${id}/`, data),
    delete: (id) => api.delete(`/surveys/responses/${id}/`),
};

// Utility functions
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    }
};

export const getStoredUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const clearStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export default api;