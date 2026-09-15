import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Plus, Star, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { adminService } from '@/services/adminService';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';

function EateryGridCard({ restaurant, onSelect }: { restaurant: Restaurant; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-soft transition hover:-translate-y-0.5 hover:border-lacvay-green/25 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={restaurant.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
          {restaurant.cuisine.slice(0, 2).map((c) => (
            <Badge key={c} variant="lime">
              {c}
            </Badge>
          ))}
        </div>
        {!restaurant.isOpen && (
          <div className="absolute right-2 top-2">
            <Badge variant="gray">Closed</Badge>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-lacvay-yellow shadow-sm">
          <Star className="h-3 w-3 fill-current" />
          {restaurant.rating.toFixed(1)}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">{restaurant.name}</p>
        <p className="flex items-center gap-1 truncate text-[11px] text-gray-500">
          <MapPin className="h-3 w-3 shrink-0" />
          {restaurant.location}
        </p>
        <p className="text-[11px] font-semibold text-lacvay-green">{restaurant.priceRange}</p>
      </div>
    </button>
  );
}

function EateryDetailModal({
  restaurant,
  onClose,
  onDelete,
}: {
  restaurant: Restaurant;
  onClose: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Modal open onClose={onClose} size="xl">
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-gray-600 shadow-sm transition hover:bg-white hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="relative aspect-[4/3] bg-gray-100 md:aspect-auto md:min-h-[420px]">
            <img src={restaurant.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-4 p-5 md:p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {restaurant.cuisine.map((c) => (
                  <Badge key={c} variant="lime">
                    {c}
                  </Badge>
                ))}
                <span className="inline-flex items-center gap-1 text-[13px] font-bold text-lacvay-yellow">
                  <Star className="h-4 w-4 fill-current" />
                  {restaurant.rating.toFixed(1)}
                </span>
                {!restaurant.isOpen && <Badge variant="gray">Closed</Badge>}
              </div>
              <h2 className="mt-3 text-[22px] font-extrabold leading-tight text-lacvay-green-dark">
                {restaurant.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-[13px] text-gray-500">
                <MapPin className="h-4 w-4 shrink-0" />
                {restaurant.location}
              </p>
            </div>

            {restaurant.description && (
              <p className="text-[13px] leading-relaxed text-gray-600">{restaurant.description}</p>
            )}

            <div className="grid gap-2 rounded-2xl bg-lacvay-cream/60 p-4 text-[12.5px]">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Price range</span>
                <span className="font-medium text-gray-800">{restaurant.priceRange}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Distance</span>
                <span className="font-medium text-gray-800">{restaurant.distanceKm} km</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Opening hours</span>
                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                  <Clock className="h-3.5 w-3.5 text-lacvay-green" />
                  {restaurant.openingHours}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Status</span>
                <span className="font-medium text-gray-800">{restaurant.isOpen ? 'Open' : 'Closed'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Coordinates</span>
                <span className="font-medium text-gray-800">
                  {restaurant.coordinates.lat.toFixed(4)}, {restaurant.coordinates.lng.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/admin/restaurants/${restaurant.id}/edit`);
                }}
              >
                Edit eatery
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminRestaurantsPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRestaurants(await adminService.listRestaurants());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (restaurant: Restaurant) => {
    if (!window.confirm(`Delete "${restaurant.name}"?`)) return;
    try {
      await adminService.deleteRestaurant(restaurant.id);
      setSelectedRestaurant(null);
      await refresh();
      showToast('Eatery deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Eateries"
        description="Browse restaurants in a catalog view. Add new listings or open one for full details."
        actions={
          <Button onClick={() => navigate('/admin/restaurants/new')}>
            <Plus className="h-4 w-4" />
            Add eatery
          </Button>
        }
      />

      {restaurants.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No eateries yet"
            description="Create your first restaurant to show it in the catalog grid."
          />
          <div className="flex justify-center">
            <Button onClick={() => navigate('/admin/restaurants/new')}>
              <Plus className="h-4 w-4" />
              Add eatery
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-3 sm:gap-4',
            'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
          )}
        >
          {restaurants.map((restaurant) => (
            <EateryGridCard
              key={restaurant.id}
              restaurant={restaurant}
              onSelect={() => setSelectedRestaurant(restaurant)}
            />
          ))}
        </div>
      )}

      {selectedRestaurant && (
        <EateryDetailModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          onDelete={() => void remove(selectedRestaurant)}
        />
      )}
    </div>
  );
}
