import { createContext, useContext, useState, useCallback } from 'react';
import { http } from '../services/http';

interface ApiKeyContextType {
  apiKey: string;
  hasKey: boolean;
  maskedKey: string;
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  lastMessage: string | null;
  saveKey: (key: string) => Promise<boolean>;
  removeKey: () => void;
  validateKey: (keyToTest?: string) => Promise<{ valid: boolean; message: string }>;
}

const STORAGE_KEY = 'novadesk:gemini_api_key';

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const hasKey = Boolean(apiKey && apiKey.trim().length > 0);

  const maskedKey = hasKey
    ? `••••${apiKey.trim().slice(-4)}`
    : '';

  const validateKey = useCallback(async (keyToTest?: string): Promise<{ valid: boolean; message: string }> => {
    const key = (keyToTest !== undefined ? keyToTest : apiKey).trim();
    if (!key) {
      return { valid: false, message: 'API key is required.' };
    }

    setStatus('validating');
    try {
      const resp = await http.post<{ valid: boolean; message: string }>('/api/ai/validate-key', {
        api_key: key,
      });
      const data = resp.data || { valid: false, message: 'No response from verification endpoint.' };
      setStatus(data.valid ? 'valid' : 'invalid');
      setLastMessage(data.message);
      return data;
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Verification failed.';
      setStatus('invalid');
      setLastMessage(errMsg);
      return { valid: false, message: errMsg };
    }
  }, [apiKey]);

  const removeKey = useCallback(() => {
    setApiKeyState('');
    setStatus('idle');
    setLastMessage(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const saveKey = useCallback(async (newKey: string): Promise<boolean> => {
    const clean = newKey.trim();
    if (!clean) {
      removeKey();
      return false;
    }

    // Attempt validation
    const result = await validateKey(clean);
    if (result.valid) {
      setApiKeyState(clean);
      localStorage.setItem(STORAGE_KEY, clean);
      return true;
    } else {
      // Save anyway if user insisted, but flag as invalid
      setApiKeyState(clean);
      localStorage.setItem(STORAGE_KEY, clean);
      return false;
    }
  }, [validateKey, removeKey]);

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        hasKey,
        maskedKey,
        status,
        lastMessage,
        saveKey,
        removeKey,
        validateKey,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
