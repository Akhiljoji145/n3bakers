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

client.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (__DEV__) {
            console.error('API request failed', {
                baseURL: error.config?.baseURL,
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
        }
        return Promise.reject(error);
    }
);

export default client;
