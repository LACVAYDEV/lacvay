import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { SavedPlace, SearchHistoryItem, SavedItemType, AIMessage, ChatSession } from '@/types';
import { generateId } from '@/lib/utils';
import { sendAIMessage, AI_SUGGESTIONS } from '@/services/aiService';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { updateUserMetadata } from '@/lib/userMetadata';

interface AppContextValue {
  savedPlaces: SavedPlace[];
  history: SearchHistoryItem[];
  aiMessages: AIMessage[];
  aiLoading: boolean;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
  toast: string | null;
  saveItem: (item: Omit<SavedPlace, 'id' | 'savedAt'>) => void;
  removeSaved: (id: string) => void;
  isSaved: (itemId: string) => boolean;
  addHistory: (item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  historySyncEnabled: boolean;
  setHistorySyncEnabled: (enabled: boolean) => Promise<void>;
  sendAI: (message: string) => Promise<void>;
  showToast: (message: string) => void;
  aiSuggestions: string[];
  selectSession: (sessionId: string) => Promise<void>;
  createSession: (title?: string) => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVED_KEY = 'lacvay-saved';
const HISTORY_KEY = 'lacvay-history';
const GUEST_SESSIONS_KEY = 'lacvay-guest-chat-sessions';
const GUEST_MESSAGES_KEY_PREFIX = 'lacvay-guest-chat-msg-';
const HISTORY_METADATA_KEY = 'search_history';
const HISTORY_SYNC_METADATA_KEY = 'history_sync_enabled';

function getHistoryStorageKey(userId?: string): string {
  return userId ? `${HISTORY_KEY}-${userId}` : HISTORY_KEY;
}

function readAccountHistory(value: unknown): SearchHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SearchHistoryItem => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<SearchHistoryItem>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.query === 'string' &&
      typeof candidate.type === 'string' &&
      typeof candidate.timestamp === 'string'
    );
  }).slice(0, 50);
}

