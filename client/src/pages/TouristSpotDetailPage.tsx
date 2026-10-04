import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Clock,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Map,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react';
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
    <div className="w-full space-y-4">
      <button
        type="button"
        onClick={() => navigate('/tourist-spots')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3.5 py-2 text-sm font-semibold text-lacvay-green shadow-sm transition hover:bg-lacvay-blush"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Tourist Spots
      </button>

      <div className={`relative overflow-hidden rounded-lg border border-gray-100 shadow-sm ${isNavigating ? 'tourist-spot-image-out' : incomingTransition ? 'tourist-spot-image-in' : ''}`}>
          {isVideoMediaUrl(spot.imageUrl) ? (
            <video
              src={spot.imageUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
            />
          ) : (
            <img src={spot.imageUrl} alt={spot.name} className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/25" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 rounded-md bg-white/95 text-lacvay-green shadow-sm backdrop-blur">
                {spot.categoryLabel ?? spot.category}
              </Badge>
              {spot.isFeatured && (
                <Badge variant="yellow" className="rounded-md font-bold shadow-sm backdrop-blur">
                  ★ Promoted
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-3xl">
              {spot.name}
            </h1>
            {spot.location && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-white/90">
                <MapPin className="h-4 w-4" />
                {spot.location}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => previousSpot && navigateToSpot(previousSpot, 'previous')}
            disabled={!previousSpot || isNavigating}
            className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lacvay-lime/70 disabled:cursor-not-allowed disabled:opacity-40 sm:left-5 sm:h-10 sm:w-10"
            aria-label={previousSpot ? `View previous destination: ${previousSpot.name}` : 'No previous destination'}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => nextSpot && navigateToSpot(nextSpot, 'next')}
            disabled={!nextSpot || isNavigating}
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lacvay-lime/70 disabled:cursor-not-allowed disabled:opacity-40 sm:right-5 sm:h-10 sm:w-10"
            aria-label={nextSpot ? `View next destination: ${nextSpot.name}` : 'No next destination'}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
      </div>

      <div className={`tourist-spot-details grid gap-4 lg:grid-cols-3 lg:items-start ${isNavigating ? 'tourist-spot-details-out' : incomingTransition ? 'tourist-spot-details-in' : ''}`}>
        <Card className="space-y-4 lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900">About this place</h2>
          <p className="leading-relaxed text-gray-600">{spot.description}</p>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Visit details</h2>
            <div className="space-y-2.5">
              {spot.openingHours && (
                <div className="flex items-start gap-3 rounded-lg bg-lacvay-cream px-3 py-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lacvay-green" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Opening hours</p>
                    <p className="text-sm font-medium text-gray-800">{spot.openingHours}</p>
                  </div>
                </div>
              )}
              {spot.coordinates && (
                <div className="flex items-start gap-3 rounded-lg bg-lacvay-cream px-3 py-2.5">
                  <Compass className="mt-0.5 h-4 w-4 shrink-0 text-lacvay-green" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Coordinates</p>
                    <p className="text-sm font-medium text-gray-800">
                      {spot.coordinates.lat.toFixed(4)}, {spot.coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => navigate(`/assistant?prompt=How+do+I+get+to+${encodeURIComponent(spot.name)}`)}
                className="w-full"
              >
                <Navigation className="h-4 w-4" /> Get directions
              </Button>
              <Button variant="secondary" onClick={toggleSave} className="w-full">
                <Heart className={`h-4 w-4 ${isSaved(spot.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                {isSaved(spot.id) ? 'Saved' : 'Save this place'}
              </Button>
              {spot.coordinates && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/map?lat=${spot.coordinates!.lat}&lng=${spot.coordinates!.lng}`)}
                  className="w-full"
                >
                  <Map className="h-4 w-4" /> Show on map
                </Button>
              )}
            </div>
          </Card>

          <Card className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">Hungry nearby?</h2>
            <p className="text-sm text-gray-500">Find lomi houses, cafés, and local favorites close by.</p>
            <Button variant="outline" onClick={() => navigate('/restaurants')} className="mt-1 w-full">
              <UtensilsCrossed className="h-4 w-4" /> Browse restaurants
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
