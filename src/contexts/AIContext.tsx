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
  const { openFile, currentPath } = useEditor();

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Messages in current view
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const lastUserMessage = useRef<string>('');


  const [agentMode, setAgentMode] = useState<'chat' | 'planner' | 'coding' | 'auto'>('chat');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-r1:1.5b');

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

  // ─── Conversation management ────────────────────────────────────────────

  const createNewConversation = useCallback(async (title = 'New Chat'): Promise<Conversation | null> => {
    if (!accessToken || accessToken === 'local') return null;
    try {
      const convo = await createConversation(title);
      setConversations(prev => [convo, ...prev]);
      setActiveConversation(convo);
      setMessages([]);
      return convo;
    } catch {
      return null;
    }
  }, [accessToken]);

  const selectConversation = useCallback(async (id: number) => {
    const convo = conversations.find(c => c.id === id) ?? null;
    setActiveConversation(convo);
    if (!convo || !accessToken || accessToken === 'local') {
      setMessages([]);
      return;
    }
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
    }
  }, [conversations, accessToken]);

  const removeConversation = useCallback(async (id: number) => {
    if (!accessToken || accessToken === 'local') return;
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch {}
  }, [accessToken, activeConversation]);

  const renameActiveConversation = useCallback(async (id: number, title: string) => {
    if (!accessToken || accessToken === 'local') return;
    try {
      const updated = await renameConversation(id, title);
      setConversations(prev => prev.map(c => c.id === id ? updated : c));
      if (activeConversation?.id === id) setActiveConversation(updated);
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
      // Reuse existing open socket or open a new one
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        wsRef.current = new WebSocket(wsUrl);
      }
      const ws = wsRef.current;
      let assistantId = generateId();
      let streamBuffer = '';

      const handleOpen = () => {
        ws.send(JSON.stringify({
          message: text,
          model_id: selectedModel,
          mode: agentMode,
          conversation_id: targetConversationId,
          context,
        }));
      };

      const handleMessage = (evt: MessageEvent) => {
        try {
          const event = JSON.parse(evt.data as string);
          if (abortRef.current) return;

          if (event.type === 'response.delta') {
            const delta: string = event.delta ?? '';
            streamBuffer += delta;
            setIsThinking(false);
            setIsStreaming(true);
            setStreamingContent(streamBuffer);
            // Upsert the streaming message
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
          } else if (event.type === 'response.completed') {
            const finalContent: string = event.content ?? streamBuffer;
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, content: finalContent, isStreaming: false }
                : m
            ));
            setStreamingContent('');
            setIsStreaming(false);
            setIsThinking(false);

            // Reset for next turn
            assistantId = generateId();
            streamBuffer = '';
          } else if (event.type === 'agent.artifact') {
            const artifactPath = event.path;
            const requestFeedback = event.requestFeedback;
            if (currentPath && artifactPath) {
              openFile(currentPath + "/" + artifactPath);
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

      if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener('open', handleOpen, { once: true });
      } else if (ws.readyState === WebSocket.OPEN) {
        handleOpen();
      } else {
        // Re-create socket
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.addEventListener('open', handleOpen, { once: true });
        wsRef.current.addEventListener('message', handleMessage);
        wsRef.current.addEventListener('error', handleError);
        return;
      }

      ws.addEventListener('message', handleMessage);
      ws.addEventListener('error', handleError, { once: true });
    } else {
      // Local mode
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: 'Local workspace mode is active. Sign in with Google to use NovaDesk Cloud AI.',
          timestamp: Date.now(),
        }]);
        setIsThinking(false);
      }, 600);
    }
  }, [isStreaming, accessToken, agentMode, activeConversation]);

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    setIsThinking(false);
    setStreamingContent('');
    // Mark any streaming message as complete
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setIsThinking(false);
  }, []);

  const regenerate = useCallback(() => {
    if (!lastUserMessage.current) return;
    // Remove last assistant message and resend
    setMessages(prev => {
      const last = [...prev].reverse().find(m => m.role === 'model' || m.role === 'error');
      if (!last) return prev;
      return prev.filter(m => m.id !== last.id);
    });
    sendMessage(lastUserMessage.current);
  }, [sendMessage]);

  return (
    <ChatContext.Provider value={{
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
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(ChatContext);
  if (context === undefined) throw new Error('useAI must be used within an AIProvider');
  return context;
};
