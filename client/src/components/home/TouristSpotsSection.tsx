import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '@/services/dataService';
import type { TouristSpot } from '@/types';
import { Card } from '@/components/ui/Card';

export function TouristSpotsSection() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<TouristSpot[]>([]);

  useEffect(() => {
    dataService.getTouristSpots().then((spots) => setFeatured(spots.slice(0, 4)));
  }, []);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-gray-900">Nearby Tourist Spots</h3>
          <p className="text-[11.5px] text-gray-500">Top attractions, historical sites, and natural escapes across Batangas</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tourist-spots')}
          className="text-[12px] font-semibold text-lacvay-green hover:underline shrink-0 ml-2"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 items-start gap-4 lg:grid-cols-4">
        {featured.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => navigate(`/tourist-spots/${spot.id}`)}
            className="group flex flex-col text-left"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 flex-shrink-0">
              <img
                src={spot.imageUrl}
                alt={spot.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              {spot.isFeatured && (
                <span className="absolute left-2 top-2 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9.5px] font-bold text-amber-950 shadow-sm backdrop-blur">
                  ★ Promoted
                </span>
              )}
            </div>
            <p className="mt-2 text-[12.5px] font-bold leading-snug text-gray-900 group-hover:text-lacvay-green line-clamp-2">
              {spot.name}
            </p>
            <span className="mt-1.5 inline-block text-[10px] font-semibold text-lacvay-green-dark whitespace-nowrap">
              {spot.categoryLabel ?? spot.category}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
