import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Sparkles } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Promotion } from '@/types';
import { Card } from '@/components/ui/Card';
import { PromotionAdMedia } from '@/components/promotions/PromotionAdMedia';

export function PromotionsSection() {
  const navigate = useNavigate();
  const [promos, setPromos] = useState<Promotion[]>([]);

  useEffect(() => {
    dataService.getPromotions().then((list) => setPromos(list.slice(0, 2)));
  }, []);

  const promo1 = promos[0] ?? null;
  const promo2 = promos[1] ?? null;

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-amber-500" />
            <h3 className="text-[15px] font-bold text-gray-900">Local Promotions & Offers</h3>
          </div>
          <p className="text-[11.5px] text-gray-500">Commuter discounts, partner offers, and seasonal deals</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/promotions')}
          className="text-[12px] font-semibold text-lacvay-green hover:underline shrink-0 ml-2"
        >
          View All
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {promo1 && (
          <button
            type="button"
            onClick={() => navigate('/promotions')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/40 p-4 text-left transition duration-200 hover:shadow-md border border-amber-200/60 flex flex-col justify-between"
          >
            {promo1.imageUrl ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                <PromotionAdMedia url={promo1.imageUrl} title={promo1.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="text-[14px] font-extrabold text-white">{promo1.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-white/90">{promo1.description}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    Featured Deal
                  </span>
                  {promo1.discount && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10.5px] font-extrabold text-white">
                      {promo1.discount}
                    </span>
                  )}
                </div>
                <h4 className="mt-2.5 text-[14px] font-extrabold text-gray-900 group-hover:text-amber-700">
                  {promo1.title}
                </h4>
                <p className="mt-1 text-[11.5px] leading-relaxed text-gray-600">
                  {promo1.description}
                </p>
              </div>
            )}

            <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-amber-200/50">
              {promo1.promoCode ? (
                <span className="inline-block rounded-lg bg-white px-2.5 py-1 text-[11px] font-mono font-bold text-gray-800 shadow-sm border border-amber-200">
                  Code: {promo1.promoCode}
                </span>
              ) : <div />}
              <span className="text-[11px] font-bold text-amber-700 group-hover:underline">
                Claim Offer →
              </span>
            </div>
          </button>
        )}

        {promo2 ? (
          <button
            type="button"
            onClick={() => navigate('/promotions')}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-lacvay-blush via-lacvay-blush/50 to-white p-4 text-left transition duration-200 hover:shadow-md border border-lacvay-green/15 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-lacvay-green/15 px-2.5 py-0.5 text-[10px] font-bold text-lacvay-green-dark">
                  Commuter Special
                </span>
                {promo2.discount && (
                  <span className="rounded-full bg-lacvay-green px-2 py-0.5 text-[10.5px] font-extrabold text-white">
                    {promo2.discount}
                  </span>
                )}
              </div>
              <h4 className="mt-2.5 text-[14px] font-extrabold text-gray-900 group-hover:text-lacvay-green-dark">
                {promo2.title}
              </h4>
              <p className="mt-1 text-[11.5px] leading-relaxed text-gray-600">
                {promo2.description}
              </p>
            </div>

            <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-lacvay-green/10">
              {promo2.promoCode ? (
                <span className="inline-block rounded-lg bg-white px-2.5 py-1 text-[11px] font-mono font-bold text-gray-800 shadow-sm border border-lacvay-green/15">
                  Code: {promo2.promoCode}
                </span>
              ) : <div />}
              <span className="text-[11px] font-bold text-lacvay-green-dark group-hover:underline">
                View Details →
              </span>
            </div>
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/80 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-lacvay-green">
                <Sparkles className="h-4 w-4" />
                <p className="text-[13px] font-bold text-gray-900">Discover Batangas Deals</p>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-gray-500">
                Check back regularly for seasonal discount vouchers, tourist pass discounts, and dining coupons.
              </p>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => navigate('/promotions')}
                className="rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-gray-700 transition hover:border-lacvay-green hover:text-lacvay-green"
              >
                Browse All Deals
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
