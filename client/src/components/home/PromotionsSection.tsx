import { useEffect, useState } from 'react';
import { CalendarClock, Copy, Tag, X } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Promotion } from '@/types';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PromotionAdMedia } from '@/components/promotions/PromotionAdMedia';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function PromotionsSection() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useApp();

  useEffect(() => {
    let mounted = true;

    dataService
      .getPromotions()
      .then((list) => {
        if (mounted) {
          setPromos(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching promotions:', err);
        if (mounted) {
          setPromos([]);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || promos.length === 0) {
    return null;
  }

  return (
    <>
      <Card padding="sm" className="h-full overflow-hidden p-3.5 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">Featured Deals & Promotions</h3>
              <p className="text-[11.5px] text-gray-500">Commuter discounts, partner offers, and seasonal deals</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-amber-800">
            {promos.length} {promos.length === 1 ? 'deal' : 'deals'}
          </span>
        </div>

        <div
          className={cn(
            'grid gap-3 sm:gap-4',
            promos.length === 1
              ? 'grid-cols-1'
              : promos.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {promos.map((promo) => (
            <div
              key={promo.id}
              onClick={() => setSelectedPromo(promo)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPromo(promo);
                }
              }}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-100 cursor-pointer hover:opacity-95 transition-opacity bg-white"
            >
              {/* Edge-to-edge media banner: no borders, spans 100% full width */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-lacvay-cream">
                <PromotionAdMedia url={promo.imageUrl} title={promo.title} />
                {promo.discount && (
                  <div className="absolute left-2.5 top-2.5">
                    <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm backdrop-blur">
                      {promo.discount}
                    </span>
                  </div>
                )}
              </div>

              {/* Minimal text details below media */}
              <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Featured Deal
                    </span>
                    {promo.promoCode && (
                      <span className="font-mono text-[11px] font-bold text-gray-700 bg-gray-100 rounded-md px-1.5 py-0.5">
                        {promo.promoCode}
                      </span>
                    )}
                  </div>

                  <h4 className="mt-2 text-[14px] font-bold text-gray-900 group-hover:text-lacvay-green transition line-clamp-1">
                    {promo.title}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-gray-500">
                    {promo.description}
                  </p>
                </div>

                {promo.validUntil && (
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] text-gray-400">
                    <CalendarClock className="h-3 w-3 text-lacvay-green shrink-0" />
                    <span>Until {promo.validUntil}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* View Better Detail Modal */}
      {selectedPromo && (
        <Modal
          open={Boolean(selectedPromo)}
          onClose={() => setSelectedPromo(null)}
          size="lg"
          className="max-w-xl sm:max-w-2xl overflow-hidden rounded-lg"
        >
          <div className="relative">
            {/* Top close button overlay */}
            <button
              type="button"
              onClick={() => setSelectedPromo(null)}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Full-size un-cropped image/video */}
            {selectedPromo.imageUrl ? (
              <div className="relative w-full max-h-[55vh] flex items-center justify-center bg-black/5 overflow-hidden">
                <PromotionAdMedia
                  url={selectedPromo.imageUrl}
                  title={selectedPromo.title}
                  className="w-full max-h-[55vh] object-contain"
                  mediaClassName="w-full max-h-[55vh] object-contain"
                />
              </div>
            ) : null}

            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Badges row: discount and verified tag */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedPromo.discount && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
                    <Tag className="h-3.5 w-3.5" />
                    {selectedPromo.discount}
                  </span>
                )}
                <span className="rounded-md bg-lacvay-green/10 px-2.5 py-0.5 text-[11px] font-bold text-lacvay-green-dark">
                  Verified Promotion
                </span>
              </div>

              {/* Prominent Promo Code badge with Copy action */}
              {selectedPromo.promoCode && (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-500/10 border-2 border-dashed border-amber-300 p-3 sm:p-3.5">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-amber-800">
                      Promotional Voucher Code
                    </p>
                    <code className="text-base sm:text-lg font-mono font-extrabold text-amber-900 tracking-wide">
                      {selectedPromo.promoCode}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard?.writeText(selectedPromo.promoCode!);
                      showToast('Promo code copied!');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Code
                  </Button>
                </div>
              )}

              {/* Ad title and Ad copy */}
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
                  {selectedPromo.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {selectedPromo.description}
                </p>
              </div>

              {/* Validity info */}
              {selectedPromo.validUntil && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <CalendarClock className="h-4 w-4 text-lacvay-green shrink-0" />
                  <span>
                    Valid until <strong className="font-semibold text-gray-700">{selectedPromo.validUntil}</strong>
                  </span>
                </div>
              )}

              {/* Clear Close button */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedPromo(null)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
