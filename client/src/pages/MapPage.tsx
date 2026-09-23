import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Sparkles,
  Bus,
  Tag,
  Info,
  ExternalLink,
} from 'lucide-react';
import type { SavedGuide, SavedGuideStep, Place } from '@/types';
import { supabase } from '@/lib/supabase';
import { isVideoMediaUrl } from '@/lib/mediaUtils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  transitAdminService,
  type TransitRouteRow,
  type FixedFarePricing,
  type JeepneyFareRow,
} from '@/services/transitAdminService';
import {
  getTransitColorMeta,
  isWhiteColor,
  extractPolylineCoords,
  DEFAULT_BATANGAS_ROUTE_PATH,
} from '@/lib/transitColors';
import { CurrentLocationMarker } from '@/components/map/CurrentLocationMarker';
import { GEO_EVENT, getStoredGeo, requestUserLocation, type UserGeo } from '@/lib/userLocation';
import 'leaflet/dist/leaflet.css';

const BATANGAS_CENTER = { lat: 13.7565, lng: 121.0583 };

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

function MapResizeController() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const host = container.closest('[data-map-host]');
    if (!(host instanceof HTMLElement)) return;

    const sync = () => {
      container.style.width = `${host.clientWidth}px`;
      container.style.height = `${host.clientHeight}px`;
      map.invalidateSize({ animate: false });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(host);
    window.addEventListener('resize', sync);
    const timeoutId = window.setTimeout(sync, 200);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
      window.clearTimeout(timeoutId);
    };
  }, [map]);
  return null;
}

