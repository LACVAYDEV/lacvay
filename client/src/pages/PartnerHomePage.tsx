import { useMemo, useState } from 'react';
import {
  Clock,
  MapPin,
  Power,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { partnerDayStats, partnerRideRequests } from '@/data/partnerMockData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { transportIcons } from '@/components/ui/TransportIcons';
import { getTransportLabel } from '@/lib/transport';
import { formatRateSummary } from '@/lib/partnerRates';
import { formatCurrency } from '@/lib/utils';
import type { PartnerRideRequest } from '@/types';

function minutesAgo(iso: string): number {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export default function PartnerHomePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useApp();
  const profile = user?.partnerProfile;
  const [requests, setRequests] = useState(partnerRideRequests);
  const [isOnline, setIsOnline] = useState(profile?.isOnline ?? false);

  const pending = useMemo(
    () => requests.filter((r) => r.status === 'pending'),
    [requests],
  );

  const toggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    updateUser({
      partnerProfile: profile ? { ...profile, isOnline: next } : profile,
    });
  };

  const respondToRequest = (id: string, accept: boolean) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: accept ? 'accepted' : 'declined' } : r,
      ),
    );
    const req = requests.find((r) => r.id === id);
    if (req && accept) {
      showToast(`Accepted ride for ${req.passengerName}`);
    } else if (req) {
      showToast('Request declined');
    }
  };

  if (!profile) {
    return (
      <Card>
        <p className="text-sm text-gray-600">Partner profile not set up yet.</p>
      </Card>
    );
  }

  const VehicleIcon = transportIcons[profile.vehicleType];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-lacvay-green">Transport Partner</p>
          <h2 className="text-2xl font-bold text-gray-900">Hello, {user?.name.split(' ')[0]}!</h2>
          <p className="mt-1 text-sm text-gray-500">
            {isOnline ? 'You are visible to passengers nearby.' : 'Go online to receive ride requests.'}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleOnline}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            isOnline
              ? 'bg-lacvay-green text-white shadow-soft'
              : 'border border-gray-200 bg-white text-gray-700 hover:border-lacvay-green/30'
          }`}
        >
          <Power className="h-4 w-4" />
          {isOnline ? 'Online' : 'Go online'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Trips today', value: String(partnerDayStats.tripsToday), icon: TrendingUp },
          { label: 'Earnings today', value: formatCurrency(partnerDayStats.earningsToday), icon: Wallet },
          { label: 'Hours online', value: `${partnerDayStats.hoursOnline}h`, icon: Clock },
          { label: 'Your rating', value: profile.rating.toFixed(1), icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lacvay-green/10 text-lacvay-green">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-gray-500">{label}</p>
              <p className="text-lg font-extrabold text-gray-900">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Incoming requests</h3>
            <Badge>{pending.length} pending</Badge>
          </div>

          {!isOnline ? (
            <Card className="border-dashed border-gray-200 bg-gray-50/80">
              <p className="text-sm font-medium text-gray-700">You are offline</p>
              <p className="mt-1 text-sm text-gray-500">
                Turn on online mode to start receiving passenger bookings.
              </p>
              <Button className="mt-4" size="sm" onClick={toggleOnline}>
                Go online
              </Button>
            </Card>
          ) : pending.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-600">No pending requests right now. Stay online — new bookings appear here.</p>
            </Card>
          ) : (
            pending.map((req) => (
              <PartnerRequestCard
                key={req.id}
                request={req}
                onAccept={() => respondToRequest(req.id, true)}
                onDecline={() => respondToRequest(req.id, false)}
              />
            ))
          )}
        </div>

        <Card className="h-fit space-y-4">
          <h3 className="font-bold text-gray-900">Your vehicle</h3>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lacvay-green/10 text-lacvay-green">
              <VehicleIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">{getTransportLabel(profile.vehicleType)}</p>
              <p className="text-sm text-gray-500">{profile.vehicleLabel}</p>
            </div>
          </div>
          {profile.plateNumber && <Badge>{profile.plateNumber}</Badge>}
          <p className="text-sm font-semibold text-lacvay-green-dark">
            {formatRateSummary(profile.baseFare, profile.perKmFee)}
          </p>
          <div className="space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
            <p>{profile.tripsCompleted}+ completed trips</p>
            <p>{profile.acceptanceRate}% acceptance rate</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PartnerRequestCard({
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">{request.passengerName}</p>
          <p className="text-[12px] text-gray-500">{minutesAgo(request.requestedAt)} min ago</p>
        </div>
        <p className="text-lg font-extrabold text-lacvay-green">{formatCurrency(request.estimatedFare)}</p>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lacvay-green" />
          {request.pickup} → {request.destination}
        </p>
        <p>{request.distanceKm} km · est. fare {formatCurrency(request.estimatedFare)}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onDecline}>
          Decline
        </Button>
        <Button size="sm" className="flex-1" onClick={onAccept}>
          Accept ride
        </Button>
      </div>
    </Card>
  );
}
