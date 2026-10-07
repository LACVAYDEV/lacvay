import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { SavedPlace, SearchHistoryItem, AIMessage, ChatSession } from '@/types';
import { generateId } from '@/lib/utils';
import {
  sendAIMessage,
  AI_SUGGESTIONS,
  getStoredAiOrigin,
  setStoredAiOrigin,
  markManualAiOrigin,
  clearManualAiOrigin,
} from '@/services/aiService';
import { GEO_EVENT, GEO_ORIGIN_MANUAL_KEY, getStoredGeo, requestUserLocation, type UserGeo } from '@/lib/userLocation';

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
  sendAI: (message: string, origin?: string) => Promise<void>;
  clearAIMessages: () => void;
  aiOrigin: string;
  setAiOrigin: (value: string) => void;
  locatingAiOrigin: boolean;
  locateAiOriginFromGps: () => Promise<void>;
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
    "Magandang araw! I'm **LACVAY AI**, your friendly Batangas City travel buddy 🌿\n\nI can help you with:\n* **Jeepney, tricycle, & taxi routes**\n* **Accurate local fare estimates**\n* **Top beaches, mountains, & historical spots**\n* **Lomi houses & authentic Batangas dining**\n\nWhere would you like to explore today?",
  timestamp: new Date().toISOString(),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([WELCOME_MESSAGE]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOrigin, setAiOriginState] = useState('');
  const [locatingAiOrigin, setLocatingAiOrigin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const applyGeo = (geo: UserGeo | null) => {
      try {
        if (sessionStorage.getItem(GEO_ORIGIN_MANUAL_KEY) === '1') {
          const stored = getStoredAiOrigin();
          if (stored) {
            setAiOriginState(stored);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      if (geo?.label) {
        setAiOriginState(geo.label);
        setStoredAiOrigin(geo.label);
      } else {
        setAiOriginState(getStoredAiOrigin() || 'SM Batangas');
      }
    };
    applyGeo(getStoredGeo());
    void requestUserLocation().then(applyGeo);

    const onGeo = (event: Event) => {
      const next = (event as CustomEvent<UserGeo>).detail;
      applyGeo(next ?? null);
    };
    window.addEventListener(GEO_EVENT, onGeo);
    return () => window.removeEventListener(GEO_EVENT, onGeo);
  }, []);

  const setAiOrigin = useCallback((value: string) => {
    setAiOriginState(value);
    setStoredAiOrigin(value);
    markManualAiOrigin();
  }, []);

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

  const locateAiOriginFromGps = useCallback(async () => {
    setLocatingAiOrigin(true);
    try {
      const geo = await requestUserLocation();
      if (!geo) {
        showToast('Could not get your location. Allow location access in your browser.');
        return;
      }
      clearManualAiOrigin();
      setAiOriginState(geo.label);
      setStoredAiOrigin(geo.label);
    } finally {
      setLocatingAiOrigin(false);
    }
  }, [showToast]);

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

  const sendAI = useCallback(
    async (message: string, origin?: string) => {
      const effectiveOrigin = (origin ?? aiOrigin).trim() || undefined;
      const userMsg: AIMessage = {
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setAiMessages((prev) => [...prev, userMsg]);
      setAiLoading(true);

      try {
        const reply = await sendAIMessage(message, effectiveOrigin);
        setAiMessages((prev) => [...prev, reply]);
      } catch (err: any) {
        console.error('Failed to get AI reply:', err);
        const errMsg = err?.message || 'My network is a bit jammed right now. Please give me a few seconds and try asking again.';
        setAiMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content: errMsg,
            timestamp: new Date().toISOString(),
          },
        ]);
        showToast(errMsg);
      } finally {
        setAiLoading(false);
      }
    },
    [aiOrigin, showToast],
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
  const addHistory = useCallback((_item?: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {}, []);
  const removeHistory = useCallback((_id?: string) => {}, []);
  const clearHistory = useCallback(() => {}, []);
  const setHistorySyncEnabled = useCallback(async (_enabled?: boolean) => {}, []);
  const selectSession = useCallback(async (_sessionId?: string) => {}, []);
  const createSession = useCallback(async (_title?: string) => generateId(), []);
  const deleteSession = useCallback(async (_sessionId?: string) => {}, []);

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
        aiOrigin,
        setAiOrigin,
        locatingAiOrigin,
        locateAiOriginFromGps,
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
