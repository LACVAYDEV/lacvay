import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Sun, LogOut, Shield, User } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof dataService.search>>>([]);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [temperature, setTemperature] = useState<number | null>(null);
  const navigate = useNavigate();
  const { addHistory } = useApp();
  const { user, signOut, isAdmin, isAdminMode, chooseSessionMode } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch live weather for Batangas City
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=13.7626&longitude=121.0040&current=temperature_2m&timezone=auto'
        );
        const data = await res.json() as { current?: { temperature_2m?: number } };
        if (data.current?.temperature_2m !== undefined) {
          setTemperature(Math.round(data.current.temperature_2m));
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      }
    };

    void fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(() => void fetchWeather(), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const found = await dataService.search(value);
    setResults(found);
    setOpen(found.length > 0);
  };

  const selectResult = (path?: string, title?: string) => {
    if (title) addHistory({ query: title, type: 'search' });
    setOpen(false);
    setQuery('');
    if (path) navigate(path);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-lacvay-cream/95 px-4 py-4 backdrop-blur md:px-6 lg:px-7">
      <div ref={searchRef} className="relative min-w-0 flex-1 md:max-w-sm lg:max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search places, routes, or attractions..."
          aria-label="Search places, routes, or attractions"
          className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-[12.5px] shadow-soft outline-none transition placeholder:text-gray-400 focus:border-lacvay-green focus:ring-2 focus:ring-lacvay-green/15"
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectResult(r.path, r.title)}
                className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-gray-50"
              >
                <span className="text-[12.5px] font-medium text-gray-900">{r.title}</span>
                <span className="text-[11px] text-gray-500">{r.subtitle}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-soft sm:flex">
          <Sun className="h-4 w-4 text-lacvay-yellow" fill="#F2A93D" strokeWidth={1.5} />
          <div className="leading-tight">
            <p className="text-[12.5px] font-bold text-gray-800">{temperature ? `${temperature}°C` : '---'}</p>
            <p className="text-[9.5px] text-gray-500">Batangas City</p>
          </div>
        </div>

        <button
          type="button"
          className="relative rounded-full bg-white p-2 shadow-soft hover:bg-gray-50"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-gray-600" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-lacvay-green ring-2 ring-white" />
        </button>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2.5 shadow-soft hover:bg-gray-50"
          >
            <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="" className="h-8 w-8 rounded-full bg-gray-100" />
            <span className="hidden text-[12.5px] font-medium text-gray-800 md:inline">
              Hello, {(user?.name || user?.email?.split('@')[0])?.split(' ')[0]}!
            </span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-gray-500 transition', profileOpen && 'rotate-180')} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-card">
              <div className="border-b border-gray-100 px-4 pb-2 pt-1">
                <p className="truncate text-[12.5px] font-semibold text-gray-900">{user?.name || user?.email?.split('@')[0]}</p>
                <p className="truncate text-[11px] text-gray-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { navigate('/saved'); setProfileOpen(false); }}
                className="block w-full px-4 py-2 text-left text-[12.5px] hover:bg-gray-50"
              >
                Saved
              </button>
              <button
                type="button"
                onClick={() => { navigate('/history'); setProfileOpen(false); }}
                className="block w-full px-4 py-2 text-left text-[12.5px] hover:bg-gray-50"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                className="block w-full px-4 py-2 text-left text-[12.5px] hover:bg-gray-50"
              >
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
      </div>
    </header>
  );
}
