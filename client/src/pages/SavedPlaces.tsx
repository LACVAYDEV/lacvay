import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { favoritesService } from '@/services/favoritesService';
import { PlaceCard } from '@/components/places/PlaceCard';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { UserFavorite } from '@/types';

export default function SavedPlaces() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    favoritesService
      .getUserFavorites(user.id)
      .then((data) => {
        if (isMounted) {
          setFavorites(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load user favorites:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleFavoriteToggle = (placeId: string, isFavorited: boolean) => {
    // If user unfavorited from this page, optimistically filter it out
    if (!isFavorited) {
      setFavorites((prev) => prev.filter((f) => f.place_id !== placeId));
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Places</h2>
          <p className="text-sm text-gray-500">Your bookmarked spots across Batangas City</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-card">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lacvay-green/10 text-lacvay-green">
            <Bookmark className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Sign in to view saved places</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Sign in with your LACVAY account to sync your favorite tourist spots and attractions across devices.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 rounded-2xl bg-lacvay-green px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-lacvay-green-dark"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">Saved Places</h2>
            <span className="flex h-6 items-center justify-center rounded-full bg-lacvay-green/10 px-2.5 text-xs font-bold text-lacvay-green">
              {favorites.length}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Personalized bookmarks synced to your account
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tourist-spots')}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-soft transition hover:border-lacvay-green hover:text-lacvay-green"
        >
          <Compass className="h-4 w-4" />
          Discover More Spots
        </button>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="No saved places yet"
          description="Click the heart icon on any tourist spot or attraction to save it here for quick access."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const placeData = fav.places || fav.place;
            if (!placeData) return null;

            return (
              <PlaceCard
                key={fav.id}
                place={{
                  id: placeData.id,
                  name: placeData.name,
                  description: placeData.description,
                  category: placeData.category,
                  image_url: placeData.image_url,
                  location: 'Batangas City',
                }}
                isFavorited={true}
                onFavoriteChange={handleFavoriteToggle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
