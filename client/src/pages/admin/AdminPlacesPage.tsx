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
import type { TouristSpot } from '@/types';

function SpotGridCard({ spot, onSelect }: { spot: TouristSpot; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-soft transition hover:-translate-y-0.5 hover:border-lacvay-green/25 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={spot.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2">
          <Badge className="border-0 bg-lacvay-green/90 text-white shadow-sm backdrop-blur-md">{spot.category}</Badge>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-lacvay-yellow shadow-sm">
          <Star className="h-3 w-3 fill-current" />
          {spot.rating.toFixed(1)}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">{spot.name}</p>
        <p className="flex items-center gap-1 truncate text-[11px] text-gray-500">
          <MapPin className="h-3 w-3 shrink-0" />
          {spot.location}
        </p>
      </div>
    </button>
  );
}

function SpotDetailModal({
  spot,
  onClose,
  onDelete,
}: {
  spot: TouristSpot;
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
          <img src={spot.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-4 p-5 md:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime">{spot.category}</Badge>
              <span className="inline-flex items-center gap-1 text-[13px] font-bold text-lacvay-yellow">
                <Star className="h-4 w-4 fill-current" />
                {spot.rating.toFixed(1)}
              </span>
            </div>
            <h2 className="mt-3 text-[22px] font-extrabold leading-tight text-lacvay-green-dark">{spot.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-gray-500">
              <MapPin className="h-4 w-4 shrink-0" />
              {spot.location}
            </p>
          </div>

          {spot.shortDescription && (
            <p className="text-[13.5px] font-medium text-gray-700">{spot.shortDescription}</p>
          )}

          {spot.description && (
            <p className="text-[13px] leading-relaxed text-gray-600">{spot.description}</p>
          )}

          <div className="grid gap-2 rounded-2xl bg-lacvay-cream/60 p-4 text-[12.5px]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-500">Opening hours</span>
              <span className="flex items-center gap-1.5 font-medium text-gray-800">
                <Clock className="h-3.5 w-3.5 text-lacvay-green" />
                {spot.openingHours}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-500">Travel time</span>
              <span className="font-medium text-gray-800">{spot.estimatedTravelTime}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-500">Coordinates</span>
              <span className="font-medium text-gray-800">
                {spot.coordinates.lat.toFixed(4)}, {spot.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                navigate(`/admin/places/${spot.id}/edit`);
              }}
            >
              Edit spot
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

export default function AdminPlacesPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [places, setPlaces] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPlaces(await adminService.listPlaces());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (spot: TouristSpot) => {
    if (!window.confirm(`Delete "${spot.name}"?`)) return;
    try {
      await adminService.deletePlace(spot.id);
      setSelectedSpot(null);
      await refresh();
      showToast('Tourist spot deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tourist Spots"
        description="Browse destinations in a catalog view. Add new spots or open one for full details."
        actions={
          <Button onClick={() => navigate('/admin/places/new')}>
            <Plus className="h-4 w-4" />
            Add spot
          </Button>
        }
      />

      {places.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No tourist spots yet"
            description="Create your first destination to show it in the catalog grid."
          />
          <div className="flex justify-center">
            <Button onClick={() => navigate('/admin/places/new')}>
              <Plus className="h-4 w-4" />
              Add spot
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
          {places.map((spot) => (
            <SpotGridCard key={spot.id} spot={spot} onSelect={() => setSelectedSpot(spot)} />
          ))}
        </div>
      )}

      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onDelete={() => void remove(selectedSpot)}
        />
      )}
    </div>
  );
}
