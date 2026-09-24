import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { favoritesService } from '@/services/favoritesService';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PlaceCard } from '@/components/places/PlaceCard';
import { EmptyState, CardGridSkeleton } from '@/components/ui/States';
import { SearchField, FilterChip } from '@/components/ui/SearchField';
import { isCurrentlyOpenNow } from '@/lib/timeUtils';
import type { Restaurant } from '@/types';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [searchParams, setSearchParams] = useSearchParams();
  const rawSearch = searchParams.get('search') || searchParams.get('q') || '';
  const searchQuery = rawSearch.toLowerCase().trim();

  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    if (value) next.set('search', value);
    else next.delete('search');
    setSearchParams(next, { replace: true });
  };

  const { user } = useAuth();
  const { isSaved, saveItem, removeSaved } = useApp();

  useEffect(() => {
    dataService.getRestaurants().then((r) => {
      setRestaurants(r);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) {
      favoritesService
        .getUserFavoritePlaceIds(user.id)
        .then((ids) => setFavoriteIds(new Set(ids)))
        .catch((err) => console.error('Error fetching restaurant favorites:', err));
    }
  }, [user]);

  const handleFavoriteChange = (r: Restaurant, isFav: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(r.id);
      else next.delete(r.id);
      return next;
    });

    if (isFav) {
      saveItem({
        itemId: r.id,
        type: 'restaurant',
        title: r.name,
        subtitle: 'Batangas City',
        imageUrl: r.imageUrl,
      });
    } else {
      removeSaved(r.id);
    }
  };

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (searchQuery) {
        const matchesSearch =
          r.name.toLowerCase().includes(searchQuery) ||
          r.description?.toLowerCase().includes(searchQuery) ||
          r.location?.toLowerCase().includes(searchQuery);
        if (!matchesSearch) return false;
      }
      if (openNowOnly && !isCurrentlyOpenNow(r.openTime, r.closeTime)) {
        return false;
      }
      return true;
    });
  }, [restaurants, searchQuery, openNowOnly]);

  const sortedRestaurants = useMemo(() => {
    return [...filteredRestaurants].sort((a, b) => {
      const aFav = favoriteIds.has(a.id) || isSaved(a.id);
      const bFav = favoriteIds.has(b.id) || isSaved(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredRestaurants, favoriteIds, isSaved]);

  const hasFilters = openNowOnly || searchQuery !== '';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-lacvay-green/5 bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:p-4">
        <SearchField
          label="Search restaurants"
          value={rawSearch}
          onChange={setSearch}
          placeholder="Search by name, dish, or area"
          className="flex-1"
        />

        <FilterChip
          active={openNowOnly}
          onClick={() => setOpenNowOnly((prev) => !prev)}
          className="flex items-center justify-center gap-1.5 px-4 py-3"
        >
          <span
            className={`h-2 w-2 rounded-full ${openNowOnly ? 'animate-pulse bg-white' : 'bg-emerald-500'}`}
          />
          Open now
        </FilterChip>
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : sortedRestaurants.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-6 w-6" />}
          title="No restaurants found"
          description={
            openNowOnly
              ? 'No restaurants are open right now.'
              : searchQuery
              ? `Nothing matches "${rawSearch.trim()}".`
              : 'Eateries will appear here once added.'
          }
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setOpenNowOnly(false);
                  setSearch('');
                }}
                className="rounded-full bg-lacvay-green px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-lacvay-green-dark"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {sortedRestaurants.map((r) => (
            <PlaceCard
              key={r.id}
              place={{
                id: r.id,
                name: r.name,
                description: r.description,
                image_url: r.imageUrl,
                isOpen: isCurrentlyOpenNow(r.openTime, r.closeTime),
                is_featured: r.isFeatured,
                priceRange: r.priceRange,
                openingHours: r.openingHours,
                lat: r.coordinates?.lat,
                lng: r.coordinates?.lng,
                rating: r.rating,
                location: r.location,
                type: 'restaurant',
              }}
              isFavorited={favoriteIds.has(r.id) || isSaved(r.id)}
              onFavoriteChange={(_id, isFav) => handleFavoriteChange(r, isFav)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
