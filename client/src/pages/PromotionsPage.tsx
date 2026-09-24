import { useEffect, useState } from 'react';
import { CalendarClock, Copy, Tag } from 'lucide-react';
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
    <div className="w-full space-y-5">
      {promotions.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title="No active promotions"
          description="Check back later for local deals and offers."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {promotions.map((p) => (
            <Card
              key={p.id}
              padding="sm"
              className="flex flex-col overflow-hidden p-0 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] bg-lacvay-cream">
                <PromotionAdMedia url={p.imageUrl} title={p.title} />
                {p.discount && (
                  <div className="absolute left-3 top-3">
                    <Badge variant="yellow" className="font-bold shadow-sm backdrop-blur">
                      {p.discount}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-[15px] font-bold text-gray-900">{p.title}</h3>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-gray-600">{p.description}</p>

                {p.promoCode && (
                  <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-lacvay-cream p-2 pl-3.5">
                    <code className="min-w-0 flex-1 truncate font-mono text-sm font-bold text-lacvay-green-dark">
                      {p.promoCode}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard?.writeText(p.promoCode!);
                        showToast('Promo code copied!');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                )}

                {p.validUntil && (
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
                    <CalendarClock className="h-3.5 w-3.5 text-lacvay-green" />
                    Valid until {p.validUntil}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="flex flex-col gap-3 bg-gradient-to-br from-white to-lacvay-blush/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Promote your business</h3>
            <Badge variant="gray">Coming soon</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Business promotion requests are not open yet — this opens once applications are available.
          </p>
        </div>
        <Button disabled className="shrink-0">
          Applications unavailable
        </Button>
      </Card>
    </div>
  );
}
