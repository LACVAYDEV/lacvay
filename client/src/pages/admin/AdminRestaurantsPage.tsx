import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, Trash2, X } from 'lucide-react';
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
        <div className="absolute left-2 top-2 flex flex-col gap-1 items-start">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur shadow-sm',
              restaurant.isOpen
                ? 'bg-emerald-500/90 text-white'
                : 'bg-rose-500/90 text-white',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full bg-white', restaurant.isOpen && 'animate-pulse')} />
            {restaurant.isOpen ? 'Open' : 'Closed'}
          </span>
          {restaurant.isFeatured && (
            <Badge variant="yellow" className="shadow-sm">
              ★ Promoted
            </Badge>
          )}
        </div>
        {restaurant.priceRange && (
          <div className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-lacvay-green shadow-sm">
            {restaurant.priceRange}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">{restaurant.name}</p>
        {restaurant.openingHours && (
          <p className="flex items-center gap-1 truncate text-[11px] text-gray-500">
            <Clock className="h-3 w-3 shrink-0 text-lacvay-green" />
            {restaurant.openingHours}
          </p>
        )}
      </div>
    </button>
  );
}

function EateryDetailModal({
  restaurant,
  onClose,
  onDelete,
  onTogglePromote,
}: {
  restaurant: Restaurant;
  onClose: () => void;
  onDelete: () => void;
  onTogglePromote: () => void;
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
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
                    restaurant.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', restaurant.isOpen ? 'bg-emerald-500' : 'bg-rose-500')} />
                  {restaurant.isOpen ? 'Currently Open' : 'Currently Closed'}
                </span>
                {restaurant.isFeatured && (
                  <Badge variant="yellow">★ Promoted Eatery</Badge>
                )}
                {restaurant.priceRange && (
                  <Badge variant="lime">{restaurant.priceRange}</Badge>
                )}
              </div>
              <h2 className="mt-3 text-[22px] font-extrabold leading-tight text-lacvay-green-dark">
                {restaurant.name}
              </h2>
            </div>

            {restaurant.description && (
              <p className="text-[13px] leading-relaxed text-gray-600">{restaurant.description}</p>
            )}

            <div className="grid gap-2 rounded-2xl bg-lacvay-cream/60 p-4 text-[12.5px]">
              {restaurant.priceRange && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-500">Price range</span>
                  <span className="font-medium text-gray-800">{restaurant.priceRange}</span>
                </div>
              )}
              {restaurant.openingHours && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-500">Opening hours</span>
                  <span className="flex items-center gap-1.5 font-medium text-gray-800">
                    <Clock className="h-3.5 w-3.5 text-lacvay-green" />
                    {restaurant.openingHours}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Live Status</span>
                <span className="font-medium text-gray-800">{restaurant.isOpen ? 'Open Now' : 'Closed Now'}</span>
              </div>
              {restaurant.coordinates && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-500">Coordinates</span>
                  <span className="font-medium text-gray-800">
                    {restaurant.coordinates.lat.toFixed(4)}, {restaurant.coordinates.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button
                variant={restaurant.isFeatured ? 'outline' : 'secondary'}
                size="sm"
                className={cn(
                  'transition-all font-semibold',
                  restaurant.isFeatured
                    ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                    : 'border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/60'
                )}
                onClick={onTogglePromote}
              >
                {restaurant.isFeatured ? 'Demote' : '★ Promote eatery'}
              </Button>
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

  const handleTogglePromote = async (restaurant: Restaurant) => {
    try {
      const nextFeatured = !restaurant.isFeatured;
      const updated: Restaurant = { ...restaurant, isFeatured: nextFeatured };
      await adminService.updateRestaurant(updated);
      showToast(nextFeatured ? `"${restaurant.name}" is now promoted!` : `"${restaurant.name}" promotion removed`);
      setSelectedRestaurant(updated);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update promotion status');
    }
  };

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

  const handleWipeAll = async () => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete all ${restaurants.length} eateries from the database? This cannot be undone.`,
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await adminService.clearAllPlaces();
      setSelectedRestaurant(null);
      await refresh();
      showToast('All eateries have been wiped from the database');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Wipe failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Eateries"
        description="Browse restaurants in a catalog view. Add new listings or open one for full details."
        actions={
          <div className="flex items-center gap-2">
            {restaurants.length > 0 && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                onClick={() => void handleWipeAll()}
              >
                <Trash2 className="h-4 w-4" />
                Wipe all ({restaurants.length})
              </Button>
            )}
            <Button onClick={() => navigate('/admin/restaurants/new')}>
              <Plus className="h-4 w-4" />
              Add eatery
            </Button>
          </div>
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
          onTogglePromote={() => void handleTogglePromote(selectedRestaurant)}
        />
      )}
    </div>
  );
}
