import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { getApiBaseUrl } from '../config/api';
import { LOCAL_MODE_KEY } from '../contexts/AuthContext';

// Create a centralized Axios instance
export const http = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Configure retry logic: 3 retries with exponential backoff for network/5xx errors
axiosRetry(http, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status ? error.response.status >= 500 : false);
  },
});

// Request interceptor: Dynamic Base URL & Automatic JWT Token injection
http.interceptors.request.use(
  async (config) => {
    // Dynamically set the base URL for every request
    config.baseURL = getApiBaseUrl();

    // Check if we are in local development mode (no auth)
    const isLocalMode = localStorage.getItem(LOCAL_MODE_KEY) === 'true';
    if (isLocalMode) {
      return config;
    }

    if (window.electronAPI) {
      const tokens = await window.electronAPI.getTokens();
      // Only inject the token if we don't already have one set
      const hasAuth = config.headers?.Authorization || config.headers?.authorization || (config.headers?.has && config.headers.has('Authorization'));
      if (tokens?.access_token && !hasAuth) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global error handling and Auth failures
http.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle Unauthorized (expired or missing token)
      // Usually AuthContext handles refresh via its restore() mechanism,
      // but if an API call fails with 401, we might need to redirect to login.
      // For now, we clear the tokens to force a re-login on next check.
      if (window.electronAPI) {
        await window.electronAPI.clearTokens();
      }
      
      // Dispatch a custom event to tell AuthContext to reset state
      window.dispatchEvent(new CustomEvent('novadesk:auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);
