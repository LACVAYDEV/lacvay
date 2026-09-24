import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dataService } from '@/services/dataService';
import { favoritesService } from '@/services/favoritesService';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PlaceCard } from '@/components/places/PlaceCard';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { isCurrentlyOpenNow } from '@/lib/timeUtils';
import type { Restaurant } from '@/types';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get('search') || searchParams.get('q') || '').toLowerCase().trim();

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

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      {/* Standalone Open Now Filter Toggle */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpenNowOnly((prev) => !prev)}
          aria-pressed={openNowOnly}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
            openNowOnly
              ? 'bg-lacvay-green text-white shadow-soft ring-2 ring-lacvay-green/30'
              : 'bg-white text-gray-600 shadow-soft hover:bg-gray-50'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              openNowOnly ? 'bg-white animate-pulse' : 'bg-emerald-500'
            }`}
          />
          Open Now
        </button>
      </div>

      {sortedRestaurants.length === 0 ? (
        <EmptyState
          title="No restaurants found"
          description={
            openNowOnly
              ? 'No restaurants are currently open. Try toggling off "Open Now".'
              : searchQuery
              ? `No restaurants found matching "${searchQuery}".`
              : 'Eateries will appear here once added.'
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
