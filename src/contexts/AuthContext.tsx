import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, refreshAccessToken, logoutUser, type AuthSession, type NovaDeskUser } from '../api';

type AuthContextType = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  accessToken: string | null;
  user: NovaDeskUser | null;
  login: (session: AuthSession) => Promise<void>;
  continueLocally: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const LOCAL_MODE_KEY = 'novadesk_local_mode';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<NovaDeskUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        if (!window.electronAPI) {
          // Fallback if not running in electron
          setIsInitializing(false);
          return;
        }

        const tokens = await window.electronAPI.getTokens();
        if (!tokens) {
          if (localStorage.getItem(LOCAL_MODE_KEY) === 'true') {
            setAccessToken('local');
            setUser({ id: 0, email: 'local@novadesk', display_name: 'Local workspace' });
          }
          setIsInitializing(false);
          return;
        }

        try {
          // Attempt to get user with current access token
          const restoredUser = await getCurrentUser(tokens.access_token);
          
          setAccessToken(tokens.access_token);
          setUser(restoredUser);
        } catch {
          // If access token is expired, try to refresh
          if (tokens.refresh_token) {
            try {
              const newSession = await refreshAccessToken(tokens.refresh_token);
              if (newSession.refresh_token) {
                await window.electronAPI.saveTokens({
                  access_token: newSession.access_token,
                  refresh_token: newSession.refresh_token,
                });
              }
              setAccessToken(newSession.access_token);
              setUser(newSession.user);
            } catch {
              await window.electronAPI.clearTokens();
              setAccessToken(null);
            }
          } else {
            await window.electronAPI.clearTokens();
            setAccessToken(null);
          }
        }
      } finally {
        // Ensure initialization flag is cleared even if background tasks are still running
        setIsInitializing(false);
      }
    };
    void restore();
  }, []);

  const login = async (session: AuthSession) => {
    localStorage.removeItem(LOCAL_MODE_KEY);
    if (session.refresh_token && window.electronAPI) {
      await window.electronAPI.saveTokens({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
    setAccessToken(session.access_token);
    setUser(session.user);
  };

  const continueLocally = () => {
    localStorage.setItem(LOCAL_MODE_KEY, 'true');
    setAccessToken('local');
    setUser({ id: 0, email: 'local@novadesk', display_name: 'Local workspace' });
  };

  const logout = async () => {
    if (window.electronAPI) {
      const tokens = await window.electronAPI.getTokens();
      if (tokens?.refresh_token) {
        try {
          await logoutUser(tokens.refresh_token);
        } catch (e) {
          console.error("Logout failed", e);
        }
      }
      await window.electronAPI.clearTokens();
    }
    localStorage.removeItem(LOCAL_MODE_KEY);
    setAccessToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem(LOCAL_MODE_KEY);
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener('novadesk:auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('novadesk:auth:unauthorized', handleUnauthorized);
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: Boolean(accessToken),
      isInitializing,
      accessToken,
      user,
      login,
      continueLocally,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
