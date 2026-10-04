import { useEffect, useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { favoritesService } from '@/services/favoritesService';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PlaceCard } from '@/components/places/PlaceCard';
import { EmptyState, CardGridSkeleton } from '@/components/ui/States';
import { SearchField, FilterChip } from '@/components/ui/SearchField';
import type { TouristSpot, TouristCategory } from '@/types';

const categories: (TouristCategory | 'All')[] = [
  'All',
  'Nature',
  'Historical',
  'Beach',
  'Adventure',
  'Family',
  'Cultural',
  'Establishment',
  'Others',
];

export default function TouristSpotsPage() {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TouristCategory | 'All'>('All');
  const [query, setQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const { isSaved, saveItem, removeSaved } = useApp();

  useEffect(() => {
    dataService.getTouristSpots(filter === 'All' ? undefined : filter).then((s) => {
      setSpots(s);
      setLoading(false);
    });
  }, [filter]);

  useEffect(() => {
    if (user) {
      favoritesService
        .getUserFavoritePlaceIds(user.id)
        .then((ids) => setFavoriteIds(new Set(ids)))
        .catch((err) => console.error('Error fetching favorites:', err));
    }
  }, [user]);

  const handleFavoriteChange = (spot: TouristSpot, isFav: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(spot.id);
      else next.delete(spot.id);
      return next;
    });

    if (isFav) {
      saveItem({
        itemId: spot.id,
        type: 'tourist-spot',
        title: spot.name,
        subtitle: 'Batangas City',
        imageUrl: spot.imageUrl,
      });
    } else {
      removeSaved(spot.id);
    }
  };

  const visibleSpots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return spots;
    return spots.filter(
      (spot) =>
        spot.name.toLowerCase().includes(q) ||
        spot.shortDescription?.toLowerCase().includes(q) ||
        spot.location?.toLowerCase().includes(q),
    );
  }, [spots, query]);

  const hasFilters = filter !== 'All' || query.trim() !== '';

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <SearchField
          label="Search tourist spots"
          value={query}
          onChange={setQuery}
          placeholder="Search by name or area"
        />

        <div
          className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 sm:flex-wrap"
          role="group"
          aria-label="Filter tourist spots by category"
        >
          {categories.map((c) => (
            <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : visibleSpots.length === 0 ? (
        <EmptyState
          icon={<Camera className="h-6 w-6" />}
          title="No spots found"
          description={query.trim() ? `Nothing matches "${query.trim()}".` : 'Try a different category.'}
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setFilter('All');
                  setQuery('');
                }}
                className="rounded-lg bg-lacvay-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-lacvay-green-dark"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {[...visibleSpots]
            .sort((a, b) => {
              const aFav = favoriteIds.has(a.id) || isSaved(a.id);
              const bFav = favoriteIds.has(b.id) || isSaved(b.id);
              if (aFav && !bFav) return -1;
              if (!aFav && bFav) return 1;
              if (a.isFeatured && !b.isFeatured) return -1;
              if (!a.isFeatured && b.isFeatured) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((spot) => (
              <PlaceCard
                key={spot.id}
                place={{
                  id: spot.id,
                  name: spot.name,
                  description: spot.shortDescription,
                  category: spot.categoryLabel ?? spot.category,
                  image_url: spot.imageUrl,
                  is_featured: spot.isFeatured,
                  lat: spot.coordinates?.lat,
                  lng: spot.coordinates?.lng,
                  rating: spot.rating,
                  location: spot.location,
                }}
                isFavorited={favoriteIds.has(spot.id) || isSaved(spot.id)}
                onFavoriteChange={(_id, isFav) => handleFavoriteChange(spot, isFav)}
              />
            ))}
        </div>
      )}
    </div>
  );
}
