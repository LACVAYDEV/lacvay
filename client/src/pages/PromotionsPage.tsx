import { useEffect, useState } from 'react';
import { dataService } from '@/services/dataService';
import type { Promotion } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { PromotionAdMedia } from '@/components/promotions/PromotionAdMedia';
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
        <p className="text-sm text-gray-500">Local deals and business ads in Batangas City</p>
      </div>

      {promotions.length === 0 ? (
        <EmptyState title="No active promotions" description="Check back later for local deals and offers." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((p) => (
            <Card key={p.id} padding="sm" className="overflow-hidden p-0">
              <div className="relative aspect-[16/10] bg-gray-100">
                <PromotionAdMedia url={p.imageUrl} title={p.title} />
                {p.discount && (
                  <div className="absolute left-3 top-3">
                    <Badge variant="yellow">{p.discount}</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-extrabold text-lacvay-green-dark">{p.title}</h3>
                <p className="mt-2 text-sm text-gray-700">{p.description}</p>
                {p.promoCode && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <code className="rounded-xl bg-lacvay-cream px-4 py-2 font-mono text-sm font-bold shadow-soft">
                      {p.promoCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard?.writeText(p.promoCode!);
                        showToast('Promo code copied!');
                      }}
                    >
                      Copy Code
                    </Button>
                  </div>
                )}
                {p.validUntil && <p className="mt-3 text-xs text-gray-500">Valid until {p.validUntil}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900">Promote Your Business</h3>
          <Badge variant="gray">Coming soon</Badge>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Business promotion requests are not open yet. This button will be enabled when the application process is available.
        </p>
        <Button className="mt-4" disabled>
          Applications unavailable
        </Button>
      </Card>
    </div>
  );
}
