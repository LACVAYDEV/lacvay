import { useEffect, useState } from 'react';
import { dataService } from '@/services/dataService';
import { favoritesService } from '@/services/favoritesService';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PlaceCard } from '@/components/places/PlaceCard';
import { LoadingState, EmptyState } from '@/components/ui/States';
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

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tourist spots by category">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === c ? 'bg-lacvay-green text-white' : 'bg-white text-gray-600 shadow-soft'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {spots.length === 0 ? (
        <EmptyState title="No spots found" description="Try a different category filter." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...spots]
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
