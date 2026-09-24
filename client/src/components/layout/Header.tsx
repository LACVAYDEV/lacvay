import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  LogOut,
  Search,
  Shield,
  ShieldCheck,
  Tag,
  User,
  X,
  Camera,
  Utensils,
} from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { readPreferences } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import type { Place } from '@/types';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  path: string;
  kind: 'safety' | 'promotion';
}

export function Header() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, isAdminMode, chooseSessionMode } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationPanelId = useId();

  // Smart autocomplete places search state
  const [places, setPlaces] = useState<Place[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname === '/map') {
      supabase
        .from('places')
        .select('*')
        .then(({ data }) => {
          if (data && data.length > 0) {
            setPlaces(data as unknown as Place[]);
          } else {
            Promise.all([dataService.getTouristSpots(), dataService.getRestaurants()]).then(
              ([spots, eateries]) => {
                setPlaces([
                  ...spots.map((s) => ({
                    id: s.id,
                    name: s.name,
                    category: s.category,
                    latitude: s.coordinates.lat,
                    longitude: s.coordinates.lng,
                    description: s.description,
                    image_url: s.imageUrl,
                  })),
                  ...eateries.map((r) => ({
                    id: r.id,
                    name: r.name,
                    category: 'restaurant',
                    latitude: r.coordinates.lat,
                    longitude: r.coordinates.lng,
                    description: r.description,
                    image_url: r.imageUrl,
                  })),
                ]);
              },
            );
          }
        });
    }
  }, [location.pathname]);

  // Sync search input with URL search param
  useEffect(() => {
    const s = searchParams.get('search') || '';
    if (s !== searchTerm) {
      setSearchTerm(s);
    }
  }, [searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingPlaces = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return places.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 8);
  }, [places, searchTerm]);

  const handleSelectPlace = (place: Place) => {
    const lat = (place as any).lat ?? place.latitude;
    const lng = (place as any).lng ?? place.longitude;
    setSearchTerm(place.name);
    setIsSearchOpen(false);

    const next = new URLSearchParams(searchParams);
    next.set('search', place.name);
    next.set('highlight', place.id);
    next.delete('lat');
    next.delete('lng');
    setSearchParams(next, { replace: true });

    window.dispatchEvent(
      new CustomEvent('lacvay:fly-to-place', {
        detail: { ...place, latitude: lat, longitude: lng },
      }),
    );
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('highlight');
    next.delete('lat');
    next.delete('lng');
    setSearchParams(next, { replace: true });
    window.dispatchEvent(new CustomEvent('lacvay:clear-highlight'));
  };

  const handleInputChange = (val: string) => {
    setSearchTerm(val);
    setIsSearchOpen(true);
    const next = new URLSearchParams(searchParams);
    if (val.trim()) {
      next.set('search', val);
    } else {
      next.delete('search');
      next.delete('highlight');
    }
    setSearchParams(next, { replace: true });
  };

  const notificationsEnabled = readPreferences(user).notifications;
  const notificationStorageKey = `lacvay-read-notifications-${user?.id ?? 'guest'}`;
  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.has(notification.id),
  ).length;

  const renderHeaderLeft = () => {
    if (location.pathname === '/map') {
      return (
        <div ref={searchContainerRef} className="relative w-full max-w-[240px] sm:max-w-xs md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="search"
            placeholder="Search map..."
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (searchTerm.trim()) setIsSearchOpen(true);
            }}
            className="w-full rounded-full border border-gray-200 bg-white py-1.5 pl-8 pr-7 text-xs font-medium text-gray-900 placeholder-gray-400 shadow-xs transition focus:border-lacvay-green focus:outline-none focus:ring-1 focus:ring-lacvay-green"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {isSearchOpen && searchTerm.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-md shadow-xl p-1.5 z-50">
              {matchingPlaces.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">
                  No matching places found
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {matchingPlaces.map((place) => {
                    const isRestaurant =
                      place.category === 'restaurant' ||
                      place.category?.toLowerCase() === 'restaurant';
                    const isSelected = place.id === searchParams.get('highlight');

                    return (
                      <li key={place.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition ${
                            isSelected
                              ? 'bg-emerald-50 text-lacvay-green font-semibold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-[9px] ${
                              isRestaurant ? 'bg-orange-500' : 'bg-teal-500'
                            }`}
                          >
                            {isRestaurant ? <Utensils size={10} /> : <Camera size={10} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold leading-tight">{place.name}</p>
                            <p className="truncate text-[10px] text-gray-400">
                              {place.category || (isRestaurant ? 'Restaurant' : 'Tourist Spot')}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      );
    }

    if (location.pathname === '/tourist-spots' || location.pathname.startsWith('/tourist-spots')) {
      return <h1 className="text-lg font-bold text-gray-900 truncate">Tourist Spots</h1>;
    }

    if (location.pathname === '/restaurants') {
      return <h1 className="text-lg font-bold text-gray-900 truncate">Restaurants & Eateries</h1>;
    }

    if (location.pathname === '/saved' || location.pathname === '/saved-places') {
      return <h1 className="text-lg font-bold text-gray-900 truncate">Saved Trips</h1>;
    }

    return null;
  };

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
            path: '/commute',
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 bg-lacvay-cream/95 px-4 backdrop-blur md:px-6 lg:px-7 shrink-0">
      {/* Left Side: Dynamic Page Title or Map Search */}
      <div className="flex items-center min-w-0 flex-1">
        {renderHeaderLeft()}
      </div>

      {/* Right Side: Notifications & Account */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationOpen((current) => !current);
              setProfileOpen(false);
            }}
            className="relative rounded-full bg-white p-2 shadow-soft hover:bg-gray-50 transition"
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
              aria-label="User menu"
              className="flex items-center rounded-full p-0.5 shadow-soft ring-1 ring-gray-200/80 hover:ring-lacvay-green transition focus:outline-none"
            >
              <img
                src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt=""
                className="h-8 w-8 rounded-full bg-gray-100 object-cover"
              />
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
