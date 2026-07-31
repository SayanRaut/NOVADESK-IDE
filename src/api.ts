export type NovaDeskUser = {
  id: number;
  email: string;
  display_name: string;
  avatar?: string | null;
};

export type AuthSession = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: NovaDeskUser;
};

export type ChatMessage = {
  id: number;
  conversation_id: number;
  role: 'user' | 'model';
  content: string;
  is_pinned?: boolean;
  created_at?: string;
};

export type Conversation = {
  id: number;
  project_id: number;
  title: string;
  current_agent: string;
  summary?: string | null;
  created_at?: string;
};



import { http } from './services/http';
import { getApiBaseUrl } from './config/api';

const extractData = async <T>(promise: Promise<import('axios').AxiosResponse<T>>): Promise<T> => {
  try {
    const response = await promise;
    return response.data;
  } catch (error: any) {
    let detail = `The NovaDesk service returned an unexpected error.`;
    if (error.config?.url) {
      detail += ` (${error.config.method?.toUpperCase()} ${error.config.url})`;
    }
    if (error.response?.data) {
      if (typeof error.response.data.detail === 'string') {
        detail = error.response.data.detail;
      } else if (typeof error.response.data.message === 'string') {
        detail = error.response.data.message;
      }
    } else {
      detail += ` - ${error.message}`;
    }
    throw new Error(detail);
  }
};

// ─── Auth ──────────────────────────────────────────────────────────────────

export const loginWithEmail = async (email: string, password: string): Promise<AuthSession> => {
  return extractData(http.post<AuthSession>('/api/auth/login', { email, password }));
};

export const registerWithEmail = async (name: string, email: string, password: string): Promise<AuthSession> => {
  return extractData(http.post<AuthSession>('/api/auth/register', { display_name: name, email, password }));
};

export const getCurrentUser = async (token: string): Promise<NovaDeskUser> => {
  // We still allow passing token, but http.ts injects it automatically
  // For explicitly passing it (e.g. restore session):
  return extractData(http.get<NovaDeskUser>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  }));
};

export const refreshAccessToken = async (refreshToken: string): Promise<AuthSession> => {
  // We bypass the interceptor's token for refresh if needed, but it's fine
  return extractData(http.post<AuthSession>('/api/auth/refresh', { refresh_token: refreshToken }));
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
  await extractData(http.post('/api/auth/logout', { refresh_token: refreshToken }));
};



// ─── Conversations ─────────────────────────────────────────────────────────

export const listConversations = async (): Promise<Conversation[]> => {
  return extractData(http.get<Conversation[]>('/api/chat/conversations'));
};

export const createConversation = async (
  title: string,
): Promise<Conversation> => {
  return extractData(http.post<Conversation>('/api/chat/conversations', { title }));
};

export const renameConversation = async (
  conversationId: number,
  title: string,
): Promise<Conversation> => {
  return extractData(http.patch<Conversation>(`/api/chat/conversations/${conversationId}/rename`, { title }));
};

export const deleteConversation = async (conversationId: number): Promise<void> => {
  await extractData(http.delete(`/api/chat/conversations/${conversationId}`));
};

export const getConversationMessages = async (
  conversationId: number,
): Promise<ChatMessage[]> => {
  return extractData(http.get<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`));
};

// ─── WebSocket ─────────────────────────────────────────────────────────────

export const chatSocketUrl = (token: string) => {
  const wsOrigin = getApiBaseUrl().replace(/^http/, 'ws');
  return `${wsOrigin}/ws/chat?token=${encodeURIComponent(token)}`;
};
