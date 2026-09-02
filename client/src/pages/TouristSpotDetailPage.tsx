import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, MapPin, Clock, Navigation } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { TouristSpot } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';

export default function TouristSpotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [spot, setSpot] = useState<TouristSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isSaved, saveItem, removeSaved, savedPlaces } = useApp();

  useEffect(() => {
    if (!id) return;
    dataService.getTouristSpot(id).then((s) => {
      setSpot(s ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingState />;
  if (!spot) return <EmptyState title="Spot not found" />;

  const toggleSave = () => {
    const saved = savedPlaces.find((p) => p.itemId === spot.id);
    if (saved) removeSaved(saved.id);
    else saveItem({ itemId: spot.id, type: 'tourist-spot', title: spot.name, subtitle: spot.location, imageUrl: spot.imageUrl });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button type="button" onClick={() => navigate('/tourist-spots')} className="text-sm font-semibold text-lacvay-green hover:underline">
        ← Back to Tourist Spots
      </button>

      <div className="overflow-hidden rounded-3xl">
        <img src={spot.imageUrl} alt={spot.name} className="aspect-[21/9] w-full object-cover" />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{spot.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant="lime">{spot.categoryLabel ?? spot.category}</Badge>
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
              <Star className="h-4 w-4 fill-current" /> {spot.rating}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleSave}>{isSaved(spot.id) ? 'Saved' : 'Save'}</Button>
          <Button onClick={() => navigate(`/map?to=${encodeURIComponent(spot.name)}`)}>
            <Navigation className="h-4 w-4" /> Directions
          </Button>
        </div>
      </div>

      <Card>
        <p className="text-gray-600 leading-relaxed">{spot.description}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Location</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-gray-800">
              <MapPin className="h-4 w-4 text-lacvay-green" /> {spot.location}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Hours</p>
            <p className="mt-1 text-sm font-medium text-gray-800">{spot.openingHours}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Travel Time</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-gray-800">
              <Clock className="h-4 w-4 text-lacvay-green" /> {spot.estimatedTravelTime}
            </p>
          </div>
        </div>
      </Card>

      <Button variant="outline" onClick={() => navigate('/restaurants')}>Nearby Restaurants →</Button>
    </div>
  );
}
