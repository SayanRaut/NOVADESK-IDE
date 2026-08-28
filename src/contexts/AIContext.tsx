import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Conversation } from '../api';
import {
  chatSocketUrl,
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  renameConversation,
} from '../api';
import { useAuth } from './AuthContext';
import { useEditor } from './EditorContext';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'model' | 'system' | 'error';

export type UIMessage = {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
  timestamp: number;
  artifact?: {
    path: string;
    requestFeedback: boolean;
  };
};

export type AIConnection = {
  provider: 'novadesk' | 'openai-compatible';
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
};

type ChatContextType = {
  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  createNewConversation: (title?: string) => Promise<Conversation | null>;
  selectConversation: (id: number) => Promise<void>;
  removeConversation: (id: number) => Promise<void>;
  renameActiveConversation: (id: number, title: string) => Promise<void>;

  // Messages
  messages: UIMessage[];
  setMessages: Dispatch<SetStateAction<UIMessage[]>>;
  streamingContent: string;

  // State
  isStreaming: boolean;
  isThinking: boolean;
  setIsThinking: (v: boolean) => void;
  isLoadingHistory: boolean;

  agentMode: 'chat' | 'planner' | 'coding' | 'auto';
  setAgentMode: (mode: 'chat' | 'planner' | 'coding' | 'auto') => void;
  activeAgent: string | null;
  setActiveAgent: (agent: string | null) => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Actions
  sendMessage: (text: string, context?: Record<string, unknown>) => void;
  stopStreaming: () => void;
  clearMessages: () => void;
  regenerate: () => void;

  // WebSocket / connection
  wsRef: MutableRefObject<WebSocket | null>;
  connection: AIConnection;
  refreshConnection: () => Promise<void>;
};

