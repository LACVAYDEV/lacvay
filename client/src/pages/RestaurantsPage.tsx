import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Navigation } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Restaurant } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isSaved, saveItem, removeSaved, savedPlaces } = useApp();

  useEffect(() => {
    dataService.getRestaurants().then((r) => {
      setRestaurants(r);
      setLoading(false);
    });
  }, []);

  const toggleSave = (r: Restaurant) => {
    const saved = savedPlaces.find((p) => p.itemId === r.id);
    if (saved) removeSaved(saved.id);
    else saveItem({ itemId: r.id, type: 'restaurant', title: r.name, subtitle: 'Batangas City', imageUrl: r.imageUrl });
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nearby Restaurants & Eateries</h2>
        <p className="text-sm text-gray-500">Discover dining spots across Batangas City</p>
      </div>

      {restaurants.length === 0 ? (
        <EmptyState title="No restaurants found" description="Eateries will appear here once added." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <Card key={r.id} padding="sm" className="overflow-hidden p-0 flex flex-col">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute left-3 top-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur',
                      r.isOpen
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-rose-500/90 text-white',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full bg-white', r.isOpen && 'animate-pulse')} />
                    {r.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
                {r.priceRange && (
                  <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-lacvay-green shadow-sm">
                    {r.priceRange}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-gray-900 text-[16px]">{r.name}</h3>

                {r.description && (
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-gray-600">
                    {r.description}
                  </p>
                )}

                {r.openingHours && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 text-lacvay-green shrink-0" />
                    <span>{r.openingHours}</span>
                  </div>
                )}

                <div className="mt-auto pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/map?to=${encodeURIComponent(r.name)}`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-lacvay-green py-2.5 text-xs font-bold text-white transition hover:bg-lacvay-green-dark"
                  >
                    <Navigation className="h-3.5 w-3.5" /> Directions
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSave(r)}
                    className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-bold text-gray-700 transition hover:border-lacvay-green"
                  >
                    {isSaved(r.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
