// src/config/api.ts

// Default API URL from environment or hardcoded local dev URL
export const DEFAULT_API_BASE_URL = import.meta.env.VITE_NOVADESK_API_URL ?? 'https://novadesk-ide.onrender.com';

let currentApiBaseUrl = DEFAULT_API_BASE_URL;

/**
 * Initializes the API base URL from secure electron storage.
 * Should be called early during application startup.
 */
export const initApiConfig = async () => {
  if (window.electronAPI) {
    const config = await window.electronAPI.getApiConfig();
    if (config?.baseUrl) {
      let loadedUrl = config.baseUrl.replace(/\/+$/, '');
      if (loadedUrl.includes('trycloudflare.com') || loadedUrl.includes('localhost:8000')) {
        loadedUrl = 'https://novadesk-ide.onrender.com';
      }
      currentApiBaseUrl = loadedUrl;
    }
  }
};

/**
 * Gets the current API base URL.
 */
export const getApiBaseUrl = () => currentApiBaseUrl;

/**
 * Sets the API base URL for the current session and saves it securely.
 */
export const setApiBaseUrl = async (url: string) => {
  // Strip any trailing slashes
  let cleanUrl = url.replace(/\/+$/, '');
  
  // Prevent common user misconfigurations where they paste the Ollama tunnel URL
  if (cleanUrl.includes('trycloudflare.com') || cleanUrl.includes('localhost:8000')) {
    console.error('CRITICAL: Cannot set backend URL to a cloudflare tunnel or localhost:8000. Forcing Render URL.');
    cleanUrl = 'https://novadesk-ide.onrender.com';
  }
  
  currentApiBaseUrl = cleanUrl;
  if (window.electronAPI) {
    await window.electronAPI.saveApiConfig({ baseUrl: cleanUrl });
  }
};