// ─── Context ────────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAuth();
  const { openFile, currentPath, refreshWorkspace } = useEditor();

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Messages in current view
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const lastUserMessage = useRef<string>('');

  const [agentMode, setAgentMode] = useState<'chat' | 'planner' | 'coding' | 'auto'>('chat');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('qwen3.5:4b');

  // connection
  const [connection, setConnection] = useState<AIConnection>({
    provider: 'novadesk',
    baseUrl: '',
    model: '',
    hasApiKey: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const abortRef = useRef(false);
  const messageListenerRef = useRef<((evt: MessageEvent) => void) | null>(null);
  const errorListenerRef = useRef<((evt: Event) => void) | null>(null);

  // ─── Load conversations ─────────────────────────────────────────────────

  useEffect(() => {
    if (!accessToken || accessToken === 'local') return;
    listConversations()
      .then(setConversations)
      .catch(() => {});
  }, [accessToken]);

  // ─── Electron AI connection ─────────────────────────────────────────────

  const refreshConnection = useCallback(async () => {
    if (!window.electronAPI) return;
    const next = await window.electronAPI.getAIConnection();
    setConnection(next);
  }, []);

  useEffect(() => { void refreshConnection().catch(() => undefined); }, [refreshConnection]);

  // ─── Conversation management (Optimistic & Lag-Free) ────────────────────

  const createNewConversation = useCallback(async (title = 'New Chat'): Promise<Conversation | null> => {
    // 1. Immediate optimistic creation (0ms UI lag)
    const optimisticId = Date.now();
    const optimisticConvo: Conversation = {
      id: optimisticId,
      project_id: 1,
      title: title,
      current_agent: 'chat',
      created_at: new Date().toISOString(),
    };
    setConversations(prev => [optimisticConvo, ...prev]);
    setActiveConversation(optimisticConvo);
    setMessages([]);
    setIsThinking(false);
    setIsStreaming(false);

    if (!accessToken || accessToken === 'local') return optimisticConvo;

    // 2. Background server sync
    try {
      const serverConvo = await createConversation(title);
      setConversations(prev => prev.map(c => c.id === optimisticId ? serverConvo : c));
      setActiveConversation(prev => prev?.id === optimisticId ? serverConvo : prev);
      return serverConvo;
    } catch {
      return optimisticConvo;
    }
  }, [accessToken]);

  const selectConversation = useCallback(async (id: number) => {
    const convo = conversations.find(c => c.id === id) ?? null;
    setActiveConversation(convo);
    setMessages([]); // Clear messages immediately (0ms lag)
    if (!convo || !accessToken || accessToken === 'local') {
      return;
    }
    setIsLoadingHistory(true);
    try {
      const msgs = await getConversationMessages(id);
      setMessages(msgs.map(m => ({
        id: generateId(),
        role: m.role as MessageRole,
        content: m.content,
        timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
      })));
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversations, accessToken]);

  const removeConversation = useCallback(async (id: number) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
      setMessages([]);
    }
    if (!accessToken || accessToken === 'local') return;
    try {
      await deleteConversation(id);
    } catch {}
  }, [accessToken, activeConversation]);

  const renameActiveConversation = useCallback(async (id: number, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    if (activeConversation?.id === id) setActiveConversation(prev => prev ? { ...prev, title } : null);
    if (!accessToken || accessToken === 'local') return;
    try {
      await renameConversation(id, title);
    } catch {}
  }, [accessToken, activeConversation]);

  // ─── Messaging ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string, context: Record<string, unknown> = {}) => {
    if (!text.trim() || isStreaming) return;
    lastUserMessage.current = text;

    let targetConversationId = activeConversation?.id ?? null;

    // Auto-create a conversation if none is active
    if (!targetConversationId && accessToken && accessToken !== 'local') {
      try {
        const convo = await createConversation('New Chat');
        setConversations(prev => [convo, ...prev]);
        setActiveConversation(convo);
        targetConversationId = convo.id;
      } catch {
        console.error("Failed to auto-create conversation");
      }
    }

    const userMsg: UIMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setIsStreaming(false);
    setStreamingContent('');
    abortRef.current = false;

    // Use WebSocket if available and token is real
    if (accessToken && accessToken !== 'local') {
      const wsUrl = chatSocketUrl(accessToken);
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
        wsRef.current = new WebSocket(wsUrl);
      }
      const ws = wsRef.current;
      const assistantId = generateId();
      let streamBuffer = '';
      let lastRender = 0;

      const flushRender = () => {
        setStreamingContent(streamBuffer);
        setMessages(prev => {
          const exists = prev.find(m => m.id === assistantId);
          if (exists) {
            return prev.map(m => m.id === assistantId
              ? { ...m, content: streamBuffer, isStreaming: true }
              : m
            );
          }
          return [...prev, {
            id: assistantId,
            role: 'model',
            content: streamBuffer,
            isStreaming: true,
            timestamp: Date.now(),
          }];
        });
      };

      const sendPayload = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            message: text,
            model_id: selectedModel,
            mode: agentMode,
            conversation_id: targetConversationId,
            context: {
              ...context,
              workspace_root: currentPath || '',
            },
          }));
        }
      };

      if (ws.readyState === WebSocket.OPEN) {
        sendPayload();
      } else {
        ws.onopen = () => sendPayload();
      }

      const handleMessage = (evt: MessageEvent) => {
        try {
          const event = JSON.parse(evt.data as string);
          if (abortRef.current) return;

          if (event.type === 'response.delta') {
            const delta: string = event.delta ?? '';
            streamBuffer += delta;
            setIsThinking(false);
            setIsStreaming(true);

            // Throttle UI re-renders to 40ms to eliminate typing stutter/lag
            const now = Date.now();
            if (now - lastRender > 40) {
              lastRender = now;
              flushRender();
            }
          } else if (event.type === 'response.completed') {
            flushRender();
            const finalContent: string = event.content ?? streamBuffer;
            
            // Auto-extract any code blocks with file definitions and save locally
            if (currentPath && window.electronAPI) {
              const filePattern = /(?:(?:###|\/\/|#)\s*File:\s*|File:\s*)([^\r\n]+)\r?\n+```[a-zA-Z0-9_\-\.]*\r?\n([\s\S]*?)```/gi;
              let match;
              let createdAny = false;
              while ((match = filePattern.exec(finalContent)) !== null) {
                const rel = match[1].trim().replace(/^[\\/]/, '');
                const code = match[2];
                const fp = `${currentPath.replace(/[\\/]$/, '')}/${rel}`;
                void window.electronAPI.writeFile(fp, code).then(() => {
                  refreshWorkspace();
                  openFile(fp);
                }).catch(() => {});
                createdAny = true;
              }
              if (createdAny) refreshWorkspace();
            }

            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, content: finalContent, isStreaming: false }
                : m
            ));
            setStreamingContent('');
            setIsStreaming(false);
            setIsThinking(false);
          } else if (event.type === 'agent.artifact') {
            const artifactPath = event.path;
            const requestFeedback = event.requestFeedback;
            
            if (currentPath && artifactPath) {
              const fullPath = `${currentPath.replace(/[\\/]$/, '')}/${artifactPath.replace(/^[\\/]/, '')}`;
              if (event.content && window.electronAPI) {
                void window.electronAPI.writeFile(fullPath, event.content).then(() => {
                  refreshWorkspace();
                  openFile(fullPath);
                }).catch(e => console.error("Failed to write artifact locally:", e));
              }
            }
            
            setMessages(prev => {
              const exists = prev.find(m => m.id === assistantId);
              if (exists) {
                return prev.map(m => m.id === assistantId
                  ? { ...m, artifact: { path: artifactPath, requestFeedback } }
                  : m
                );
              }
              return [...prev, {
                id: assistantId,
                role: 'model',
                content: streamBuffer,
                isStreaming: true,
                timestamp: Date.now(),
                artifact: { path: artifactPath, requestFeedback }
              }];
            });
          } else if (event.type === 'agent.thinking') {
            setActiveAgent(event.agent ?? null);
          } else if (event.type === 'conversation.renamed') {
            const { conversation_id, title } = event;
            setConversations(prev => prev.map(c => c.id === conversation_id ? { ...c, title } : c));
            setActiveConversation(prev => (prev && prev.id === conversation_id) ? { ...prev, title } as Conversation : prev);
          } else if (event.type === 'error') {
            const errMsg = event.message ?? 'An AI error occurred.';
            setMessages(prev => [...prev, {
              id: generateId(),
              role: 'error',
              content: errMsg,
              timestamp: Date.now(),
            }]);
            setIsStreaming(false);
            setIsThinking(false);
          }
        } catch {}
      };

      const handleError = () => {
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'error',
          content: '⚠ Connection to the AI service failed. Make sure the backend is running.',
          timestamp: Date.now(),
        }]);
        setIsStreaming(false);
        setIsThinking(false);
      };

      if (messageListenerRef.current) {
        ws.removeEventListener('message', messageListenerRef.current);
      }
      if (errorListenerRef.current) {
        ws.removeEventListener('error', errorListenerRef.current);
      }
      messageListenerRef.current = handleMessage;
      errorListenerRef.current = handleError;
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('error', handleError);
    }
  }, [
    activeConversation,
    accessToken,
    selectedModel,
    agentMode,
    currentPath,
    openFile,
    refreshWorkspace,
    isStreaming,
  ]);

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cancel' }));
    }
    setIsStreaming(false);
    setIsThinking(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setIsThinking(false);
  }, []);

  const regenerate = useCallback(() => {
    if (!lastUserMessage.current) return;
    setMessages(prev => {
      let lastUserIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'user') { lastUserIdx = i; break; }
      }
      return lastUserIdx >= 0 ? prev.slice(0, lastUserIdx) : prev;
    });
    void sendMessage(lastUserMessage.current);
  }, [sendMessage]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        createNewConversation,
        selectConversation,
        removeConversation,
        renameActiveConversation,
        messages,
        setMessages,
        streamingContent,
        isStreaming,
        isThinking,
        setIsThinking,
        isLoadingHistory,
        agentMode,
        setAgentMode,
        activeAgent,
        setActiveAgent,
        selectedModel,
        setSelectedModel,
        sendMessage,
        stopStreaming,
        clearMessages,
        regenerate,
        wsRef,
        connection,
        refreshConnection,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useAI must be used within an AIProvider');
  return context;
};
