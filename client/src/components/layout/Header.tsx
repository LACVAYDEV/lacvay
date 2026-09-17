import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Search,
  Shield,
  ShieldCheck,
  Sun,
  Tag,
  User,
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { readPreferences } from '@/lib/preferences';

const WEATHER_CACHE_KEY = 'lacvay-weather';
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;

interface CachedWeather {
  temperature: number;
  timestamp: number;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  path: string;
  kind: 'safety' | 'promotion';
}

export function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof dataService.search>>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherUnavailable, setWeatherUnavailable] = useState(false);

  const navigate = useNavigate();
  const { user, signOut, isAdmin, isAdminMode, chooseSessionMode } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRequestRef = useRef(0);
  const searchListId = useId();
  const searchStatusId = useId();
  const notificationPanelId = useId();

  const notificationsEnabled = readPreferences(user).notifications;
  const notificationStorageKey = `lacvay-read-notifications-${user?.id ?? 'guest'}`;
  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.has(notification.id),
  ).length;

  useEffect(() => {
    const fetchWeather = async () => {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as CachedWeather;
          if (
            Number.isFinite(parsed.temperature) &&
            Date.now() - parsed.timestamp < WEATHER_CACHE_TTL_MS
          ) {
            setTemperature(Math.round(parsed.temperature));
            setWeatherUnavailable(false);
            return;
          }
        } catch {
          localStorage.removeItem(WEATHER_CACHE_KEY);
        }
      }

      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=13.7626&longitude=121.0040&current=temperature_2m&timezone=auto',
        );
        if (!response.ok) throw new Error(`Weather service returned ${response.status}`);

        const data = await response.json() as { current?: { temperature_2m?: number } };
        const nextTemperature = data.current?.temperature_2m;
        if (typeof nextTemperature !== 'number' || !Number.isFinite(nextTemperature)) {
          throw new Error('Weather service returned an invalid temperature');
        }

        setTemperature(Math.round(nextTemperature));
        setWeatherUnavailable(false);
        localStorage.setItem(
          WEATHER_CACHE_KEY,
          JSON.stringify({ temperature: nextTemperature, timestamp: Date.now() } satisfies CachedWeather),
        );
      } catch (error) {
        console.warn('Failed to fetch weather:', error);
        setWeatherUnavailable(true);
      }
    };

    void fetchWeather();
    const interval = setInterval(() => void fetchWeather(), WEATHER_CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(notificationStorageKey);
    if (!stored) {
      setReadNotificationIds(new Set());
      return;
    }
    try {
      const ids = JSON.parse(stored) as unknown;
      setReadNotificationIds(
        new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []),
      );
    } catch {
      localStorage.removeItem(notificationStorageKey);
      setReadNotificationIds(new Set());
    }
  }, [notificationStorageKey]);

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifications([]);
      return;
    }

    let mounted = true;
    void dataService.getPromotions()
      .then((promotions) => {
        if (!mounted) return;
        setNotifications([
          {
            id: 'travel-safety',
            title: 'Review the travel safety guide',
            message: 'Verify your driver and vehicle, wear required safety equipment, and confirm routes before leaving.',
            path: '/rides',
            kind: 'safety',
          },
          ...promotions.slice(0, 3).map((promotion) => ({
            id: `promotion-${promotion.id}`,
            title: promotion.title,
            message: promotion.description,
            path: '/promotions',
            kind: 'promotion' as const,
          })),
        ]);
      })
      .catch((error) => {
        console.warn('Failed to load notifications:', error);
        if (mounted) setNotifications([]);
      });

    return () => {
      mounted = false;
    };
  }, [notificationsEnabled]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
        setActiveResultIndex(-1);
      }
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationOpen(false);
      }
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setNotificationOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearch = async (value: string) => {
    const requestId = ++searchRequestRef.current;
    setQuery(value);
    setActiveResultIndex(-1);
    setSearchError(false);
    if (value.trim().length < 2) {
      setResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }

    setSearchOpen(true);
    setSearchLoading(true);
    try {
      const found = await dataService.search(value);
      if (requestId !== searchRequestRef.current) return;
      setResults(found);
    } catch (error) {
      console.warn('Search failed:', error);
      if (requestId !== searchRequestRef.current) return;
      setResults([]);
      setSearchError(true);
    } finally {
      if (requestId === searchRequestRef.current) setSearchLoading(false);
    }
  };

  const selectResult = (path?: string, _title?: string) => {
    setSearchOpen(false);
    setActiveResultIndex(-1);
    setQuery('');
    if (path) navigate(path);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen && ['ArrowDown', 'ArrowUp'].includes(event.key) && query.trim().length >= 2) {
      setSearchOpen(true);
    }
    if (results.length === 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveResultIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResultIndex((index) => index <= 0 ? results.length - 1 : index - 1);
    } else if (event.key === 'Enter' && activeResultIndex >= 0) {
      event.preventDefault();
      const result = results[activeResultIndex];
      if (result) selectResult(result.path, result.title);
    } else if (event.key === 'Escape') {
      setSearchOpen(false);
      setActiveResultIndex(-1);
    }
  };

  const markNotificationsRead = (ids: string[]) => {
    setReadNotificationIds((current) => {
      const next = new Set([...current, ...ids]);
      localStorage.setItem(notificationStorageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const selectNotification = (notification: AppNotification) => {
    markNotificationsRead([notification.id]);
    setNotificationOpen(false);
    navigate(notification.path);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-lacvay-cream/95 px-4 py-4 backdrop-blur md:px-6 lg:px-7">
      <div
        ref={searchRef}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setSearchOpen(false);
            setActiveResultIndex(-1);
          }
        }}
        className="relative min-w-0 flex-1 md:max-w-sm lg:max-w-md"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => void handleSearch(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2) setSearchOpen(true);
          }}
          placeholder="Search places, routes, or attractions..."
          aria-label="Search places, routes, or attractions"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={searchOpen}
          aria-controls={searchListId}
          aria-describedby={searchStatusId}
          aria-activedescendant={
            activeResultIndex >= 0 ? `${searchListId}-option-${activeResultIndex}` : undefined
          }
          className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-[12.5px] shadow-soft outline-none transition placeholder:text-gray-400 focus:border-lacvay-green focus:ring-2 focus:ring-lacvay-green/15"
        />
        {searchOpen && (
          <div
            id={searchListId}
            role="listbox"
            aria-label="Search suggestions"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
          >
            {searchLoading && <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>}
            {!searchLoading && searchError && (
              <p className="px-4 py-3 text-sm text-red-600">Search is unavailable. Please try again.</p>
            )}
            {!searchLoading && !searchError && results.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">No matching places or routes.</p>
            )}
            {!searchLoading && results.map((result, index) => (
              <div
                id={`${searchListId}-option-${index}`}
                key={result.id}
                role="option"
                aria-selected={activeResultIndex === index}
                onMouseEnter={() => setActiveResultIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectResult(result.path, result.title)}
                className={cn(
                  'flex w-full cursor-pointer flex-col px-4 py-2.5 text-left',
                  activeResultIndex === index ? 'bg-lacvay-green/10' : 'hover:bg-gray-50',
                )}
              >
                <span className="text-[12.5px] font-medium text-gray-900">{result.title}</span>
                <span className="text-[11px] text-gray-500">{result.subtitle}</span>
              </div>
            ))}
          </div>
        )}
        <span id={searchStatusId} className="sr-only" aria-live="polite">
          {searchLoading
            ? 'Searching'
            : searchError
              ? 'Search is unavailable'
              : query.trim().length >= 2
              ? `${results.length} search result${results.length === 1 ? '' : 's'} available`
              : ''}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-soft sm:flex">
          <Sun className="h-4 w-4 text-lacvay-yellow" fill="#F2A93D" strokeWidth={1.5} />
          <div className="leading-tight">
            <p className="text-[12.5px] font-bold text-gray-800">
              {temperature !== null ? `${temperature}°C` : weatherUnavailable ? 'Unavailable' : 'Loading'}
            </p>
            <p className="text-[9.5px] text-gray-500">Batangas City</p>
          </div>
        </div>

        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationOpen((current) => !current);
              setProfileOpen(false);
            }}
            className="relative rounded-full bg-white p-2 shadow-soft hover:bg-gray-50"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            aria-expanded={notificationOpen}
            aria-controls={notificationPanelId}
          >
            <Bell className="h-4 w-4 text-gray-600" />
            {notificationsEnabled && unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-lacvay-green ring-2 ring-white" />
            )}
          </button>

          {notificationOpen && (
            <div
              id={notificationPanelId}
              role="region"
              aria-label="Notifications"
              className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Notifications</p>
                  <p className="text-[11px] text-gray-500">
                    {notificationsEnabled ? `${unreadCount} unread` : 'Disabled in Settings'}
                  </p>
                </div>
                {notificationsEnabled && unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markNotificationsRead(notifications.map((notification) => notification.id))}
                    className="flex items-center gap-1 text-xs font-semibold text-lacvay-green hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {!notificationsEnabled ? (
                <div className="p-4">
                  <p className="text-sm text-gray-600">Notifications are turned off.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen(false);
                      navigate('/settings');
                    }}
                    className="mt-2 text-sm font-semibold text-lacvay-green hover:underline"
                  >
                    Open notification settings
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">You have no notifications.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => {
                    const isRead = readNotificationIds.has(notification.id);
                    const Icon = notification.kind === 'promotion' ? Tag : ShieldCheck;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => selectNotification(notification)}
                        className={cn(
                          'flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50',
                          !isRead && 'bg-lacvay-green/[0.04]',
                        )}
                      >
                        <span className="mt-0.5 rounded-lg bg-lacvay-green/10 p-2 text-lacvay-green">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            {notification.title}
                            {!isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lacvay-green" />}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-gray-500">
                            {notification.message}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {user ? (
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationOpen(false);
              }}
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2.5 shadow-soft hover:bg-gray-50"
            >
              <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="" className="h-8 w-8 rounded-full bg-gray-100" />
              <span className="hidden text-[12.5px] font-medium text-gray-800 md:inline">
                Hello, {(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler')?.split(' ')[0]}!
              </span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-gray-500 transition', profileOpen && 'rotate-180')} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-card">
                <div className="border-b border-gray-100 px-4 pb-2 pt-1">
                  <p className="truncate text-[12.5px] font-semibold text-gray-900">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
                  <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
                </div>
                <button type="button" onClick={() => { navigate('/saved'); setProfileOpen(false); }} className="block w-full px-4 py-2 text-left text-[12.5px] hover:bg-gray-50">
                  Saved
                </button>
                <button type="button" onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="block w-full px-4 py-2 text-left text-[12.5px] hover:bg-gray-50">
                  Settings
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      if (isAdminMode) {
                        chooseSessionMode('user');
                        navigate('/');
                      } else {
                        chooseSessionMode('admin');
                        navigate('/admin');
                      }
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-[12.5px] font-medium text-lacvay-green hover:bg-lacvay-green/5"
                  >
                    {isAdminMode ? (
                      <>
                        <User className="h-3.5 w-3.5" />
                        Switch to traveler
                      </>
                    ) : (
                      <>
                        <Shield className="h-3.5 w-3.5" />
                        Open admin panel
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); void signOut(); }}
                  className="mt-1 flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-left text-[12.5px] font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-full bg-lacvay-green px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-soft transition hover:bg-lacvay-green-dark"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
