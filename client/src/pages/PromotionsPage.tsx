import { useEffect, useState } from 'react';
import { dataService } from '@/services/dataService';
import type { Promotion } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { useApp } from '@/context/AppContext';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useApp();

  useEffect(() => {
    dataService.getPromotions().then((p) => {
      setPromotions(p);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
        <p className="text-sm text-gray-500">Local deals and business promotions in Batangas City</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {promotions.map((p) => (
          <Card key={p.id} className="bg-lacvay-yellow/15">
            <h3 className="text-xl font-extrabold text-lacvay-green-dark">{p.title}</h3>
            <p className="mt-2 text-sm text-gray-700">{p.description}</p>
            {p.promoCode && (
              <div className="mt-4 flex items-center gap-3">
                <code className="rounded-xl bg-white px-4 py-2 font-mono text-sm font-bold shadow-soft">{p.promoCode}</code>
                <Button size="sm" onClick={() => { navigator.clipboard?.writeText(p.promoCode!); showToast('Promo code copied!'); }}>
                  Copy Code
                </Button>
              </div>
            )}
            {p.validUntil && <p className="mt-3 text-xs text-gray-500">Valid until {p.validUntil}</p>}
          </Card>
        ))}

        <Card>
          <h3 className="text-xl font-bold text-gray-900">Promote Your Business</h3>
          <p className="mt-2 text-sm text-gray-500">
            Boost your visibility and reach more customers in Batangas City. List your restaurant, shop, or transport service on LACVAY.
          </p>
          <Button className="mt-4" onClick={() => showToast('Business promotion request submitted!')}>
            Promote Business
          </Button>
        </Card>
      </div>
    </div>
  );
}
