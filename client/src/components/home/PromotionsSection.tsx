import { useNavigate } from 'react-router-dom';
import { promotions } from '@/data/mockData';
import { Card } from '@/components/ui/Card';

export function PromotionsSection() {
  const navigate = useNavigate();
  const main = promotions[0];

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-gray-900">Local Promotions</h3>
        <button
          type="button"
          onClick={() => navigate('/promotions')}
          className="text-[12px] font-semibold text-lacvay-green hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lacvay-yellow/35 via-lacvay-yellow/20 to-lacvay-lime/25 p-4">
          <div className="relative z-10 max-w-[62%]">
            <p className="text-[14px] font-extrabold text-amber-600">{main.title}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-gray-700">{main.description}</p>
            {main.promoCode && (
              <p className="mt-3 inline-block rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold text-lacvay-green-dark shadow-sm">
                Use code: {main.promoCode}
              </p>
            )}
          </div>
          <img
            src="/images/promo-tricycle.png"
            alt=""
            className="absolute -bottom-1 right-1 w-24 mix-blend-multiply"
          />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4">
          <div className="relative z-10 max-w-[62%]">
            <p className="text-[13px] font-bold text-gray-900">Promote Your Business</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-gray-500">
              Boost your visibility and reach more customers in Batangas City.
            </p>
            <button
              type="button"
              onClick={() => navigate('/promotions')}
              className="mt-3 rounded-full border-2 border-lacvay-green px-3.5 py-1.5 text-[11.5px] font-semibold text-lacvay-green transition hover:bg-lacvay-green/5"
            >
              Promote Business
            </button>
          </div>
          <img
            src="/images/promo-shop.png"
            alt=""
            className="absolute bottom-2 right-1 w-24 mix-blend-multiply"
          />
        </div>
      </div>
    </Card>
  );
}
