import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, UtensilsCrossed } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Restaurant } from '@/types';
import { Card } from '@/components/ui/Card';
import { SectionHeader, SectionLink } from '@/components/ui/SectionHeader';

export function RestaurantsSection() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    dataService.getRestaurants().then((list) => {
      const sorted = [...list].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.name.localeCompare(b.name);
      });
      setRestaurants(sorted.slice(0, 4));
    });
  }, []);

  return (
    <Card className="h-full">
      <SectionHeader
        title="Nearby Restaurants"
        subtitle="Lomi houses, cafés, and local favorites"
        icon={<UtensilsCrossed className="h-4 w-4" />}
        action={<SectionLink label="View all" onClick={() => navigate('/restaurants')} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-2.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[16/11] overflow-hidden rounded-xl bg-gray-100">
              <img
                src={r.imageUrl}
                alt={r.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute left-2 top-2 flex flex-col gap-1 items-start">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur ${
                    r.isOpen
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-rose-500/90 text-white'
                  }`}
                >
                  {r.isOpen ? 'Open' : 'Closed'}
                </span>
                {r.isFeatured && (
                  <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-gray-900 shadow-sm">
                    ★ Promoted
                  </span>
                )}
              </div>
              {r.priceRange && (
                <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-lacvay-green shadow-sm">
                  {r.priceRange}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-1 flex-col">
              <p className="text-[13px] font-bold leading-snug text-gray-900 line-clamp-1 group-hover:text-lacvay-green">
                {r.name}
              </p>

              {r.openingHours && (
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">
                  {r.openingHours}
                </p>
              )}

              <button
                type="button"
                onClick={() => navigate(`/assistant?prompt=How+do+I+get+to+${encodeURIComponent(r.name)}`)}
                className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-lacvay-blush py-1.5 text-[11px] font-semibold text-lacvay-green-dark transition hover:bg-lacvay-green hover:text-white"
              >
                <Navigation className="h-3 w-3" />
                Directions
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
