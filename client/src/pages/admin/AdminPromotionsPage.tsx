import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PromotionAdMedia } from '@/components/promotions/PromotionAdMedia';
import { adminService } from '@/services/adminService';
import { useApp } from '@/context/AppContext';
import { isPromotionExpired } from '@/pages/admin/adminPromotionUtils';
import { cn } from '@/lib/utils';
import type { Promotion } from '@/types';

function PromoGridCard({ promotion, onSelect }: { promotion: Promotion; onSelect: () => void }) {
  const expired = isPromotionExpired(promotion.validUntil);
  const unpublished = promotion.isActive === false;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-soft transition hover:-translate-y-0.5 hover:border-lacvay-green/25 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <PromotionAdMedia
          url={promotion.imageUrl}
          title={promotion.title}
          className="transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {promotion.discount && <Badge variant="yellow">{promotion.discount}</Badge>}
          {unpublished && <Badge variant="gray">Draft</Badge>}
          {expired && <Badge variant="gray">Expired</Badge>}
        </div>
        {promotion.promoCode && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="lime">Code: {promotion.promoCode}</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">{promotion.title}</p>
        <p className="line-clamp-2 text-[11px] text-gray-500">{promotion.description}</p>
      </div>
    </button>
  );
}

function PromoDetailModal({
  promotion,
  onClose,
  onDelete,
}: {
  promotion: Promotion;
  onClose: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const expired = isPromotionExpired(promotion.validUntil);

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
            <PromotionAdMedia url={promotion.imageUrl} title={promotion.title} />
          </div>
          <div className="flex flex-col gap-4 p-5 md:p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="yellow">
                  <Megaphone className="mr-1 inline h-3 w-3" />
                  Ad
                </Badge>
                {promotion.discount && <Badge variant="lime">{promotion.discount}</Badge>}
                {promotion.isActive === false && <Badge variant="gray">Draft</Badge>}
                {expired && <Badge variant="gray">Expired</Badge>}
              </div>
              <h2 className="mt-3 text-[22px] font-extrabold leading-tight text-lacvay-green-dark">
                {promotion.title}
              </h2>
            </div>

            <p className="text-[13px] leading-relaxed text-gray-600">{promotion.description}</p>

            <div className="grid gap-2 rounded-2xl bg-lacvay-cream/60 p-4 text-[12.5px]">
              {promotion.promoCode && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-500">Promo code</span>
                  <code className="rounded-lg bg-white px-2 py-1 font-mono text-[12px] font-bold text-lacvay-green-dark">
                    {promotion.promoCode}
                  </code>
                </div>
              )}
              {promotion.validUntil && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-500">Valid until</span>
                  <span className="font-medium text-gray-800">{promotion.validUntil}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Status</span>
                <span className="font-medium text-gray-800">
                  {promotion.isActive === false ? 'Draft (hidden)' : expired ? 'Expired' : 'Live'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-500">Media</span>
                <span className="font-medium text-gray-800">{promotion.imageUrl ? 'Attached' : 'None'}</span>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/admin/promotions/${promotion.id}/edit`);
                }}
              >
                Edit ad
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

export default function AdminPromotionsPage() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPromotions(await adminService.listPromotions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (promotion: Promotion) => {
    if (!window.confirm(`Delete "${promotion.title}"?`)) return;
    try {
      await adminService.deletePromotion(promotion.id);
      setSelectedPromotion(null);
      await refresh();
      showToast('Ad deleted');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleWipeAll = async () => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete all ${promotions.length} promotions from the database? This cannot be undone.`,
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await adminService.clearAllPromotions();
      setSelectedPromotion(null);
      await refresh();
      showToast('All promotions have been wiped from the database');
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
        title="Promotions"
        description="Manage ad creatives shown to travelers. Each promotion can include image or video media."
        actions={
          <div className="flex items-center gap-2">
            {promotions.length > 0 && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                onClick={() => void handleWipeAll()}
              >
                <Trash2 className="h-4 w-4" />
                Wipe all ({promotions.length})
              </Button>
            )}
            <Button onClick={() => navigate('/admin/promotions/new')}>
              <Plus className="h-4 w-4" />
              Create ad
            </Button>
          </div>
        }
      />

      {promotions.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No ads yet"
            description="Create your first promotion ad to show it in the catalog grid."
          />
          <div className="flex justify-center">
            <Button onClick={() => navigate('/admin/promotions/new')}>
              <Plus className="h-4 w-4" />
              Create ad
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
          {promotions.map((promotion) => (
            <PromoGridCard
              key={promotion.id}
              promotion={promotion}
              onSelect={() => setSelectedPromotion(promotion)}
            />
          ))}
        </div>
      )}

      {selectedPromotion && (
        <PromoDetailModal
          promotion={selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
          onDelete={() => void remove(selectedPromotion)}
        />
      )}
    </div>
  );
}
