import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { touristSpots } from '@/data/mockData';
import { Card } from '@/components/ui/Card';

export function TouristSpotsSection() {
  const navigate = useNavigate();
  const featured = touristSpots.slice(0, 4);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-gray-900">Popular Tourist Spots</h3>
        <button
          type="button"
          onClick={() => navigate('/tourist-spots')}
          className="text-[12px] font-semibold text-lacvay-green hover:underline"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {featured.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => navigate(`/tourist-spots/${spot.id}`)}
            className="group text-left"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={spot.imageUrl}
                alt={spot.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 backdrop-blur">
                <Star className="h-2.5 w-2.5 fill-current" />
                {spot.rating}
              </span>
            </div>
            <p className="mt-2 text-[12.5px] font-bold leading-snug text-gray-900 group-hover:text-lacvay-green">
              {spot.name}
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-lacvay-lime/30 px-2 py-0.5 text-[10px] font-semibold text-lacvay-green-dark">
              {spot.categoryLabel ?? spot.category}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
