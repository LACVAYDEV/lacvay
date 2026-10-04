import { Fragment, useEffect, useMemo, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Bus,
  Tag,
  Info,
  Camera,
  Utensils,
} from 'lucide-react';
import type { Place } from '@/types';
import { supabase } from '@/lib/supabase';
import { isVideoMediaUrl } from '@/lib/mediaUtils';
import { formatCurrency } from '@/lib/utils';

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
} from '@/lib/transitColors';
import { CurrentLocationMarker } from '@/components/map/CurrentLocationMarker';
import 'leaflet/dist/leaflet.css';

const BATANGAS_CENTER: [number, number] = [13.7565, 121.0583];
const SESSION_STORAGE_MAP_KEY = 'lacvay_map_view_state';

interface StoredMapView {
  lat: number;
  lng: number;
  zoom: number;
}

// Custom Leaflet Icons for Places
const touristIcon = L.divIcon({
  className: 'custom-pin',
  html: ReactDOMServer.renderToString(
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-500 shadow-md text-white">
      <Camera size={16} />
    </div>,
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const eateryIcon = L.divIcon({
  className: 'custom-pin',
  html: ReactDOMServer.renderToString(
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-orange-500 shadow-md text-white">
      <Utensils size={16} />
    </div>,
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Highlighted destination pins (yellow ring with bounce animation)
const highlightedTouristIcon = L.divIcon({
  className: 'custom-pin',
  html: ReactDOMServer.renderToString(
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-500 shadow-md text-white ring-4 ring-yellow-400 animate-bounce">
      <Camera size={16} />
    </div>,
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const highlightedEateryIcon = L.divIcon({
  className: 'custom-pin',
  html: ReactDOMServer.renderToString(
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-orange-500 shadow-md text-white ring-4 ring-yellow-400 animate-bounce">
      <Utensils size={16} />
    </div>,
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Visual pin for explored destination from URL parameters
const explorePinIcon = L.divIcon({
  className: 'custom-explore-pin',
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
    <span style="position:absolute;width:44px;height:44px;border-radius:9999px;background:rgba(107,27,46,0.3);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
    <div style="background:#6B1B2E;color:#fff;border-radius:9999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(107,27,46,0.5);border:3px solid #fff;font-size:18px;z-index:2;transform:translateY(-2px);">
      📍
    </div>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -18],
});

function RouteBoundsController({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      const bounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, coords]);
  return null;
}

function ExploreFocusController({ coord }: { coord: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coord) {
      map.setView(coord, 17, { animate: true });
    }
  }, [coord, map]);
  return null;
}

function MapStatePersister() {
  useMapEvents({
    moveend: (e) => {
      try {
        const map = e.target;
        const center = map.getCenter();
        const zoom = map.getZoom();
        const state: StoredMapView = {
          lat: center.lat,
          lng: center.lng,
          zoom,
        };
        sessionStorage.setItem(SESSION_STORAGE_MAP_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('Failed to save map view to sessionStorage:', err);
      }
    },
    zoomend: (e) => {
      try {
        const map = e.target;
        const center = map.getCenter();
        const zoom = map.getZoom();
        const state: StoredMapView = {
          lat: center.lat,
          lng: center.lng,
          zoom,
        };
        sessionStorage.setItem(SESSION_STORAGE_MAP_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('Failed to save map view to sessionStorage:', err);
      }
    },
  });
  return null;
}

/** Listener component rendered inside MapContainer to fly to place and highlight pin from top search */
function MapFlyToListener({ onHighlight }: { onHighlight: (id: string) => void }) {
  const map = useMap();
  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const customEvent = e as CustomEvent<Place>;
      const place = customEvent.detail;
      if (!place) return;
      const lat = (place as any).lat ?? place.latitude;
      const lng = (place as any).lng ?? place.longitude;
      if (typeof lat === 'number' && typeof lng === 'number') {
        map.flyTo([lat, lng], 18, { animate: true });
        onHighlight(place.id);
      }
    };
    const handleClear = () => {
      onHighlight('');
    };
    window.addEventListener('lacvay:fly-to-place', handleFlyTo);
    window.addEventListener('lacvay:clear-highlight', handleClear);
    return () => {
      window.removeEventListener('lacvay:fly-to-place', handleFlyTo);
      window.removeEventListener('lacvay:clear-highlight', handleClear);
    };
  }, [map, onHighlight]);
  return null;
}

export default function MapPage() {
  const [params, setParams] = useSearchParams();

  // Dynamic places and transit routes from Supabase
  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<TransitRouteRow[]>([]);
  const [faresList, setFaresList] = useState<JeepneyFareRow[]>([]);
  const [globalPricing, setGlobalPricing] = useState<FixedFarePricing | null>(null);

  // Explorer filter controls
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRoutes, setShowRoutes] = useState(true);
  const routeIdParam = params.get('routeId');

  // Highlighted place ID from top search or URL parameter
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(() => params.get('highlight'));

  useEffect(() => {
    const hl = params.get('highlight');
    if (hl !== highlightedPlaceId) {
      setHighlightedPlaceId(hl);
    }
  }, [params]);

  // URL Parameter "Explore" Coordinates
  const latParam = params.get('lat');
  const lngParam = params.get('lng');

  const exploreCoord = useMemo<[number, number] | null>(() => {
    if (!latParam || !lngParam) return null;
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }
    return null;
  }, [latParam, lngParam]);

  // Initial map view:
  // 1. If lat/lng URL params exist -> center on them and zoom tightly (17)
  // 2. Else if sessionStorage has stored view -> restore previous center & zoom
  // 3. Else -> default BATANGAS_CENTER & zoom 13
  const [initialView] = useState<{ center: [number, number]; zoom: number; fromSession: boolean }>(() => {
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { center: [lat, lng], zoom: 17, fromSession: false };
      }
    }

    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_MAP_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<StoredMapView>;
        if (
          typeof parsed.lat === 'number' &&
          typeof parsed.lng === 'number' &&
          !isNaN(parsed.lat) &&
          !isNaN(parsed.lng)
        ) {
          const zoom = typeof parsed.zoom === 'number' && !isNaN(parsed.zoom) ? parsed.zoom : 14;
          return { center: [parsed.lat, parsed.lng], zoom, fromSession: true };
        }
      }
    } catch (err) {
      console.warn('Could not read saved map view from sessionStorage:', err);
    }

    return { center: BATANGAS_CENTER, zoom: 13, fromSession: false };
  });

  // Find matching place for explored coordinate if one exists
  const exploredPlace = useMemo(() => {
    if (!exploreCoord) return null;
    return places.find(
      (p) =>
        Math.abs(p.latitude - exploreCoord[0]) < 0.0002 &&
        Math.abs(p.longitude - exploreCoord[1]) < 0.0002,
    );
  }, [exploreCoord, places]);

  useEffect(() => {
    let isMounted = true;

    async function loadExplorerData() {
      try {
        const [
          { data: placesData, error: placesErr },
          loadedRoutes,
          loadedFares,
          loadedPricing,
        ] = await Promise.all([
          supabase.from('places').select('*'),
          transitAdminService.listRoutes().catch(() => [] as TransitRouteRow[]),
          transitAdminService.listFares().catch(() => [] as JeepneyFareRow[]),
          transitAdminService.getFixedFarePricing().catch(() => null),
        ]);

        if (placesErr) {
          console.error('Error querying places from Supabase:', placesErr);
        }

        if (isMounted) {
          if (placesData) setPlaces(placesData as Place[]);
          setRoutes(loadedRoutes);
          setFaresList(loadedFares);
          setGlobalPricing(loadedPricing);
        }
      } catch (err) {
        console.error('Failed to load explorer map data:', err);
      }
    }

    void loadExplorerData();

    // Realtime subscription for live place updates
    const channel = supabase
      .channel('places-realtime-explorer')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'places' },
        () => {
          void supabase
            .from('places')
            .select('*')
            .then(({ data }) => {
              if (data && isMounted) setPlaces(data as Place[]);
            });
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  // Filter valid geographical places
  const validPlaces = useMemo(() => {
    return places.filter(
      (p) =>
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude),
    );
  }, [places]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    validPlaces.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [validPlaces]);

  // Search query from URL param (updated by Header search bar)
  const searchQuery = (params.get('search') || params.get('q') || '').toLowerCase().trim();

  // Filtered places according to category selector and search query
  const filteredPlaces = useMemo(() => {
    let result = validPlaces;
    if (selectedCategory !== 'all') {
      result = result.filter(
        (p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase(),
      );
    }
    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery) ||
          (p.description || '').toLowerCase().includes(searchQuery) ||
          (p.category || '').toLowerCase().includes(searchQuery),
      );
    }
    return result;
  }, [validPlaces, selectedCategory, searchQuery]);

  // Parsed transit route polylines
  const parsedRoutes = useMemo(() => {
    return routes
      .map((r) => {
        const coords = extractPolylineCoords(r.geojson_path);
        const isWhite = isWhiteColor(r.color_code);
        const colorMeta = getTransitColorMeta(r.color_code);
        return {
          route: r,
          coords,
          isWhite,
          colorMeta,
        };
      })
      .filter((item) => item.coords.length > 1);
  }, [routes]);

  // Selected route for targeted map focus if routeId query param is present
  const selectedRouteItem = useMemo(() => {
    if (!routeIdParam) return null;
    return parsedRoutes.find((r) => r.route.id === routeIdParam) || null;
  }, [routeIdParam, parsedRoutes]);

  const setSelectedRouteId = (routeId: string) => {
    if (!routeId) {
      params.delete('routeId');
      setParams(params);
    } else {
      params.set('routeId', routeId);
      setParams(params);
    }
  };

  return (
    <div className="flex flex-col h-full w-full gap-2 min-h-0">
      {/* Explorer Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-2.5 py-1.5 border border-gray-100 shadow-xs shrink-0">
        {/* Category Filter Pills */}
        <div className="no-scrollbar -mx-0.5 flex min-w-0 max-w-full items-center gap-1 overflow-x-auto px-0.5 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-lacvay-green text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Places ({validPlaces.length})
          </button>
          {categories.map((cat) => {
            const count = validPlaces.filter(
              (p) => (p.category || '').toLowerCase() === cat.toLowerCase(),
            ).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-lacvay-green text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Route Filter Dropdown & Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {parsedRoutes.length > 0 && (
            <select
              value={selectedRouteItem?.route.id || ''}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-xs focus:border-lacvay-green focus:outline-none"
            >
              <option value="">All Transit Corridors</option>
              {parsedRoutes.map(({ route, colorMeta }) => (
                <option key={route.id} value={route.id}>
                  {route.route_name} ({colorMeta.label})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowRoutes((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold border transition ${
              showRoutes
                ? 'bg-lacvay-blush border-lacvay-green/20 text-lacvay-green'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            <Bus className="h-3 w-3" />
            {showRoutes ? 'Routes' : 'Hidden'}
          </button>
        </div>
      </div>

      {/* Full-Width Explorer Map Container - Fills remaining height cleanly */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-lg shadow-sm border border-gray-100 bg-white">
        <div className="w-full h-full relative overflow-hidden">
          <MapContainer
            center={initialView.center}
            zoom={initialView.zoom}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Controller listening to top Header search bar fly-to and highlight events */}
            <MapFlyToListener
              onHighlight={(id) => {
                setHighlightedPlaceId(id);
                if (id) setSelectedCategory('all');
              }}
            />

            {/* Session Storage State Persister */}
            <MapStatePersister />

            {/* Focus controller for URL parameters */}
            <ExploreFocusController coord={exploreCoord} />

            {/* Fit bounds to selected route if specified */}
            {selectedRouteItem && selectedRouteItem.coords.length > 1 && (
              <RouteBoundsController coords={selectedRouteItem.coords} />
            )}

            {/* Render Transit Routes as GeoJSON Polylines */}
            {showRoutes &&
              parsedRoutes
                .filter(({ route }) => !routeIdParam || routeIdParam === 'all' || route.id === routeIdParam)
                .map(({ route, coords, isWhite, colorMeta }) => {
                const isSelected = selectedRouteItem?.route.id === route.id;

                const {
                  regular_fare,
                  discounted_fare,
                  extended_fare,
                  extended_discounted_fare,
                } = route;

                // Fallback for regular fare & standard discounted fare (20% for Student/Senior/PWD)
                const routeSpecificFares = faresList.filter(
                  (f) =>
                    f.route_id === route.id ||
                    f.origin_landmark === route.id ||
                    f.origin_landmark === route.route_name ||
                    f.origin_landmark?.toLowerCase() === route.route_name?.toLowerCase(),
                );
                const standardFareRow = routeSpecificFares.find(
                  (f) => f.destination_landmark === 'Standard Trip' || f.destination_landmark === 'Base Fare',
                );

                const regularFare = regular_fare ?? standardFareRow?.regular_fare ?? globalPricing?.regular ?? 13;
                const discountedFare =
                  discounted_fare ?? standardFareRow?.discounted_fare ?? globalPricing?.discounted ?? (regularFare === 13 ? 11 : Math.round(regularFare * 0.8));

                // Extended Trip: ONLY if extended_fare exists and is greater than regular_fare
                const hasExtendedTrip =
                  typeof extended_fare === 'number' &&
                  extended_fare > (regular_fare ?? regularFare);

                const extendedDiscountedFare =
                  extended_discounted_fare ??
                  (hasExtendedTrip && extended_fare ? Math.round(extended_fare * 0.8) : null);

                return (
                  <Fragment key={route.id}>
                    {/* Bottom Layer: Thicker Black Outline */}
                    <Polyline
                      positions={coords}
                      pathOptions={{
                        color: '#000000',
                        weight: isSelected ? 9 : 8,
                        opacity: 0.85,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />
                    {/* Top Layer: Thinner Main Route Color */}
                    <Polyline
                      positions={coords}
                      pathOptions={{
                        color: route.color_code || '#159447',
                        weight: isSelected ? 5.5 : 4,
                        opacity: 1,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                      eventHandlers={{
                        click: () => setSelectedRouteId(route.id),
                      }}
                    >
                      <Popup minWidth={240} maxWidth={290} className="route-fare-balloon">
                        <div className="p-0.5 text-xs text-left">
                          {/* Route Title & Badges */}
                          <div className="pr-4">
                            <p className="font-bold text-xs text-gray-900 leading-snug">
                              {route.route_name}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="rounded bg-lacvay-blush px-1.5 py-0.2 text-[9px] font-bold text-lacvay-green border border-lacvay-green/20">
                                {route.vehicle_type || 'Jeepney'}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                  isWhite
                                    ? 'bg-black text-white'
                                    : `${colorMeta.bgClass} ${colorMeta.textClass}`
                                }`}
                              >
                                {colorMeta.label} Line
                              </span>
                            </div>
                          </div>

                          {/* Fixed Fare Matrix */}
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1 mb-1.5">
                              <Tag className="h-3 w-3 text-lacvay-green" />
                              <span className="text-[10px] font-bold text-gray-800">Fixed Fare Matrix</span>
                            </div>

                            <div className={`grid ${hasExtendedTrip ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5`}>
                              {/* Standard Trip */}
                              <div className="rounded-lg border border-lacvay-green/15 bg-lacvay-blush/40 p-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-lacvay-green">
                                    Standard
                                  </span>
                                  <span className="rounded bg-lacvay-blush px-1 py-0.2 text-[8px] font-semibold text-lacvay-green-dark border border-lacvay-green/20">
                                    Base
                                  </span>
                                </div>
                                <div className="mt-1 flex items-baseline justify-between gap-1">
                                  <div>
                                    <p className="text-[8px] text-gray-500">Regular</p>
                                    <p className="text-xs font-extrabold text-gray-900">
                                      {formatCurrency(regularFare)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[8px] text-gray-500">Disc (20%)</p>
                                    <p className="text-xs font-bold text-lacvay-green">
                                      {formatCurrency(discountedFare)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Extended Trip */}
                              {hasExtendedTrip && (
                                <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-800">
                                      Extended
                                    </span>
                                    <span className="rounded bg-amber-100 px-1 py-0.2 text-[8px] font-semibold text-amber-900 border border-amber-200">
                                      Total
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-baseline justify-between gap-1">
                                    <div>
                                      <p className="text-[8px] text-gray-500">Regular</p>
                                      <p className="text-xs font-extrabold text-gray-900">
                                        {formatCurrency(extended_fare!)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[8px] text-gray-500">Discount</p>
                                      <p className="text-xs font-bold text-amber-800">
                                        {extendedDiscountedFare != null ? formatCurrency(extendedDiscountedFare) : '—'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-1.5 flex items-start gap-1 text-[8.5px] text-gray-500 leading-tight">
                              <Info className="h-2.5 w-2.5 shrink-0 text-lacvay-green mt-0.5" />
                              <span>Discounted fares apply to students, senior citizens, and PWDs with valid IDs.</span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Polyline>
                  </Fragment>
                );
              })}

            {/* Render Places as Markers */}
            {filteredPlaces.map((p) => {
              const isVideo = p.image_url ? isVideoMediaUrl(p.image_url) : false;
              const isRestaurant = p.category === 'restaurant' || p.category?.toLowerCase() === 'restaurant';
              const isHighlighted = p.id === highlightedPlaceId;

              const icon = isHighlighted
                ? (isRestaurant ? highlightedEateryIcon : highlightedTouristIcon)
                : (isRestaurant ? eateryIcon : touristIcon);

              return (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={icon}
                  zIndexOffset={isHighlighted ? 1000 : 0}
                >
                  <Popup>
                    <div className="p-1 max-w-[220px] text-left">
                      {p.image_url && (
                        <div className="mb-2 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
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
                        <span className="inline-block rounded-full bg-lacvay-blush px-2 py-0.5 text-[10px] font-bold text-lacvay-green-dark">
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
                          to={`/${isRestaurant ? 'restaurants' : 'tourist-spots'}/${p.id}`}
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

            {/* Visual pin marker for URL explored coordinate */}
            {exploreCoord && !highlightedPlaceId && (
              <Marker position={exploreCoord} icon={explorePinIcon} zIndexOffset={1500}>
                <Popup autoPan={false}>
                  <div className="p-1 text-left">
                    <span className="inline-block rounded-full bg-lacvay-blush px-2 py-0.5 text-[10px] font-bold text-lacvay-green-dark">
                      Explored Destination
                    </span>
                    <p className="mt-1 font-bold text-sm text-gray-900 leading-tight">
                      {exploredPlace ? exploredPlace.name : 'Selected Location'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {exploreCoord[0].toFixed(5)}, {exploreCoord[1].toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Current user location marker */}
            <CurrentLocationMarker
              panOnFirstFix={!selectedRouteItem && !exploreCoord && !initialView.fromSession}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
