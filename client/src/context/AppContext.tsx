import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { SavedPlace, SearchHistoryItem, AIMessage, ChatSession } from '@/types';
import { generateId } from '@/lib/utils';
import { sendAIMessage, AI_SUGGESTIONS } from '@/services/aiService';

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
  clearAIMessages: () => void;
  showToast: (message: string) => void;
  aiSuggestions: string[];
  selectSession: (sessionId: string) => Promise<void>;
  createSession: (title?: string) => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVED_KEY = 'lacvay-saved';

const WELCOME_MESSAGE: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Magandang araw! I'm **LACVAY AI**, your friendly Batangas City travel buddy 👋\n\nI can help you with:\n* **Jeepney, tricycle, & taxi routes**\n* **Accurate local fare estimates**\n* **Top beaches, mountains, & historical spots**\n* **Lomi houses & authentic Batangas dining**\n\nWhere would you like to explore today?",
  timestamp: new Date().toISOString(),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
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

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const saveItem = useCallback(
    (item: Omit<SavedPlace, 'id' | 'savedAt'>) => {
      const exists = savedPlaces.some((p) => p.itemId === item.itemId);
      if (exists) {
        showToast('Already in saved');
        return;
      }
      const newItem: SavedPlace = {
        ...item,
        id: generateId(),
        savedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...savedPlaces];
      setSavedPlaces(updated);
      localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
      showToast('Saved to your collection');
    },
    [savedPlaces, showToast],
  );

  const removeSaved = useCallback(
    (id: string) => {
      const updated = savedPlaces.filter((p) => p.id !== id);
      setSavedPlaces(updated);
      localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
      showToast('Removed from saved');
    },
    [savedPlaces, showToast],
  );

  const isSaved = useCallback(
    (itemId: string) => savedPlaces.some((p) => p.itemId === itemId),
    [savedPlaces],
  );

  // Ephemeral in-memory AI chat handler
  const sendAI = useCallback(
    async (message: string) => {
      const userMsg: AIMessage = {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setAiMessages((prev) => [...prev, userMsg]);
      setAiLoading(true);

      try {
        const reply = await sendAIMessage(message);
        setAiMessages((prev) => [...prev, reply]);
      } catch (err) {
        console.error('Failed to get AI reply:', err);
        showToast('Could not reach LACVAY AI. Please try again.');
      } finally {
        setAiLoading(false);
      }
    },
    [showToast],
  );

  const clearAIMessages = useCallback(() => {
    setAiMessages([
      {
        ...WELCOME_MESSAGE,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // Safe stubs for deprecated history and sessions
  const addHistory = useCallback(() => {}, []);
  const removeHistory = useCallback(() => {}, []);
  const clearHistory = useCallback(() => {}, []);
  const setHistorySyncEnabled = useCallback(async () => {}, []);
  const selectSession = useCallback(async () => {}, []);
  const createSession = useCallback(async () => generateId(), []);
  const deleteSession = useCallback(async () => {}, []);

  return (
    <AppContext.Provider
      value={{
        savedPlaces,
        history: [],
        aiMessages,
        aiLoading,
        chatSessions: [],
        activeSessionId: null,
        toast,
        saveItem,
        removeSaved,
        isSaved,
        addHistory,
        removeHistory,
        clearHistory,
        historySyncEnabled: false,
        setHistorySyncEnabled,
        sendAI,
        clearAIMessages,
        showToast,
        aiSuggestions: AI_SUGGESTIONS,
        selectSession,
        createSession,
        deleteSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
