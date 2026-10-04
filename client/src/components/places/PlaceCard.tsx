import { useState, useEffect, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, Navigation, Map, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { favoritesService } from '@/services/favoritesService';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { isVideoMediaUrl } from '@/lib/mediaUtils';
import type { Place, Coordinates } from '@/types';

export interface PlaceCardProps {
  place: Partial<Place> & {
    id: string;
    name: string;
    description?: string | null;
    category?: string;
    image_url?: string | null;
    imageUrl?: string;
    rating?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    coordinates?: Coordinates;
    isOpen?: boolean;
    is_restaurant?: boolean;
    type?: 'restaurant' | 'tourist-spot' | string;
    priceRange?: string;
    openingHours?: string;
    isFeatured?: boolean;
  };
  isFavorited?: boolean;
  onFavoriteChange?: (placeId: string, isFavorited: boolean) => void;
  className?: string;
}

export function PlaceCard({
  place,
  isFavorited: initialFavorited = false,
  onFavoriteChange,
  className,
}: PlaceCardProps) {
  const { user } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleHeartClick = async (e: MouseEvent) => {
    e.stopPropagation();

    // 1. Optimistic UI update
    const previousState = favorited;
    const nextState = !previousState;
    setFavorited(nextState);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);

    onFavoriteChange?.(place.id, nextState);
    showToast(nextState ? `Saved ${place.name} to bookmarks` : `Removed ${place.name} from bookmarks`);

    // 2. Call backend service if user is signed in
    if (user) {
      try {
        const serverResult = await favoritesService.toggleFavorite(user.id, place.id);
        if (serverResult !== nextState) {
          setFavorited(serverResult);
          onFavoriteChange?.(place.id, serverResult);
        }
      } catch (error) {
        console.warn('Could not sync favorite to Supabase:', error);
      }
    }
  };

  const isRestaurant =
    place.isOpen !== undefined ||
    place.type === 'restaurant' ||
    place.category === 'Restaurant';

  const handleCardClick = () => {
    navigate(`/${isRestaurant ? 'restaurants' : 'tourist-spots'}/${place.id}`);
  };

  const imageUrl =
    place.image_url ||
    place.imageUrl ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';

  const lat = place.lat ?? place.latitude ?? place.coordinates?.lat;
  const lng = place.lng ?? place.longitude ?? place.coordinates?.lng;

  return (
    <Card
      padding="sm"
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white p-0 shadow-sm transition-colors duration-200 hover:border-gray-200',
        className,
      )}
    >
      {/* Image & Heart Button Overlay */}
      <div
        onClick={handleCardClick}
        className={cn(
          'relative aspect-[16/10] w-full overflow-hidden bg-gray-100',
          !isRestaurant && 'cursor-pointer',
        )}
      >
        {isVideoMediaUrl(imageUrl) ? (
          <video
            src={imageUrl}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={imageUrl}
            alt={place.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
        )}

        {/* Gradient overlay for contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Top-Left Badges: Open/Closed for restaurants, Category for tourist spots */}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {isRestaurant ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold shadow-sm backdrop-blur',
                place.isOpen
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-rose-500/90 text-white',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full bg-white', place.isOpen && 'animate-pulse')} />
              {place.isOpen ? 'Open Now' : 'Closed'}
            </span>
          ) : (
            place.category && (
              <Badge className="border-0 rounded-md bg-lacvay-green/90 text-white shadow-sm backdrop-blur-md">
                {place.category}
              </Badge>
            )
          )}
          {(place.is_featured || place.isFeatured) && (
            <Badge variant="yellow" className="rounded-md backdrop-blur-md shadow-sm font-bold">
              ★ Promoted
            </Badge>
          )}
        </div>

        {/* Top-Right Heart Icon */}
        <button
          type="button"
          aria-label={favorited ? 'Remove from bookmarks' : 'Add to bookmarks'}
          onClick={handleHeartClick}
          className={cn(
            'absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-200',
            favorited
              ? 'border-rose-300 bg-rose-50/95 text-rose-500'
              : 'border-white/40 bg-white/80 text-gray-600 hover:bg-white hover:text-rose-500',
            isPulsing && 'scale-110',
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              favorited && 'fill-current scale-110',
            )}
          />
        </button>

        {/* Bottom Bar on image: Rating / Price Range */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white pointer-events-none">
          {place.rating ? (
            <span className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {place.rating}
            </span>
          ) : <span />}

          {place.priceRange && (
            <span className="rounded-md bg-white/95 px-2.5 py-0.5 text-xs font-bold text-lacvay-green shadow-sm">
              {place.priceRange}
            </span>
          )}
        </div>
      </div>

      {/* Place Details */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <h3
          onClick={handleCardClick}
          className={cn(
            'text-[15px] font-bold text-gray-900 transition-colors line-clamp-1',
            !isRestaurant && 'cursor-pointer group-hover:text-lacvay-green',
          )}
        >
          {place.name}
        </h3>

        {place.location && (
          <p className="mt-1 flex items-center gap-1 text-[12px] text-gray-500 line-clamp-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {place.location}
          </p>
        )}

        {place.openingHours && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 text-lacvay-green shrink-0" />
            <span>{place.openingHours}</span>
          </div>
        )}

        {place.description && (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-gray-600">
            {place.description}
          </p>
        )}

        {/* Bottom Action Buttons */}
        <div className="mt-auto pt-3 flex items-center gap-2">
          {/* Primary Button ("Directions") */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/ai-assistant?prompt=How+to+get+to+' + encodeURIComponent(place.name));
            }}
            className="flex h-10 w-full flex-1 items-center justify-center gap-1.5 rounded-lg bg-lacvay-green px-3 text-xs font-bold text-white transition hover:bg-lacvay-green-dark"
          >
            <Navigation className="h-3.5 w-3.5" />
            Directions
          </button>

          {/* Secondary/Outline Button ("Explore") */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                lat != null && lng != null
                  ? '/map?lat=' + lat + '&lng=' + lng
                  : '/map'
              );
            }}
            className="flex h-10 w-full flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:border-lacvay-green hover:text-lacvay-green"
          >
            <Map className="h-3.5 w-3.5" />
            Explore
          </button>
        </div>
      </div>
    </Card>
  );
}