const WELCOME_MESSAGE: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Magandang araw! I'm **LACVAY AI**, your friendly Batangas City travel buddy 👋\n\nI can help you with:\n* **Jeepney, tricycle, & taxi routes**\n* **Accurate local fare estimates**\n* **Top beaches, mountains, & historical spots**\n* **Lomi houses & authentic Batangas dining**\n\nWhere would you like to explore today?",
  timestamp: new Date().toISOString(),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [historySyncEnabled, setHistorySyncEnabledState] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([WELCOME_MESSAGE]);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Load saved places from localStorage.
  useEffect(() => {
    try {
      setSavedPlaces(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const storageKey = getHistoryStorageKey(user?.id);
    let localHistory: SearchHistoryItem[] = [];
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        localHistory = readAccountHistory(JSON.parse(stored));
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    const enabled = user?.user_metadata?.[HISTORY_SYNC_METADATA_KEY] === true;
    setHistorySyncEnabledState(enabled);
    if (enabled) {
      const accountHistory = readAccountHistory(user?.user_metadata?.[HISTORY_METADATA_KEY]);
      const merged = [...accountHistory, ...localHistory]
        .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(0, 50);
      localStorage.setItem(storageKey, JSON.stringify(merged));
      setHistory(merged);
    } else {
      setHistory(localHistory);
    }
  }, [user?.id, user?.user_metadata]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Initialize or reload chat sessions when user state changes
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      if (user) {
        // Authenticated user: Load sessions from Supabase
        try {
          const sessions = await chatService.getSessions(user.id);
          if (!isMounted) return;

          if (sessions.length > 0) {
            setChatSessions(sessions);
            const firstSession = sessions[0];
            setActiveSessionId(firstSession.id);

            // Load messages for the most recent session
            const msgs = await chatService.getMessages(firstSession.id);
            if (!isMounted) return;

            if (msgs.length > 0) {
              setAiMessages(
                msgs.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.created_at || new Date().toISOString(),
                })),
              );
            } else {
              setAiMessages([WELCOME_MESSAGE]);
            }
          } else {
            // Create first session for new user
            const newSession = await chatService.createSession(user.id, 'New Conversation');
            if (!isMounted) return;

            setChatSessions([newSession]);
            setActiveSessionId(newSession.id);

            // Seed initial welcome message in database
            await chatService.saveMessage(newSession.id, 'assistant', WELCOME_MESSAGE.content);
            if (!isMounted) return;
            setAiMessages([WELCOME_MESSAGE]);
          }
        } catch (err) {
          console.error('Error loading Supabase chat sessions:', err);
        }
      } else {
        // Guest user: Load sessions from localStorage
        try {
          const stored = localStorage.getItem(GUEST_SESSIONS_KEY);
          if (stored) {
            const sessions: ChatSession[] = JSON.parse(stored);
            if (sessions.length > 0) {
              setChatSessions(sessions);
              setActiveSessionId(sessions[0].id);

              const storedMsgs = localStorage.getItem(GUEST_MESSAGES_KEY_PREFIX + sessions[0].id);
              if (storedMsgs) {
                setAiMessages(JSON.parse(storedMsgs));
                return;
              }
            }
          }

          // Default guest session
          const guestSession: ChatSession = {
            id: 'guest-session-1',
            user_id: 'guest',
            title: 'New Conversation',
            created_at: new Date().toISOString(),
          };
          setChatSessions([guestSession]);
          setActiveSessionId(guestSession.id);
          setAiMessages([WELCOME_MESSAGE]);
          localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify([guestSession]));
          localStorage.setItem(
            GUEST_MESSAGES_KEY_PREFIX + guestSession.id,
            JSON.stringify([WELCOME_MESSAGE]),
          );
        } catch {
          setAiMessages([WELCOME_MESSAGE]);
        }
      }
    }

    void initChat();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Select and load a chat session
  const selectSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      if (user) {
        try {
          const msgs = await chatService.getMessages(sessionId);
          if (msgs.length > 0) {
            setAiMessages(
              msgs.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.created_at || new Date().toISOString(),
              })),
            );
          } else {
            setAiMessages([WELCOME_MESSAGE]);
          }
        } catch (err) {
          console.error('Failed to load session messages:', err);
        }
      } else {
        const stored = localStorage.getItem(GUEST_MESSAGES_KEY_PREFIX + sessionId);
        if (stored) {
          setAiMessages(JSON.parse(stored));
        } else {
          setAiMessages([WELCOME_MESSAGE]);
        }
      }
    },
    [user],
  );

  // Create a new chat session
  const createSession = useCallback(
    async (title = 'New Conversation') => {
      if (user) {
        try {
          const newSession = await chatService.createSession(user.id, title);
          setChatSessions((prev) => [newSession, ...prev]);
          setActiveSessionId(newSession.id);
          setAiMessages([WELCOME_MESSAGE]);
          await chatService.saveMessage(newSession.id, 'assistant', WELCOME_MESSAGE.content);
          return newSession.id;
        } catch (err) {
          console.error('Failed to create session in Supabase:', err);
          throw err;
        }
      } else {
        const newId = 'guest-session-' + Date.now();
        const guestSession: ChatSession = {
          id: newId,
          user_id: 'guest',
          title,
          created_at: new Date().toISOString(),
        };
        const next = [guestSession, ...chatSessions];
        setChatSessions(next);
        setActiveSessionId(newId);
        setAiMessages([WELCOME_MESSAGE]);
        localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(next));
        localStorage.setItem(GUEST_MESSAGES_KEY_PREFIX + newId, JSON.stringify([WELCOME_MESSAGE]));
        return newId;
      }
    },
    [user, chatSessions],
  );

  // Delete a chat session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (user) {
        try {
          await chatService.deleteSession(sessionId);
        } catch (err) {
          console.error('Failed to delete session:', err);
        }
      } else {
        localStorage.removeItem(GUEST_MESSAGES_KEY_PREFIX + sessionId);
      }

      const nextSessions = chatSessions.filter((s) => s.id !== sessionId);
      setChatSessions(nextSessions);
      if (!user) {
        localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(nextSessions));
      }

      if (activeSessionId === sessionId) {
        if (nextSessions.length > 0) {
          await selectSession(nextSessions[0].id);
        } else {
          await createSession();
        }
      }
      showToast('Conversation deleted');
    },
    [user, chatSessions, activeSessionId, selectSession, createSession, showToast],
  );

  const saveItem = useCallback(
    (item: Omit<SavedPlace, 'id' | 'savedAt'>) => {
      setSavedPlaces((prev) => {
        if (prev.some((p) => p.itemId === item.itemId)) {
          showToast('Already saved');
          return prev;
        }
        const next = [{ ...item, id: generateId(), savedAt: new Date().toISOString() }, ...prev];
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
        showToast('Saved successfully');
        return next;
      });
    },
    [showToast],
  );

  const removeSaved = useCallback(
    (id: string) => {
      setSavedPlaces((prev) => {
        const next = prev.filter((p) => p.id !== id);
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
        showToast('Removed from saved');
        return next;
      });
    },
    [showToast],
  );

  const isSaved = useCallback(
    (itemId: string) => savedPlaces.some((p) => p.itemId === itemId),
    [savedPlaces],
  );

  const addHistory = useCallback((item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    setHistory((prev) => {
      const next = [{ ...item, id: generateId(), timestamp: new Date().toISOString() }, ...prev].slice(0, 50);
      localStorage.setItem(getHistoryStorageKey(user?.id), JSON.stringify(next));
      if (historySyncEnabled && user) {
        void updateUserMetadata({ [HISTORY_METADATA_KEY]: next }).catch(() => {
          showToast('History was saved on this device, but account sync failed.');
        });
      }
      return next;
    });
  }, [historySyncEnabled, showToast, user]);

  const persistHistory = useCallback((next: SearchHistoryItem[]) => {
    setHistory(next);
    localStorage.setItem(getHistoryStorageKey(user?.id), JSON.stringify(next));
    if (historySyncEnabled && user) {
      void updateUserMetadata({ [HISTORY_METADATA_KEY]: next }).catch(() => {
        showToast('History changed on this device, but account sync failed.');
      });
    }
  }, [historySyncEnabled, showToast, user]);

  const removeHistory = useCallback((id: string) => {
    persistHistory(history.filter((item) => item.id !== id));
  }, [history, persistHistory]);

  const clearHistory = useCallback(() => {
    persistHistory([]);
  }, [persistHistory]);

  const setHistorySyncEnabled = useCallback(async (enabled: boolean) => {
    if (!user) {
      throw new Error('Sign in to sync history with your account.');
    }
    const nextHistory = enabled
      ? [...readAccountHistory(user.user_metadata?.[HISTORY_METADATA_KEY]), ...history]
          .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
          .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
          .slice(0, 50)
      : history;
    await updateUserMetadata({
      [HISTORY_SYNC_METADATA_KEY]: enabled,
      [HISTORY_METADATA_KEY]: nextHistory,
    });
    setHistorySyncEnabledState(enabled);
    if (enabled) {
      setHistory(nextHistory);
      localStorage.setItem(getHistoryStorageKey(user.id), JSON.stringify(nextHistory));
    }
  }, [history, user]);

  // Send AI Message with automatic persistence
  const sendAI = useCallback(
    async (message: string) => {
      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        currentSessionId = await createSession();
      }

      const userMsg: AIMessage = {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      // 1. Optimistic UI update
      setAiMessages((prev) => {
        const next = [...prev, userMsg];
        if (!user && currentSessionId) {
          localStorage.setItem(GUEST_MESSAGES_KEY_PREFIX + currentSessionId, JSON.stringify(next));
        }
        return next;
      });
      setAiLoading(true);

      // 2. Persist user message to Supabase
      if (user && currentSessionId) {
        void chatService.saveMessage(currentSessionId, 'user', message).catch((err) => {
          console.error('Failed to save user message in Supabase:', err);
        });

        // If session still has default title, rename to user prompt
        const active = chatSessions.find((s) => s.id === currentSessionId);
        if (active && (active.title === 'New Conversation' || !active.title)) {
          const autoTitle = message.length > 32 ? message.slice(0, 32).trim() + '...' : message;
          void chatService.updateSessionTitle(currentSessionId, autoTitle);
          setChatSessions((prev) =>
            prev.map((s) => (s.id === currentSessionId ? { ...s, title: autoTitle } : s)),
          );
        }
      }

      // 3. Call backend Gemini AI
      try {
        const reply = await sendAIMessage(message);

        // 4. Update UI with reply
        setAiMessages((prev) => {
          const next = [...prev, reply];
          if (!user && currentSessionId) {
            localStorage.setItem(
              GUEST_MESSAGES_KEY_PREFIX + currentSessionId,
              JSON.stringify(next),
            );
          }
          return next;
        });

        // 5. Persist assistant reply to Supabase
        if (user && currentSessionId) {
          void chatService.saveMessage(currentSessionId, 'assistant', reply.content).catch((err) => {
            console.error('Failed to save assistant message in Supabase:', err);
          });
        }

        addHistory({ query: message, type: 'search', meta: 'AI Assistant' });
      } catch (err) {
        console.error('Failed to get AI reply:', err);
        showToast('Could not reach LACVAY AI. Please try again.');
      } finally {
        setAiLoading(false);
      }
    },
    [activeSessionId, createSession, user, chatSessions, addHistory, showToast],
  );

  return (
    <AppContext.Provider
      value={{
        savedPlaces,
        history,
        aiMessages,
        aiLoading,
        chatSessions,
        activeSessionId,
        toast,
        saveItem,
        removeSaved,
        isSaved,
        addHistory,
        removeHistory,
        clearHistory,
        historySyncEnabled,
        setHistorySyncEnabled,
        sendAI,
        showToast,
        aiSuggestions: AI_SUGGESTIONS,
        selectSession,
        createSession,
        deleteSession,
      }}
    >
      {children}
      {toast && (
        <div className="toast-in fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-lacvay-green-dark px-5 py-2.5 text-sm font-medium text-white shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { SavedItemType };
