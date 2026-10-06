import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { AdminCatalogSearch } from '@/components/admin/AdminCatalogSearch';
import { adminService } from '@/services/adminService';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { isVideoMediaUrl } from '@/lib/mediaUtils';
import type { TouristSpot } from '@/types';

function SpotGridCard({ spot, onSelect }: { spot: TouristSpot; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-soft transition hover:-translate-y-0.5 hover:border-lacvay-green/25 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        {isVideoMediaUrl(spot.imageUrl) ? (
          <video
            src={spot.imageUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
            loop
          />
        ) : (
          <img
            src={spot.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1 items-start">
          <Badge variant="lime">{spot.category}</Badge>
          {spot.isFeatured && (
            <Badge variant="yellow" className="shadow-sm">
              ★ Promoted
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">{spot.name}</p>
        {spot.openingHours && (
          <p className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
            <Clock className="h-3 w-3 shrink-0 text-lacvay-green" />
            {spot.openingHours}
          </p>
        )}
      </div>
    </button>
  );
}

function SpotDetailModal({
  spot,
  onClose,
  onDelete,
  onTogglePromote,
}: {
  spot: TouristSpot;
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
          {isVideoMediaUrl(spot.imageUrl) ? (
            <video src={spot.imageUrl} controls className="h-full w-full object-cover" />
          ) : (
            <img src={spot.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-col gap-4 p-5 md:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime">{spot.category}</Badge>
              {spot.isFeatured && <Badge variant="yellow">★ Promoted Destination</Badge>}
            </div>
            <h2 className="mt-3 text-[22px] font-extrabold leading-tight text-lacvay-green-dark">{spot.name}</h2>
          </div>

          {spot.shortDescription && (
            <p className="text-[13.5px] font-medium text-gray-700">{spot.shortDescription}</p>
          )}

          {spot.description && (
            <p className="text-[13px] leading-relaxed text-gray-600">{spot.description}</p>
          )}

          <div className="grid gap-2 rounded-2xl bg-lacvay-cream/60 p-4 text-[12.5px]">
            {spot.openingHours && (
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Opening hours</span>
                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                  <Clock className="h-3.5 w-3.5 text-lacvay-green" />
                  {spot.openingHours}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-500">Coordinates</span>
              <span className="font-medium text-gray-800">
                {spot.coordinates.lat.toFixed(4)}, {spot.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              variant={spot.isFeatured ? 'outline' : 'secondary'}
              size="sm"
              className={cn(
                'transition-all font-semibold',
                spot.isFeatured
                  ? 'border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100'
                  : 'border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/60'
              )}
              onClick={onTogglePromote}
            >
              {spot.isFeatured ? 'Demote' : '★ Promote destination'}
            </Button>
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
  const confirm = useConfirmDialog();
  const [places, setPlaces] = useState<TouristSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return places;
    return places.filter((spot) => {
      const haystack = [
        spot.name,
        spot.category,
        spot.categoryLabel,
        spot.location,
        spot.shortDescription,
        spot.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [places, searchQuery]);

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

  const handleTogglePromote = async (spot: TouristSpot) => {
    try {
      const nextFeatured = !spot.isFeatured;
      const updated: TouristSpot = { ...spot, isFeatured: nextFeatured };
      await adminService.updatePlace(updated);
      showToast(nextFeatured ? `"${spot.name}" is now promoted!` : `"${spot.name}" promotion removed`);
      setSelectedSpot(updated);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update promotion status');
    }
  };

  const remove = async (spot: TouristSpot) => {
    const confirmed = await confirm({
      title: 'Delete destination?',
      description: `"${spot.name}" will be permanently deleted.`,
      confirmLabel: 'Delete destination',
    });
    if (!confirmed) return;
    try {
      await adminService.deletePlace(spot.id);
      setSelectedSpot(null);
      await refresh();
      showToast('Tourist spot deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleWipeAll = async () => {
    const confirmed = await confirm({
      title: 'Delete all destinations?',
      description: `All ${places.length} destinations will be permanently deleted from the database. This action cannot be undone.`,
      confirmLabel: 'Delete all',
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      await adminService.clearAllPlaces();
      setSelectedSpot(null);
      await refresh();
      showToast('All destinations have been wiped from the database');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Wipe failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-3">
      {places.length > 0 && (
        <AdminCatalogSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search spots by name, category, or location…"
          aria-label="Search tourist spots"
          trailing={
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-1 border-red-200 px-2.5 text-red-600 hover:border-red-300 hover:bg-red-50 sm:inline-flex"
                onClick={() => void handleWipeAll()}
              >
                <Trash2 className="h-4 w-4" />
                Wipe all
              </Button>
              <Button size="sm" className="gap-1 whitespace-nowrap px-3" onClick={() => navigate('/admin/places/new')}>
                <Plus className="h-4 w-4" />
                Add spot
              </Button>
            </div>
          }
        />
      )}

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
      ) : filteredPlaces.length === 0 ? (
        <EmptyState
          title="No matching spots"
          description="Try a different name, category, or location."
        />
      ) : (
        <div
          className={cn(
            'grid gap-3 sm:gap-4',
            'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
          )}
        >
          {filteredPlaces.map((spot) => (
            <SpotGridCard key={spot.id} spot={spot} onSelect={() => setSelectedSpot(spot)} />
          ))}
        </div>
      )}

      {selectedSpot && (
        <SpotDetailModal
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onDelete={() => void remove(selectedSpot)}
          onTogglePromote={() => void handleTogglePromote(selectedSpot)}
        />
      )}
    </div>
  );
}
