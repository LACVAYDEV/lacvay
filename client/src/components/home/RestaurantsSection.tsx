import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Restaurant } from '@/types';
import { Card } from '@/components/ui/Card';

export function RestaurantsSection() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    dataService.getRestaurants().then((list) => setRestaurants(list.slice(0, 4)));
  }, []);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Nearby Restaurants</h3>
          <p className="text-[11.5px] text-gray-500">Local delicacies, fresh seafood, and cafes in Batangas</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/restaurants')}
          className="text-[12px] font-semibold text-lacvay-green hover:underline shrink-0 ml-2"
        >
          View All
        </button>
      </div>

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
              <span
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur ${
                  r.isOpen
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-rose-500/90 text-white'
                }`}
              >
                {r.isOpen ? 'Open' : 'Closed'}
              </span>
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
                onClick={() => navigate(`/map?to=${encodeURIComponent(r.name)}`)}
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
