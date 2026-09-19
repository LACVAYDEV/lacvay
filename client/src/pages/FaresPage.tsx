import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bus, MapPin, ArrowRight, Info, ShieldCheck, Tag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import {
  transitAdminService,
  type TransitRouteRow,
  type FixedFarePricing,
} from '@/services/transitAdminService';
import {
  getTransitColorMeta,
  isWhiteColor,
} from '@/lib/transitColors';

export default function FaresPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [routes, setRoutes] = useState<TransitRouteRow[]>([]);
  const [pricing, setPricing] = useState<FixedFarePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [loadedRoutes, loadedPricing] = await Promise.all([
          transitAdminService.listRoutes(),
          transitAdminService.getFixedFarePricing(),
        ]);
        if (isMounted) {
          setRoutes(loadedRoutes);
          setPricing(loadedPricing);

          // Select route from query params or first route available
          const paramRouteId = params.get('routeId');
          if (paramRouteId && loadedRoutes.some((r) => r.id === paramRouteId)) {
            setSelectedRouteId(paramRouteId);
          } else if (loadedRoutes.length > 0) {
            setSelectedRouteId(loadedRoutes[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load routes and fares:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [params]);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null;

  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    setParams({ routeId });
  };

  const handleViewOnMap = () => {
    if (!selectedRoute) return;
    navigate(`/map?routeId=${selectedRoute.id}`);
  };

  if (loading) return <LoadingState message="Loading transit routes and fare matrix..." />;

  // Effective fare rates with default fallbacks
  const standardRegular = pricing?.regular ?? 13;
  const standardDiscounted = pricing?.discounted ?? 11;
  const extendedRegular = pricing?.extraDistance ?? 15;
  const extendedDiscounted = pricing?.extraDistanceDiscounted ?? 12;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lacvay-green/10 text-lacvay-green">
            <Bus className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Transport Checker</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Select an available jeepney or transport route to view official fixed fares, color coding, and map route.
        </p>
      </div>

      {routes.length === 0 ? (
        <Card className="p-8 text-center">
          <EmptyState
            title="No Transport Routes Available"
            description="Official transit routes and fare rates will appear once configured in the system."
          />
        </Card>
      ) : (
        <>
          {/* Route Dropdown Selector Card */}
          <Card className="p-5 sm:p-6 shadow-card">
            <label
              htmlFor="route-select"
              className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2"
            >
              Available Jeepney & Transport Routes
            </label>
            <div className="relative">
              <select
                id="route-select"
                value={selectedRoute?.id || ''}
                onChange={(e) => handleRouteChange(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-gray-900 shadow-sm transition focus:border-lacvay-green focus:outline-none focus:ring-2 focus:ring-lacvay-green/20"
              >
                {routes.map((r) => {
                  const colorMeta = getTransitColorMeta(r.color_code);
                  return (
                    <option key={r.id} value={r.id}>
                      {r.route_name} ({r.vehicle_type || 'Jeepney'}) — {colorMeta.label}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Showing {routes.length} active transportation routes registered across Batangas City.
            </p>
          </Card>

          {/* Selected Route & Fare Details */}
          {selectedRoute && (
            <div className="space-y-4">
              <Card className="overflow-hidden p-5 sm:p-6 shadow-card border-t-4 border-t-lacvay-green">
                {/* Route Header Info */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{selectedRoute.route_name}</h3>
                      <Badge variant="green">{selectedRoute.vehicle_type || 'Jeepney'}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">Official Batangas City Transit Service</p>
                  </div>

                  {/* Route Color Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Route Color:</span>
                    {(() => {
                      const colorMeta = getTransitColorMeta(selectedRoute.color_code);
                      const white = isWhiteColor(selectedRoute.color_code);
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            white
                              ? 'border-2 border-black bg-white text-black shadow-sm'
                              : `${colorMeta.bgClass} ${colorMeta.textClass} shadow-sm`
                          }`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              white ? 'bg-white border border-black' : 'bg-white/70'
                            }`}
                          />
                          {colorMeta.label} {white && '(Black Border)'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Fare Matrix Cards */}
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-lacvay-green" />
                    <h4 className="text-sm font-bold text-gray-800">Fixed Fare Matrix</h4>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Standard Trip */}
                    <div className="rounded-2xl border border-gray-100 bg-emerald-50/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-lacvay-green">
                          Standard Trip
                        </span>
                        <span className="rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Base Leg
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Regular Fare</p>
                          <p className="text-2xl font-extrabold text-gray-900">₱{standardRegular.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Discounted (20%)</p>
                          <p className="text-xl font-bold text-lacvay-green">
                            ₱{standardDiscounted.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500">
                        Applies to standard in-city passenger journeys.
                      </p>
                    </div>

                    {/* Extended Trip */}
                    <div className="rounded-2xl border border-gray-100 bg-amber-50/40 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                          Extended Trip
                        </span>
                        <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                          Cumulative
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Regular Total</p>
                          <p className="text-2xl font-extrabold text-gray-900">₱{extendedRegular.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Discounted (20%)</p>
                          <p className="text-xl font-bold text-amber-700">
                            ₱{extendedDiscounted.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500">
                        Cumulative total fare for outer perimeter or extended route distances.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Fare Notice */}
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-gray-50 p-3.5 text-xs text-gray-600 border border-gray-100">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-lacvay-green" />
                  <p className="leading-relaxed">
                    <strong className="font-semibold text-gray-800">Fixed Cumulative Fare Policy:</strong> Jeepney
                    trips follow fixed rates rather than per-kilometer increments. Discounted fares apply to
                    bonafide students, senior citizens, and persons with disabilities (PWD) with valid IDs.
                  </p>
                </div>

                {/* Action: View on Map */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Button
                    onClick={handleViewOnMap}
                    className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-soft hover:shadow-md"
                  >
                    <MapPin className="h-4 w-4" />
                    View Route on Map
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </Card>

              {/* Passenger Advisory */}
              <Card className="border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lacvay-green" />
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Commuter Tips</h5>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      Always have exact change ready when boarding jeepneys. Look out for the colored signboards
                      or roof markings matching this route&apos;s designated color code.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
