import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';

const typeLabels: Record<string, string> = {
  search: 'Search',
  route: 'Route',
  fare: 'Fare Check',
  attraction: 'Attraction',
  ride: 'Ride Option',
};

export default function HistoryPage() {
  const { history } = useApp();

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">History</h2>
        <EmptyState title="No history yet" description="Your searches, routes, and activity will appear here." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">History</h2>
        <p className="text-sm text-gray-500">Previous searches, routes, and activity</p>
      </div>
      <div className="space-y-3">
        {history.map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">{item.query}</p>
              <p className="text-sm text-gray-500">{item.meta}</p>
            </div>
            <div className="text-right">
              <Badge variant="gray">{typeLabels[item.type] ?? item.type}</Badge>
              <p className="mt-1 text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
