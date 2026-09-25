import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Camera, Compass, Menu, RotateCcw, Search, Utensils, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { AiOriginField } from '@/components/ai/AiOriginField';
import { dataService } from '@/services/dataService';
import { supabase } from '@/lib/supabase';
import type { Place } from '@/types';
import { HeaderToolbar } from './HeaderToolbar';

const PAGE_TITLES: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (p) => p === '/ai-assistant' || p === '/assistant', title: 'LACVAY AI' },
  { match: (p) => p === '/commute' || p.startsWith('/commute-guide'), title: 'Commute Guide' },
  { match: (p) => /^\/tourist-spots\/.+/.test(p), title: 'Tourist Spot' },
  { match: (p) => p === '/tourist-spots', title: 'Tourist Spots' },
  { match: (p) => p === '/restaurants', title: 'Restaurants & Eateries' },
  { match: (p) => p === '/promotions', title: 'Promotions & Offers' },
  { match: (p) => p === '/saved' || p === '/saved-places', title: 'Saved Trips' },
  { match: (p) => p === '/settings', title: 'Settings' },
];

interface HeaderProps {
  onMenuClick?: () => void;
  menuButtonRef?: RefObject<HTMLButtonElement | null>;
}

export function Header({ onMenuClick, menuButtonRef }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAIMessages } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHome = location.pathname === '/';
  const isAiPage =
    location.pathname === '/ai-assistant' || location.pathname === '/assistant';

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

  useEffect(() => {
    const s = searchParams.get('search') || '';
    if (s !== searchTerm) {
      setSearchTerm(s);
    }
  }, [searchParams]);

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

  const isMapPage = location.pathname === '/map';

  const renderMapSearch = () => (
    <div ref={searchContainerRef} className="relative min-w-0 w-52 sm:w-60 md:w-72 lg:w-80 xl:w-96">
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
        <div className="absolute top-full right-0 mt-1.5 w-[min(18rem,calc(100vw-2rem))] max-h-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-md shadow-xl p-1.5 z-50">
          {matchingPlaces.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-400">No matching places found</div>
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
                          ? 'bg-lacvay-blush text-lacvay-green font-semibold'
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

  const renderHeaderLeft = () => {
    if (isMapPage) {
      return (
        <h1 className="truncate text-lg font-bold leading-none tracking-tight text-gray-900 sm:text-xl">Map & Routes</h1>
      );
    }

    if (isAiPage) {
      return (
        <h1 className="truncate text-lg font-bold leading-none tracking-tight text-gray-900 sm:text-xl">LACVAY AI</h1>
      );
    }

    const title = PAGE_TITLES.find((entry) => entry.match(location.pathname))?.title;
    return title ? (
      <h1 className="truncate text-lg font-bold leading-none tracking-tight text-gray-900 sm:text-xl">{title}</h1>
    ) : null;
  };

  if (isHome) return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-lacvay-green/20 bg-lacvay-cream/95 px-3 backdrop-blur sm:gap-3 sm:px-4 md:px-6 lg:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        {onMenuClick && (
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lacvay-green hover:bg-lacvay-blush lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {renderHeaderLeft()}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {isMapPage && renderMapSearch()}
        {isAiPage && (
          <>
            <AiOriginField className="hidden min-[480px]:flex w-52 sm:w-60 md:w-72 lg:w-80 xl:w-96" />
            <button
              type="button"
              onClick={() => navigate('/saved?tab=guides')}
              className="hidden rounded-full bg-white/95 p-2 shadow-soft backdrop-blur-sm transition hover:bg-white sm:inline-flex"
              aria-label="Saved guides"
              title="Saved guides"
            >
              <Compass className="h-4 w-4 text-lacvay-green" />
            </button>
            <button
              type="button"
              onClick={clearAIMessages}
              className="rounded-full bg-white/95 p-2 shadow-soft backdrop-blur-sm transition hover:bg-white"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <RotateCcw className="h-4 w-4 text-gray-600" />
            </button>
          </>
        )}
        <HeaderToolbar className="shrink-0" />
      </div>
    </header>
  );
}
