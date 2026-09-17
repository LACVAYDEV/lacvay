import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, Navigation, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { isVideoMediaUrl } from '@/lib/mediaUtils';
import type { TouristSpot } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';

export default function TouristSpotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [spot, setSpot] = useState<TouristSpot | null>(null);
  const [allSpots, setAllSpots] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSaved, saveItem, removeSaved, savedPlaces } = useApp();
  const incomingTransition = location.state?.destinationTransition as 'previous' | 'next' | undefined;

  useEffect(() => {
    if (!id) return;
    Promise.all([dataService.getTouristSpot(id), dataService.getTouristSpots()]).then(([s, spots]) => {
      setSpot(s ?? null);
      setAllSpots(spots);
      setLoading(false);
      setIsNavigating(false);
    });
  }, [id]);

  useEffect(() => () => {
    if (navigationTimer.current) {
      clearTimeout(navigationTimer.current);
    }
  }, []);

  if (loading) return <LoadingState />;
  if (!spot) return <EmptyState title="Spot not found" />;

  const toggleSave = () => {
    const saved = savedPlaces.find((p) => p.itemId === spot.id);
    if (saved) removeSaved(saved.id);
    else saveItem({ itemId: spot.id, type: 'tourist-spot', title: spot.name, subtitle: 'Batangas City', imageUrl: spot.imageUrl });
  };

  const currentSpotIndex = allSpots.findIndex((touristSpot) => touristSpot.id === spot.id);
  const previousSpot = currentSpotIndex > 0 ? allSpots[currentSpotIndex - 1] : undefined;
  const nextSpot = currentSpotIndex >= 0 && currentSpotIndex < allSpots.length - 1
    ? allSpots[currentSpotIndex + 1]
    : undefined;

  const navigateToSpot = (destination: TouristSpot, direction: 'previous' | 'next') => {
    if (isNavigating) return;

    setIsNavigating(true);
    navigationTimer.current = setTimeout(() => {
      navigate(`/tourist-spots/${destination.id}`, { state: { destinationTransition: direction } });
    }, 180);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button type="button" onClick={() => navigate('/tourist-spots')} className="text-sm font-semibold text-lacvay-green hover:underline">
        ← Back to Tourist Spots
      </button>

      <div className={`relative overflow-hidden rounded-3xl ${isNavigating ? 'tourist-spot-image-out' : incomingTransition ? 'tourist-spot-image-in' : ''}`}>
          {isVideoMediaUrl(spot.imageUrl) ? (
            <video
              src={spot.imageUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="aspect-[21/9] w-full object-cover"
            />
          ) : (
            <img src={spot.imageUrl} alt={spot.name} className="aspect-[21/9] w-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25" />
          <button
            type="button"
            onClick={() => previousSpot && navigateToSpot(previousSpot, 'previous')}
            disabled={!previousSpot || isNavigating}
            className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-lacvay-lime/70 disabled:cursor-not-allowed disabled:opacity-40 sm:left-6 sm:h-12 sm:w-12"
            aria-label={previousSpot ? `View previous destination: ${previousSpot.name}` : 'No previous destination'}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => nextSpot && navigateToSpot(nextSpot, 'next')}
            disabled={!nextSpot || isNavigating}
            className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-lacvay-lime/70 disabled:cursor-not-allowed disabled:opacity-40 sm:right-6 sm:h-12 sm:w-12"
            aria-label={nextSpot ? `View next destination: ${nextSpot.name}` : 'No next destination'}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
      </div>

      <div className={`tourist-spot-details ${isNavigating ? 'tourist-spot-details-out' : incomingTransition ? 'tourist-spot-details-in' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{spot.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant="lime">{spot.categoryLabel ?? spot.category}</Badge>
            {spot.isFeatured && (
              <Badge variant="yellow" className="font-bold">
                ★ Promoted Destination
              </Badge>
            )}
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {spot.openingHours && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Opening Hours</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Clock className="h-4 w-4 text-lacvay-green" /> {spot.openingHours}
              </p>
            </div>
          )}
          {spot.coordinates && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Coordinates</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Compass className="h-4 w-4 text-lacvay-green" /> {spot.coordinates.lat.toFixed(4)}, {spot.coordinates.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Button variant="outline" onClick={() => navigate('/restaurants')}>Nearby Restaurants →</Button>
      </div>
    </div>
  );
}
