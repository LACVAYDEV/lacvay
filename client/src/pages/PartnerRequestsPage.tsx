import { useState } from 'react';
import { partnerRideRequests } from '@/data/partnerMockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import type { PartnerRideRequest } from '@/types';
import { MapPin } from 'lucide-react';

export default function PartnerRequestsPage() {
  const { showToast } = useApp();
  const [requests, setRequests] = useState(partnerRideRequests);

  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  const respond = (id: string, accept: boolean) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: accept ? 'accepted' : 'declined' } : r)),
    );
    showToast(accept ? 'Ride accepted' : 'Request declined');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ride Requests</h2>
        <p className="text-sm text-gray-500">Manage incoming passenger bookings</p>
      </div>

      <section className="space-y-3">
        <h3 className="font-bold text-gray-900">Pending ({pending.length})</h3>
        {pending.length === 0 ? (
          <Card><p className="text-sm text-gray-500">No pending requests.</p></Card>
        ) : (
          pending.map((req) => (
            <RequestRow key={req.id} request={req} onAccept={() => respond(req.id, true)} onDecline={() => respond(req.id, false)} />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-bold text-gray-900">Earlier today</h3>
        {others.map((req) => (
          <Card key={req.id} className="opacity-80">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">{req.passengerName}</p>
              <Badge variant="gray">{req.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">{req.pickup} → {req.destination}</p>
            <p className="mt-1 text-sm font-semibold text-lacvay-green">{formatCurrency(req.estimatedFare)}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

function RequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: PartnerRideRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">{request.passengerName}</p>
          <p className="mt-1 flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lacvay-green" />
            {request.pickup} → {request.destination}
          </p>
        </div>
        <p className="text-lg font-extrabold text-lacvay-green">{formatCurrency(request.estimatedFare)}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onDecline}>Decline</Button>
        <Button size="sm" className="flex-1" onClick={onAccept}>Accept</Button>
      </div>
    </Card>
  );
}
