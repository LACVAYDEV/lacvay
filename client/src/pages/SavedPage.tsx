import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';

const typeLabels = {
  'tourist-spot': 'Tourist Spot',
  restaurant: 'Restaurant',
  route: 'Route',
  'commute-guide': 'Commute Guide',
};

export default function SavedPage() {
  const { savedPlaces, removeSaved } = useApp();
  const navigate = useNavigate();

  const grouped = savedPlaces.reduce<Record<string, typeof savedPlaces>>((acc, item) => {
    (acc[item.type] ??= []).push(item);
    return acc;
  }, {});

  if (savedPlaces.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saved</h2>
            <p className="text-sm text-gray-500">Your locally saved routes and recommendations</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/saved-places')}
            className="inline-flex items-center gap-2 rounded-2xl border border-lacvay-green/30 bg-lacvay-green/10 px-4 py-2.5 text-xs font-bold text-lacvay-green shadow-soft transition hover:bg-lacvay-green hover:text-white"
          >
            <Bookmark className="h-4 w-4" />
            View Account Bookmarks
          </button>
        </div>
        <EmptyState title="Nothing saved yet" description="Save tourist spots, restaurants, and routes to find them here." />
      </div>
    );
  }

  const openItem = (type: string, itemId: string) => {
    if (type === 'tourist-spot') navigate(`/tourist-spots/${itemId}`);
    else if (type === 'restaurant') navigate('/restaurants');
    else if (type === 'route') navigate('/map');
    else navigate('/commute');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved</h2>
          <p className="text-sm text-gray-500">Your saved routes and spots</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/saved-places')}
          className="inline-flex items-center gap-2 rounded-2xl border border-lacvay-green/30 bg-lacvay-green/10 px-4 py-2.5 text-xs font-bold text-lacvay-green shadow-soft transition hover:bg-lacvay-green hover:text-white"
        >
          <Bookmark className="h-4 w-4" />
          View Account Bookmarks
        </button>
      </div>
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
            <Bookmark className="h-4 w-4 text-lacvay-green" />
            {typeLabels[type as keyof typeof typeLabels] ?? type}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="flex gap-4">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => openItem(item.type, item.itemId)} className="text-left font-bold text-gray-900 hover:text-lacvay-green">
                    {item.title}
                  </button>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                  <Badge variant="gray" className="mt-2">{new Date(item.savedAt).toLocaleDateString()}</Badge>
                </div>
                <button type="button" onClick={() => removeSaved(item.id)} className="text-gray-400 hover:text-red-500" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
