import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import type { TransportType, SavedGuide, SavedGuideStep, Place } from '@/types';
import { supabase } from '@/lib/supabase';
import { isVideoMediaUrl } from '@/lib/mediaUtils';
import { buildMockRoute } from '@/lib/fareCalculator';
import { getTransportLabel, getTransportOption } from '@/lib/transport';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getStepIcon } from '@/components/ui/TransportIcons';
import { formatFareRange } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const BATANGAS_CENTER = { lat: 13.7565, lng: 121.0583 };

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom stop marker for itinerary projected stops
const stopIcon = L.divIcon({
  className: 'custom-stop-marker',
  html: `<div style="background-color:#159447;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;box-shadow:0 2px 5px rgba(0,0,0,0.3);border:2px solid #fff;">★</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Standard destination pin for Supabase places
const placeIcon = L.divIcon({
  className: 'custom-place-marker',
  html: `<div style="background-color:#159447;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 3px 8px rgba(21,148,71,0.4);border:2px solid #fff;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Featured / Promoted destination pin (gold star badge)
const promotedPlaceIcon = L.divIcon({
  className: 'custom-promoted-marker',
  html: `<div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:15px;box-shadow:0 4px 12px rgba(217,119,6,0.5);border:2.5px solid #fff;transform:translateY(-2px);">★</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function MapController({ center, zoom = 13 }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// Helper to resolve coordinates for guide stops using live places
function resolveStopCoordinates(
  step: SavedGuideStep,
  index: number,
  availablePlaces: Place[],
): [number, number] {
  if (step.coordinates?.lat && step.coordinates?.lng) {
    return [step.coordinates.lat, step.coordinates.lng];
  }

  const query = `${step.title} ${step.description || ''} ${step.location || ''}`.toLowerCase();

  // Try matching against dynamic Supabase places
  for (const p of availablePlaces) {
    if (
      p.name &&
      (query.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(query))
    ) {
      if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
        return [p.latitude, p.longitude];
      }
    }
  }

  // Fallback: subtle offsets from Batangas center so stops are visible and sequential
  const angle = (index * (Math.PI / 3)) % (Math.PI * 2);
  const distance = 0.007 * (index + 1);
  return [
    BATANGAS_CENTER.lat + Math.sin(angle) * distance,
    BATANGAS_CENTER.lng + Math.cos(angle) * distance,
  ];
}

export default function MapPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Live dynamic places fetched from Supabase
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlaces() {
      try {
        const { data, error } = await supabase.from('places').select('*');
        if (error) {
          console.error('Error querying places from Supabase:', error);
        } else if (data && isMounted) {
          setPlaces(data as Place[]);
        }
      } catch (err) {
        console.error('Failed to load places from Supabase:', err);
      } finally {
        if (isMounted) setLoadingPlaces(false);
      }
    }

    void fetchPlaces();

    // Realtime channel: instantly update pins when admin creates, updates, or deletes places
    const channel = supabase
      .channel('places-realtime-map')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'places' },
        () => {
          void fetchPlaces();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  // Guide passed from Saved Guides
  const activeGuide: SavedGuide | undefined = location.state?.guide;

  const from = params.get('from') || 'Current Location';
  const to = params.get('to') || 'SM City Batangas';
  const transportParam = params.get('transport') as TransportType | null;
  const transport: TransportType =
    transportParam && getTransportOption(transportParam) ? transportParam : 'jeepney';

  const route = useMemo(() => buildMockRoute(from, to, transport), [from, to, transport]);

  // Valid coordinates for map plotting
  const validPlaces = useMemo(() => {
    return places.filter(
      (p) =>
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude),
    );
  }, [places]);

  // If viewing a projected guide
  const guideStopsWithCoords = useMemo(() => {
    if (!activeGuide || !Array.isArray(activeGuide.steps) || activeGuide.steps.length === 0) {
      return [];
    }
    return activeGuide.steps.map((step, idx) => ({
      ...step,
      order: step.order ?? idx + 1,
      coords: resolveStopCoordinates(step, idx, places),
    }));
  }, [activeGuide, places]);

  const mapCenter: [number, number] = useMemo(() => {
    if (guideStopsWithCoords.length > 0) {
      return guideStopsWithCoords[0].coords;
    }
    return [BATANGAS_CENTER.lat, BATANGAS_CENTER.lng];
  }, [guideStopsWithCoords]);

  const guidePolyline: [number, number][] = useMemo(() => {
    return guideStopsWithCoords.map((s) => s.coords);
  }, [guideStopsWithCoords]);

  const defaultRouteLine: [number, number][] = [
    [13.756, 121.058],
    [13.754, 121.062],
    [13.755, 121.066],
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeGuide ? activeGuide.title : 'Map & Routes'}
            </h1>
            {!activeGuide && !loadingPlaces && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-lacvay-green">
                <span className="h-1.5 w-1.5 rounded-full bg-lacvay-green animate-pulse" />
                {validPlaces.length} dynamic pins
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {activeGuide
              ? 'Projected itinerary stops & route across Batangas City'
              : 'Interactive map displaying destinations, eateries, and commute lines across Batangas City'}
          </p>
        </div>

        {activeGuide && (
          <Link
            to="/saved?tab=guides"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-soft hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 text-lacvay-green" />
            Back to Saved Guides
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Map View */}
        <Card padding="sm" className="overflow-hidden p-0 rounded-3xl shadow-card">
          <div className="h-[420px] w-full md:h-[540px]">
            <MapContainer center={mapCenter} zoom={activeGuide ? 14 : 13} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} zoom={activeGuide ? 14 : 13} />

              {/* If displaying an active guide */}
              {activeGuide && guideStopsWithCoords.length > 0 ? (
                <>
                  {guideStopsWithCoords.map((stop) => (
                    <Marker key={stop.order} position={stop.coords} icon={stopIcon}>
                      <Popup>
                        <div className="p-1 max-w-[200px]">
                          <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold mb-1">
                            Stop #{stop.order}
                          </span>
                          <h4 className="font-bold text-sm text-gray-900">{stop.title}</h4>
                          {stop.description && (
                            <p className="text-xs text-gray-600 mt-1">{stop.description}</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  <Polyline
                    positions={guidePolyline}
                    pathOptions={{ color: '#159447', weight: 4, dashArray: '6, 8' }}
                  />
                </>
              ) : (
                /* Default transit route with dynamic Supabase pins */
                <>
                  {/* Origin Marker */}
                  <Marker position={mapCenter} icon={defaultIcon}>
                    <Popup>
                      <div className="p-1 text-xs font-bold text-gray-800">
                        📍 {from}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Dynamic Supabase Places Pins */}
                  {validPlaces.map((p) => {
                    const isVideo = p.image_url ? isVideoMediaUrl(p.image_url) : false;
                    return (
                      <Marker
                        key={p.id}
                        position={[p.latitude, p.longitude]}
                        icon={p.is_featured ? promotedPlaceIcon : placeIcon}
                      >
                        <Popup>
                          <div className="p-1 max-w-[220px] text-left">
                            {p.image_url && (
                              <div className="mb-2 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                                {isVideo ? (
                                  <video
                                    src={p.image_url}
                                    className="h-28 w-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                  />
                                ) : (
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="h-28 w-full object-cover"
                                  />
                                )}
                              </div>
                            )}
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                {p.category || 'Spot'}
                              </span>
                              {p.is_featured && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Sparkles className="h-2.5 w-2.5" /> Promoted
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 leading-snug">{p.name}</h4>
                            {p.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-gray-600 leading-relaxed">
                                {p.description}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                              <span>
                                {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                              </span>
                              <Link
                                to={`/tourist-spots/${p.id}`}
                                className="font-bold text-lacvay-green hover:underline"
                              >
                                View details →
                              </Link>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  <Polyline positions={defaultRouteLine} pathOptions={{ color: '#159447', weight: 4 }} />
                </>
              )}
            </MapContainer>
          </div>
        </Card>

        {/* Sidebar Info Panel */}
        <div className="space-y-4">
          {activeGuide ? (
            /* Active Guide Details Panel */
            <Card className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-lacvay-green">
                  <Compass className="h-5 w-5" />
                  <h3 className="font-bold text-gray-900">Itinerary Stops</h3>
                </div>
                <Badge variant="green">
                  {guideStopsWithCoords.length} {guideStopsWithCoords.length === 1 ? 'Stop' : 'Stops'}
                </Badge>
              </div>

              {activeGuide.summary && (
                <p className="text-xs leading-relaxed text-gray-600 bg-emerald-50/60 border border-emerald-100/60 p-3 rounded-xl">
                  {activeGuide.summary}
                </p>
              )}

              <ol className="space-y-3 pt-1 max-h-[380px] overflow-y-auto pr-1">
                {guideStopsWithCoords.map((stop) => (
                  <li
                    key={stop.order}
                    className="flex items-start gap-3 rounded-xl bg-gray-50/80 p-3 border border-gray-100 transition hover:bg-white hover:shadow-soft"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-[11px] font-bold text-white">
                      {stop.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900">{stop.title}</p>
                      {stop.description && (
                        <p className="text-[11.5px] text-gray-500 mt-0.5 leading-relaxed">
                          {stop.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => navigate('/map', { replace: true, state: {} })}
                >
                  Clear Itinerary & Plan Normal Route
                </Button>
              </div>
            </Card>
          ) : (
            /* Default Route Details Panel */
            <>
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Route Details</h3>
                  <Badge variant="lime">Live</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">{from} → {to}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{getTransportLabel(transport)}</Badge>
                  <Badge variant="gray">{route.totalDurationMin} min</Badge>
                  <Badge variant="gray">{route.totalDistanceKm} km</Badge>
                </div>
                <p className="mt-3 text-lg font-bold text-lacvay-green">
                  {formatFareRange(route.estimatedFareMin, route.estimatedFareMax)}
                </p>
                <p className="text-xs text-gray-500">{route.transfers} transfer(s)</p>
              </Card>

              {/* Dynamic Destinations list */}
              {validPlaces.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Active Places ({validPlaces.length})
                    </h3>
                    <span className="text-[11px] text-gray-400">From Supabase</span>
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {validPlaces.slice(0, 6).map((p) => (
                      <Link
                        key={p.id}
                        to={`/tourist-spots/${p.id}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-emerald-50/60 transition text-xs group"
                      >
                        <span className="font-semibold text-gray-800 truncate group-hover:text-lacvay-green">
                          {p.name}
                        </span>
                        {p.is_featured ? (
                          <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded-full">
                            ★ Promoted
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-gray-400">
                            {p.category}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <h3 className="font-bold text-gray-900">Directions</h3>
                <ol className="mt-4 space-y-4">
                  {route.steps.map((step, i) => {
                    const StepIcon = getStepIcon(step.type);
                    return (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lacvay-green/10 text-lacvay-green">
                          <StepIcon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{getTransportLabel(step.type)}</p>
                          <p className="text-sm text-gray-500">{step.instruction}</p>
                          <p className="text-xs text-gray-400">{step.durationMin} min</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
