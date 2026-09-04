import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { TouristSpot, TouristCategory } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';

const categories: (TouristCategory | 'All')[] = ['All', 'Nature', 'Historical', 'Beach', 'Adventure', 'Family', 'Cultural'];

export default function TouristSpotsPage() {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TouristCategory | 'All'>('All');
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isSaved, saveItem, removeSaved, savedPlaces, addHistory } = useApp();

  useEffect(() => {
    dataService.getTouristSpots(filter === 'All' ? undefined : filter).then((s) => {
      setSpots(s);
      setLoading(false);
    });
  }, [filter]);

  const toggleSave = (spot: TouristSpot) => {
    const saved = savedPlaces.find((p) => p.itemId === spot.id);
    if (saved) removeSaved(saved.id);
    else {
      saveItem({ itemId: spot.id, type: 'tourist-spot', title: spot.name, subtitle: spot.location, imageUrl: spot.imageUrl });
      addHistory({ query: spot.name, type: 'attraction' });
    }
    setJustSavedId(spot.id);
    setTimeout(() => setJustSavedId((current) => (current === spot.id ? null : current)), 400);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tourist Spots</h2>
        <p className="text-sm text-gray-500">Discover attractions around Batangas City and nearby areas</p>
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
            <Card key={spot.id} padding="sm" className="overflow-hidden p-0">
              <div className="relative aspect-[16/10] cursor-pointer" onClick={() => navigate(`/tourist-spots/${spot.id}`)}>
                <img src={spot.imageUrl} alt={spot.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900">{spot.name}</h3>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                    <Star className="h-3 w-3 fill-current" /> {spot.rating}
                  </span>
                </div>
                <Badge variant="lime" className="mt-2">{spot.categoryLabel ?? spot.category}</Badge>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{spot.shortDescription}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {spot.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {spot.estimatedTravelTime}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/tourist-spots/${spot.id}`)}
                    className="flex-1 rounded-xl bg-lacvay-green/10 py-2 text-sm font-semibold text-lacvay-green"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSave(spot)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      isSaved(spot.id)
                        ? 'border-lacvay-green bg-lacvay-green text-white'
                        : 'border-gray-200 text-gray-600'
                    } ${justSavedId === spot.id ? 'save-btn-pop' : ''}`}
                  >
                    {isSaved(spot.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
