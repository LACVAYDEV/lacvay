import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, Navigation, ChevronLeft, ChevronRight, Compass, Star, Map } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { isVideoMediaUrl } from '@/lib/mediaUtils';
import type { Restaurant } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSaved, saveItem, removeSaved, savedPlaces } = useApp();
  const incomingTransition = location.state?.destinationTransition as 'previous' | 'next' | undefined;

  useEffect(() => {
    if (!id) return;
    Promise.all([dataService.getRestaurant(id), dataService.getRestaurants()]).then(([r, restaurants]) => {
      setRestaurant(r ?? null);
      setAllRestaurants(restaurants);
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
  if (!restaurant) return <EmptyState title="Restaurant not found" />;

  const toggleSave = () => {
    const saved = savedPlaces.find((p) => p.itemId === restaurant.id);
    if (saved) removeSaved(saved.id);
    else saveItem({ itemId: restaurant.id, type: 'restaurant', title: restaurant.name, subtitle: 'Batangas City', imageUrl: restaurant.imageUrl });
  };

  const currentRestaurantIndex = allRestaurants.findIndex((r) => r.id === restaurant.id);
  const previousRestaurant = currentRestaurantIndex > 0 ? allRestaurants[currentRestaurantIndex - 1] : undefined;
  const nextRestaurant = currentRestaurantIndex >= 0 && currentRestaurantIndex < allRestaurants.length - 1
    ? allRestaurants[currentRestaurantIndex + 1]
    : undefined;

  const navigateToRestaurant = (destination: Restaurant, direction: 'previous' | 'next') => {
    if (isNavigating) return;

    setIsNavigating(true);
    navigationTimer.current = setTimeout(() => {
      navigate(`/restaurants/${destination.id}`, { state: { destinationTransition: direction } });
    }, 180);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <button type="button" onClick={() => navigate('/restaurants')} className="text-sm font-semibold text-lacvay-green hover:underline">
        ← Back to Restaurants
      </button>

      <div className={`relative overflow-hidden rounded-lg border border-gray-100 shadow-sm ${isNavigating ? 'restaurant-image-out' : incomingTransition ? 'restaurant-image-in' : ''}`}>
          {isVideoMediaUrl(restaurant.imageUrl) ? (
            <video
              src={restaurant.imageUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="aspect-[21/9] w-full object-cover"
            />
          ) : (
            <img src={restaurant.imageUrl} alt={restaurant.name} className="aspect-[21/9] w-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25" />
          <button
            type="button"
            onClick={() => previousRestaurant && navigateToRestaurant(previousRestaurant, 'previous')}
            disabled={!previousRestaurant || isNavigating}
            className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lacvay-lime/70 disabled:cursor-not-allowed disabled:opacity-40 sm:left-5 sm:h-10 sm:w-10"
            aria-label={previousRestaurant ? `View previous restaurant: ${previousRestaurant.name}` : 'No previous restaurant'}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => nextRestaurant && navigateToRestaurant(nextRestaurant, 'next')}
            disabled={!nextRestaurant || isNavigating}
            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lacvay-lime/70 disabled:cursor-not-allowed disabled:opacity-40 sm:right-5 sm:h-10 sm:w-10"
            aria-label={nextRestaurant ? `View next restaurant: ${nextRestaurant.name}` : 'No next restaurant'}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
      </div>

      <div className={`restaurant-details ${isNavigating ? 'restaurant-details-out' : incomingTransition ? 'restaurant-details-in' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Badge variant="green">Restaurant</Badge>
            {restaurant.priceRange && (
              <Badge variant="gray">{restaurant.priceRange}</Badge>
            )}
            {restaurant.isFeatured && (
              <Badge variant="yellow" className="font-bold">
                ★ Promoted Destination
              </Badge>
            )}
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-600">{restaurant.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleSave}>{isSaved(restaurant.id) ? 'Saved' : 'Save'}</Button>
          <Button onClick={() => navigate(`/assistant?prompt=How+do+I+get+to+${encodeURIComponent(restaurant.name)}`)}>
            <Navigation className="h-4 w-4" /> Directions
          </Button>
        </div>
      </div>

      <Card>
        <p className="text-gray-600 leading-relaxed">{restaurant.description}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {restaurant.openingHours && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Opening Hours</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Clock className="h-4 w-4 text-lacvay-green" /> {restaurant.openingHours}
              </p>
            </div>
          )}
          {restaurant.coordinates && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Coordinates</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                  <Compass className="h-4 w-4 text-lacvay-green shrink-0" /> {restaurant.coordinates.lat.toFixed(4)}, {restaurant.coordinates.lng.toFixed(4)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/map?lat=${restaurant.coordinates!.lat}&lng=${restaurant.coordinates!.lng}&placeId=${restaurant.id}`)}
                  className="h-7 px-2.5 text-xs shrink-0"
                >
                  <Map className="h-3.5 w-3.5" /> Show on map
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Button variant="outline" onClick={() => navigate('/tourist-spots')}>Nearby Tourist Spots →</Button>
      </div>
    </div>
  );
}
