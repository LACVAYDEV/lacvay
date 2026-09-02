import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Navigation } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Restaurant, RestaurantCuisine } from '@/types';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';

const cuisines: (RestaurantCuisine | 'All')[] = ['All', 'Filipino', 'Fast Food', 'Cafe', 'Seafood', 'Budget', 'Family', 'Fine Dining'];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RestaurantCuisine | 'All'>('All');
  const navigate = useNavigate();
  const { isSaved, saveItem, removeSaved, savedPlaces } = useApp();

  useEffect(() => {
    dataService.getRestaurants(filter === 'All' ? undefined : filter).then((r) => {
      setRestaurants(r);
      setLoading(false);
    });
  }, [filter]);

  const toggleSave = (r: Restaurant) => {
    const saved = savedPlaces.find((p) => p.itemId === r.id);
    if (saved) removeSaved(saved.id);
    else saveItem({ itemId: r.id, type: 'restaurant', title: r.name, subtitle: r.location, imageUrl: r.imageUrl });
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nearby Restaurants</h2>
        <p className="text-sm text-gray-500">Discover local dining around Batangas City</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {cuisines.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === c ? 'bg-lacvay-green text-white' : 'bg-white text-gray-600 shadow-soft'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {restaurants.length === 0 ? (
        <EmptyState title="No restaurants found" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <Card key={r.id} padding="sm" className="overflow-hidden p-0">
              <img src={r.imageUrl} alt={r.name} className="aspect-[16/10] w-full object-cover" loading="lazy" />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900">{r.name}</h3>
                  <span className={`text-xs font-semibold ${r.isOpen ? 'text-lacvay-green' : 'text-red-500'}`}>
                    {r.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.cuisine.map((c) => <Badge key={c} variant="gray">{c}</Badge>)}
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r.rating}</span>
                  <span>{r.distanceKm} km</span>
                  <span>{r.priceRange}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" /> {r.location}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/map?to=${encodeURIComponent(r.name)}`)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-lacvay-green py-2 text-sm font-semibold text-white"
                  >
                    <Navigation className="h-4 w-4" /> Directions
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSave(r)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold"
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
