import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '8000';

const normalizeBaseUrl = (url) => `${url.replace(/\/+$/, '')}/`;

const getApiBaseUrl = () => {
    const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (envUrl) {
        return normalizeBaseUrl(envUrl);
    }

    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.hostUri;
    const host = hostUri?.split(':')?.[0];

    if (host) {
        return `http://${host}:${API_PORT}/api/`;
    }

    if (Platform.OS === 'android') {
        return `http://10.0.2.2:${API_PORT}/api/`;
    }

    return `http://127.0.0.1:${API_PORT}/api/`;
};

const API_BASE_URL = getApiBaseUrl();

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let logoutCallback = null;

export const setLogoutCallback = (callback) => {
    logoutCallback = callback;
};

const handleLogout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    if (logoutCallback) {
        logoutCallback();
    }
};

const isAuthUrl = (url) => {
    return url && (url.includes('token/') || url.includes('token/refresh/'));
};

client.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthUrl(originalRequest.url)) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token');

                const refreshResponse = await axios.post(`${API_BASE_URL}token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = refreshResponse.data;
                await AsyncStorage.setItem('access_token', access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return client(originalRequest);
            } catch (refreshError) {
                await handleLogout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default client;
