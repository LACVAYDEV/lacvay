import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { favoritesService } from '@/services/favoritesService';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { Place } from '@/types';

export interface PlaceCardProps {
  place: Partial<Place> & {
    id: string;
    name: string;
    description?: string | null;
    category?: string;
    image_url?: string | null;
    rating?: number;
    location?: string;
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

  const handleHeartClick = async (e: MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      showToast('Please sign in to save your favorite places');
      return;
    }

    // 1. Optimistic UI update
    const previousState = favorited;
    const nextState = !previousState;
    setFavorited(nextState);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);

    onFavoriteChange?.(place.id, nextState);
    showToast(nextState ? `Saved ${place.name} to bookmarks` : `Removed ${place.name} from bookmarks`);

    // 2. Call backend service
    try {
      const serverResult = await favoritesService.toggleFavorite(user.id, place.id);
      // Ensure local state synchronizes with server response
      if (serverResult !== nextState) {
        setFavorited(serverResult);
        onFavoriteChange?.(place.id, serverResult);
      }
    } catch (error) {
      // 3. Rollback on failure
      console.error('Failed to toggle favorite:', error);
      setFavorited(previousState);
      onFavoriteChange?.(place.id, previousState);
      showToast('Failed to update bookmark. Please try again.');
    }
  };

  const handleCardClick = () => {
    navigate(`/tourist-spots/${place.id}`);
  };

  const imageUrl =
    place.image_url ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80';

  return (
    <Card
      padding="sm"
      className={cn(
        'group relative flex flex-col overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-card',
        className,
      )}
    >
      {/* Image & Heart Button Overlay */}
      <div
        onClick={handleCardClick}
        className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-gray-100"
      >
        <img
          src={imageUrl}
          alt={place.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay for contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {place.category && (
            <Badge className="border-0 bg-lacvay-green/90 text-white shadow-sm backdrop-blur-md">
              {place.category}
            </Badge>
          )}
        </div>

        {/* Heart Toggle Button */}
        <button
          type="button"
          aria-label={favorited ? 'Remove from bookmarks' : 'Add to bookmarks'}
          onClick={handleHeartClick}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-200',
            favorited
              ? 'border-rose-300 bg-rose-50/95 text-rose-500 shadow-rose-200/50 hover:bg-rose-100'
              : 'border-white/40 bg-white/80 text-gray-600 hover:scale-105 hover:bg-white hover:text-rose-500',
            isPulsing && 'scale-125',
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              favorited && 'fill-current scale-110',
            )}
          />
        </button>

        {/* Bottom Bar on image: Rating / Featured */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          {place.rating ? (
            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {place.rating}
            </span>
          ) : <span />}
        </div>
      </div>

      {/* Place Details */}
      <div className="flex flex-1 flex-col p-4">
        <h3
          onClick={handleCardClick}
          className="cursor-pointer text-[15px] font-bold text-gray-900 transition-colors group-hover:text-lacvay-green line-clamp-1"
        >
          {place.name}
        </h3>

        {place.location && (
          <p className="mt-1 flex items-center gap-1 text-[12px] text-gray-500 line-clamp-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {place.location}
          </p>
        )}

        {place.description && (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-gray-600">
            {place.description}
          </p>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleCardClick}
            className="w-full rounded-xl bg-lacvay-green/10 py-2.5 text-[13px] font-bold text-lacvay-green transition-all hover:bg-lacvay-green hover:text-white"
          >
            Explore Destination
          </button>
        </div>
      </div>
    </Card>
  );
}
