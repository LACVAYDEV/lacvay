import { partnerRideRequests } from '@/data/partnerMockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

export default function PartnerHistoryPage() {
  const completed = partnerRideRequests.filter((r) => r.status === 'completed' || r.status === 'accepted');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Trip History</h2>
        <p className="text-sm text-gray-500">Your recent completed and accepted rides</p>
      </div>

      <div className="space-y-3">
        {completed.length === 0 ? (
          <Card><p className="text-sm text-gray-500">No trips yet.</p></Card>
        ) : (
          completed.map((trip) => (
            <Card key={trip.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{trip.passengerName}</p>
                  <p className="mt-1 text-sm text-gray-500">{trip.pickup} → {trip.destination}</p>
                  <p className="mt-1 text-xs text-gray-400">{trip.distanceKm} km</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-lacvay-green">{formatCurrency(trip.estimatedFare)}</p>
                  <Badge variant="gray" className="mt-2">{trip.status}</Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
