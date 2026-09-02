import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { SavedPlace, SearchHistoryItem, SavedItemType, AIMessage } from '@/types';
import { generateId } from '@/lib/utils';
import { sendAIMessage, AI_SUGGESTIONS } from '@/services/aiService';

interface AppContextValue {
  savedPlaces: SavedPlace[];
  history: SearchHistoryItem[];
  aiMessages: AIMessage[];
  aiLoading: boolean;
  toast: string | null;
  saveItem: (item: Omit<SavedPlace, 'id' | 'savedAt'>) => void;
  removeSaved: (id: string) => void;
  isSaved: (itemId: string) => boolean;
  addHistory: (item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => void;
  sendAI: (message: string) => Promise<void>;
  showToast: (message: string) => void;
  aiSuggestions: string[];
}

const AppContext = createContext<AppContextValue | null>(null);

const SAVED_KEY = 'lacvay-saved';
const HISTORY_KEY = 'lacvay-history';

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm LACVAY AI 👋\n\nI can help you find routes, check fares, recommend places, and more!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSavedPlaces(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
    } catch {
      /* ignore */
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const saveItem = useCallback((item: Omit<SavedPlace, 'id' | 'savedAt'>) => {
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
  }, [showToast]);

  const removeSaved = useCallback((id: string) => {
    setSavedPlaces((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      showToast('Removed from saved');
      return next;
    });
  }, [showToast]);

  const isSaved = useCallback(
    (itemId: string) => savedPlaces.some((p) => p.itemId === itemId),
    [savedPlaces],
  );

  const addHistory = useCallback((item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    setHistory((prev) => {
      const next = [{ ...item, id: generateId(), timestamp: new Date().toISOString() }, ...prev].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const sendAI = useCallback(async (message: string) => {
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
      addHistory({ query: message, type: 'search', meta: 'AI Assistant' });
    } finally {
      setAiLoading(false);
    }
  }, [addHistory]);

  return (
    <AppContext.Provider
      value={{
        savedPlaces,
        history,
        aiMessages,
        aiLoading,
        toast,
        saveItem,
        removeSaved,
        isSaved,
        addHistory,
        sendAI,
        showToast,
        aiSuggestions: AI_SUGGESTIONS,
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-lacvay-green-dark px-5 py-2.5 text-sm font-medium text-white shadow-lg md:bottom-8">
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