function MapController({ center, zoom = 13 }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function RouteBoundsController({
  coords,
  extra,
}: {
  coords: [number, number][];
  extra?: [number, number][];
}) {
  const map = useMap();
  useEffect(() => {
    const points = [...coords, ...(extra ?? [])];
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((c) => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, coords, extra]);
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

  const angle = (index * (Math.PI / 3)) % (Math.PI * 2);
  const distance = 0.007 * (index + 1);
  return [
    BATANGAS_CENTER.lat + Math.sin(angle) * distance,
    BATANGAS_CENTER.lng + Math.cos(angle) * distance,
  ];
}

export default function MapPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Live dynamic places fetched from Supabase
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [userGeo, setUserGeo] = useState<UserGeo | null>(() => getStoredGeo());

  // Transit Routes & Fixed Fare Pricing
  const [routes, setRoutes] = useState<TransitRouteRow[]>([]);
  const [faresList, setFaresList] = useState<JeepneyFareRow[]>([]);
  const [globalPricing, setGlobalPricing] = useState<FixedFarePricing | null>(null);

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

    async function fetchTransitData() {
      try {
        const [loadedRoutes, loadedFares, loadedPricing] = await Promise.all([
          transitAdminService.listRoutes(),
          transitAdminService.listFares(),
          transitAdminService.getFixedFarePricing(),
        ]);
        if (isMounted) {
          setRoutes(loadedRoutes);
          setFaresList(loadedFares);
          setGlobalPricing(loadedPricing);
        }
      } catch (err) {
        console.error('Failed to load transit data:', err);
      }
    }

    void fetchPlaces();
    void fetchTransitData();
    void requestUserLocation().then((geo) => {
      if (geo && isMounted) setUserGeo(geo);
    });

    const onGeo = (event: Event) => {
      const next = (event as CustomEvent<UserGeo>).detail;
      if (next?.lat != null) setUserGeo(next);
    };
    window.addEventListener(GEO_EVENT, onGeo);

    // Realtime channel for places
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
      window.removeEventListener(GEO_EVENT, onGeo);
      void supabase.removeChannel(channel);
    };
  }, []);

  // Guide passed from Saved Guides
  const activeGuide: SavedGuide | undefined = location.state?.guide;

  // Route selection via query param (?routeId=...)
  const routeIdParam = params.get('routeId');
  const selectedRoute = useMemo(() => {
    if (!routeIdParam) return null;
    return routes.find((r) => r.id === routeIdParam) || null;
  }, [routeIdParam, routes]);

  const handleSelectRoute = (newRouteId: string) => {
    if (!newRouteId) {
      params.delete('routeId');
      setParams(params);
    } else {
      params.set('routeId', newRouteId);
      setParams(params);
    }
  };

  // Extract route polyline coordinates
  const selectedRouteCoords = useMemo<[number, number][]>(() => {
    if (!selectedRoute) return [];
    const parsed = extractPolylineCoords(selectedRoute.geojson_path);
    if (parsed.length > 0) return parsed;
    // Fallback if no GeoJSON coordinates uploaded yet
    return DEFAULT_BATANGAS_ROUTE_PATH;
  }, [selectedRoute]);

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

  const userLatLng = useMemo<[number, number] | null>(
    () => (userGeo ? [userGeo.lat, userGeo.lng] : null),
    [userGeo],
  );
  const userBoundsExtra = useMemo<[number, number][] | undefined>(
    () => (userLatLng ? [userLatLng] : undefined),
    [userLatLng],
  );

  const mapCenter: [number, number] = useMemo(() => {
    if (guideStopsWithCoords.length > 0) {
      return guideStopsWithCoords[0].coords;
    }
    if (selectedRouteCoords.length > 0) {
      return selectedRouteCoords[0];
    }
    if (userLatLng) return userLatLng;
    return [BATANGAS_CENTER.lat, BATANGAS_CENTER.lng];
  }, [guideStopsWithCoords, selectedRouteCoords, userLatLng]);

  const guidePolyline: [number, number][] = useMemo(() => {
    return guideStopsWithCoords.map((s) => s.coords);
  }, [guideStopsWithCoords]);

  const defaultRouteLine: [number, number][] = [
    [13.756, 121.058],
    [13.754, 121.062],
    [13.755, 121.066],
  ];

  // Effective fare rates for the selected route specifically
  const selectedRouteFares = useMemo<FixedFarePricing | null>(() => {
    if (!selectedRoute) return globalPricing;

    // 1. Check embedded in route.geojson_path
    const embedded = transitAdminService.extractRouteFares(selectedRoute);
    if (
      embedded &&
      (embedded.regular != null ||
        embedded.discounted != null ||
        embedded.extraDistance != null ||
        embedded.extraDistanceDiscounted != null)
    ) {
      return embedded;
    }

    // 2. Check in jeepney_fare_matrix for this specific route
    const routeSpecificFares = faresList.filter(
      (f) =>
        f.origin_landmark === selectedRoute.id ||
        f.origin_landmark === selectedRoute.route_name ||
        f.origin_landmark?.toLowerCase() === selectedRoute.route_name?.toLowerCase(),
    );

    if (routeSpecificFares.length > 0) {
      const standard = routeSpecificFares.find(
        (f) => f.destination_landmark === 'Standard Trip' || f.destination_landmark === 'Base Fare',
      );
      const extended = routeSpecificFares.find(
        (f) => f.destination_landmark === 'Extended Trip' || f.destination_landmark === 'Extra Distance',
      );

      if (standard || extended) {
        return {
          regular: standard?.regular_fare ?? null,
          discounted: standard?.discounted_fare ?? null,
          extraDistance: extended?.regular_fare ?? null,
          extraDistanceDiscounted: extended?.discounted_fare ?? null,
        };
      }
    }

    // 3. Fallback to global defaults if no route-specific fare is set
    return globalPricing;
  }, [selectedRoute, faresList, globalPricing]);

  const standardRegular = selectedRouteFares?.regular ?? 13;
  const standardDiscounted = selectedRouteFares?.discounted ?? 11;
  const extendedRegular = selectedRouteFares?.extraDistance ?? 15;
  const extendedDiscounted = selectedRouteFares?.extraDistanceDiscounted ?? 12;

  const isSelectedRouteWhite = selectedRoute ? isWhiteColor(selectedRoute.color_code) : false;
  const selectedRouteColorMeta = selectedRoute ? getTransitColorMeta(selectedRoute.color_code) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeGuide
                ? activeGuide.title
                : selectedRoute
                  ? `${selectedRoute.route_name} Route`
                  : 'Map & Routes'}
            </h1>
            {!activeGuide && selectedRoute && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-lacvay-green">
                <span className="h-2 w-2 rounded-full bg-lacvay-green animate-pulse" />
                Active Route
              </span>
            )}
            {!activeGuide && !loadingPlaces && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {validPlaces.length} destination pins
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {activeGuide
              ? 'Projected itinerary stops & route across Batangas City'
              : selectedRoute
                ? `Viewing official path and fare details for ${selectedRoute.route_name}`
                : 'Interactive map displaying destinations, eateries, and transit lines across Batangas City'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeGuide && (
            <Link
              to="/saved?tab=guides"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-soft hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 text-lacvay-green" />
              Back to Saved Guides
            </Link>
          )}

          {!activeGuide && selectedRoute && (
            <Link
              to={`/fares?routeId=${selectedRoute.id}`}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-lacvay-green shadow-soft hover:bg-gray-50"
            >
              <Bus className="h-4 w-4" />
              Open in Transport Checker
            </Link>
          )}
        </div>
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_360px]">
        {/* Map View */}
        <div
          data-map-host
          className="relative h-full min-h-[420px] overflow-hidden rounded-3xl bg-white shadow-card md:min-h-[560px]"
        >
            <MapContainer
              center={mapCenter}
              zoom={activeGuide ? 14 : 13}
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <MapResizeController />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Dynamic bounds fitting for selected route */}
              {activeGuide && guidePolyline.length > 1 && (
                <RouteBoundsController
                  coords={guidePolyline}
                  extra={userBoundsExtra}
                />
              )}
              {selectedRouteCoords.length > 1 && (
                <RouteBoundsController
                  coords={selectedRouteCoords}
                  extra={userBoundsExtra}
                />
              )}
              {!activeGuide && selectedRouteCoords.length <= 1 && (
                <MapController center={mapCenter} zoom={userLatLng ? 15 : 13} />
              )}

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
                /* Dynamic Supabase pins & Route Polyline */
                <>
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

                  {/* Selected Transit Route Polyline Highlight */}
                  {selectedRoute && selectedRouteCoords.length > 0 ? (
                    <>
                      {/* White Route: Black casing border + white core */}
                      {isSelectedRouteWhite ? (
                        <>
                          <Polyline
                            positions={selectedRouteCoords}
                            pathOptions={{
                              color: '#000000',
                              weight: 8,
                              opacity: 0.95,
                              lineCap: 'round',
                              lineJoin: 'round',
                            }}
                          />
                          <Polyline
                            positions={selectedRouteCoords}
                            pathOptions={{
                              color: '#FFFFFF',
                              weight: 5,
                              opacity: 1,
                              lineCap: 'round',
                              lineJoin: 'round',
                            }}
                          />
                        </>
                      ) : (
                        /* Standard Primary Color Polyline */
                        <Polyline
                          positions={selectedRouteCoords}
                          pathOptions={{
                            color: selectedRoute.color_code || '#159447',
                            weight: 6,
                            opacity: 0.9,
                            lineCap: 'round',
                            lineJoin: 'round',
                          }}
                        />
                      )}
                    </>
                  ) : (
                    /* Default baseline polyline */
                    <Polyline
                      positions={defaultRouteLine}
                      pathOptions={{ color: '#159447', weight: 4 }}
                    />
                  )}
                </>
              )}

              <CurrentLocationMarker panOnFirstFix={!selectedRoute && !activeGuide} />
            </MapContainer>
        </div>

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
            /* Route Details & Fare Matrix Panel */
            <>
              {/* Route Selector & Details Card */}
              <Card className="space-y-4 shadow-card">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-lacvay-green" />
                    <h3 className="font-bold text-gray-900">Route Details</h3>
                  </div>
                  {selectedRoute && <Badge variant="green">{selectedRoute.vehicle_type || 'Jeepney'}</Badge>}
                </div>

                {/* Route Switcher Dropdown */}
                {routes.length > 0 && (
                  <div>
                    <label
                      htmlFor="map-route-select"
                      className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
                    >
                      Select Transport Route
                    </label>
                    <select
                      id="map-route-select"
                      value={selectedRoute?.id || ''}
                      onChange={(e) => handleSelectRoute(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-semibold text-gray-800 shadow-sm transition focus:border-lacvay-green focus:outline-none focus:ring-2 focus:ring-lacvay-green/20"
                    >
                      <option value="">— Show All / Default Map —</option>
                      {routes.map((r) => {
                        const colorMeta = getTransitColorMeta(r.color_code);
                        return (
                          <option key={r.id} value={r.id}>
                            {r.route_name} ({colorMeta.label})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {selectedRoute ? (
                  /* Highlighted Route Details with Fixed Fares */
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-gray-900">
                          {selectedRoute.route_name}
                        </h4>
                        {selectedRouteColorMeta && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isSelectedRouteWhite
                                ? 'border-2 border-black bg-white text-black'
                                : `${selectedRouteColorMeta.bgClass} ${selectedRouteColorMeta.textClass}`
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isSelectedRouteWhite ? 'bg-white border border-black' : 'bg-white/70'
                              }`}
                            />
                            {selectedRouteColorMeta.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Official public transit route across Batangas City
                      </p>
                    </div>

                    {/* Fare Section */}
                    <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/70 p-3.5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-lacvay-green">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Official Fixed Fare Rates</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-white p-2.5 border border-emerald-100/50 shadow-2xs">
                          <p className="text-[10.5px] font-bold text-gray-500 uppercase">Standard Trip</p>
                          <p className="mt-1 text-sm font-extrabold text-gray-900">
                            ₱{standardRegular.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-lacvay-green font-semibold">
                            Disc: ₱{standardDiscounted.toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-2.5 border border-emerald-100/50 shadow-2xs">
                          <p className="text-[10.5px] font-bold text-amber-700 uppercase">Extended Trip</p>
                          <p className="mt-1 text-sm font-extrabold text-gray-900">
                            ₱{extendedRegular.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-amber-700 font-semibold">
                            Disc: ₱{extendedDiscounted.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-gray-500 leading-tight">
                        Fixed trip pricing applies. Extended trip rates are cumulative totals.
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link
                        to={`/fares?routeId=${selectedRoute.id}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-lacvay-green" />
                        View in Transport Checker
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* No Route Selected State */
                  <div className="rounded-2xl bg-gray-50 p-4 text-center border border-gray-100">
                    <p className="text-xs font-medium text-gray-600">No specific route selected</p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Select a route from the dropdown above or browse Transport Checker to highlight official jeepney paths.
                    </p>
                    <Link
                      to="/fares"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-lacvay-green hover:underline"
                    >
                      Go to Transport Checker →
                    </Link>
                  </div>
                )}
              </Card>

              {/* Directions Panel - Blank placeholder state until AI generated */}
              <Card>
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h3 className="font-bold text-gray-900">Directions</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-medium text-gray-500">
                    AI Assistant
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-gray-50/80 p-5 text-center border border-gray-100">
                  <Info className="mx-auto h-5 w-5 text-gray-400 mb-1.5" />
                  <p className="text-xs font-semibold text-gray-700">No Directions Available Yet</p>
                  <p className="mt-1 text-[11.5px] text-gray-500 leading-relaxed">
                    Step-by-step turn directions will be available once generated by our AI travel assistant.
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
