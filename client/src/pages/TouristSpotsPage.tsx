import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { favoritesService } from '@/services/favoritesService';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PlaceCard } from '@/components/places/PlaceCard';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { TouristSpot, TouristCategory } from '@/types';

const categories: (TouristCategory | 'All')[] = ['All', 'Nature', 'Historical', 'Beach', 'Adventure', 'Family', 'Cultural'];

export default function TouristSpotsPage() {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TouristCategory | 'All'>('All');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const { addHistory, isSaved, saveItem, removeSaved } = useApp();
  const navigate = useNavigate();

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
        subtitle: spot.location,
        imageUrl: spot.imageUrl,
      });
      addHistory({ query: spot.name, type: 'attraction' });
    } else {
      removeSaved(spot.id);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tourist Spots</h2>
          <p className="text-sm text-gray-500">Discover attractions around Batangas City and nearby areas</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/saved-places')}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-soft transition hover:border-lacvay-green hover:text-lacvay-green"
        >
          <Bookmark className="h-4 w-4 text-lacvay-green" />
          View Saved Places
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
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
          {spots.map((spot) => (
            <PlaceCard
              key={spot.id}
              place={{
                id: spot.id,
                name: spot.name,
                description: spot.shortDescription,
                category: spot.categoryLabel ?? spot.category,
                image_url: spot.imageUrl,
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
