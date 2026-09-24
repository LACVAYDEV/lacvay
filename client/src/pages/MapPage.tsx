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
  X,
  Camera,
  Utensils,
} from 'lucide-react';
import type { Place } from '@/types';
import { supabase } from '@/lib/supabase';
import { isVideoMediaUrl } from '@/lib/mediaUtils';

import { Card } from '@/components/ui/Card';
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

  // Compute fares specifically for the selected route
  const selectedRouteFares = useMemo<{
    standardRegular: number;
    standardDiscounted: number;
    extendedRegular: number;
    extendedDiscounted: number;
  }>(() => {
    if (!selectedRouteItem) {
      return {
        standardRegular: 13,
        standardDiscounted: 11,
        extendedRegular: 15,
        extendedDiscounted: 12,
      };
    }
    const route = selectedRouteItem.route;
    const embedded = transitAdminService.extractRouteFares(route);
    if (
      embedded &&
      (embedded.regular != null ||
        embedded.discounted != null ||
        embedded.extraDistance != null ||
        embedded.extraDistanceDiscounted != null)
    ) {
      return {
        standardRegular: embedded.regular ?? 13,
        standardDiscounted: embedded.discounted ?? 11,
        extendedRegular: embedded.extraDistance ?? 15,
        extendedDiscounted: embedded.extraDistanceDiscounted ?? 12,
      };
    }

    const routeSpecificFares = faresList.filter(
      (f) =>
        f.route_id === route.id ||
        f.origin_landmark === route.id ||
        f.origin_landmark === route.route_name ||
        f.origin_landmark?.toLowerCase() === route.route_name?.toLowerCase(),
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
          standardRegular: standard?.regular_fare ?? 13,
          standardDiscounted: standard?.discounted_fare ?? 11,
          extendedRegular: extended?.regular_fare ?? 15,
          extendedDiscounted: extended?.discounted_fare ?? 12,
        };
      }
    }

    return {
      standardRegular: globalPricing?.regular ?? 13,
      standardDiscounted: globalPricing?.discounted ?? 11,
      extendedRegular: globalPricing?.extraDistance ?? 15,
      extendedDiscounted: globalPricing?.extraDistanceDiscounted ?? 12,
    };
  }, [selectedRouteItem, faresList, globalPricing]);

  const handleSelectRouteFilter = (routeId: string) => {
    if (!routeId) {
      params.delete('routeId');
      setParams(params);
    } else {
      params.set('routeId', routeId);
      setParams(params);
    }
  };

  return (
    <div className="space-y-3">
      {/* Explorer Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 border border-gray-100 shadow-soft">
        {/* Category Filter Pills */}
        <div className="no-scrollbar -mx-1 flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto px-1 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
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
                className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
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
        <div className="flex items-center gap-2">
          {parsedRoutes.length > 0 && (
            <select
              value={selectedRouteItem?.route.id || ''}
              onChange={(e) => handleSelectRouteFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-xs focus:border-lacvay-green focus:outline-none"
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
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition ${
              showRoutes
                ? 'bg-lacvay-blush border-lacvay-green/20 text-lacvay-green'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            <Bus className="h-3 w-3" />
            {showRoutes ? 'Routes Visible' : 'Routes Hidden'}
          </button>
        </div>
      </div>

      {/* Full-Width Explorer Map Container */}
      <Card padding="sm" className="relative overflow-hidden p-0 rounded-3xl shadow-card">
        <div className="w-full h-[calc(100vh-4rem)] relative overflow-hidden">
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
                    >
                      <Popup>
                        <div className="p-1 text-xs">
                          <p className="font-bold text-gray-900">{route.route_name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{route.vehicle_type || 'Jeepney'}</p>
                          <span
                            className={`mt-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                              isWhite
                                ? 'bg-black text-white'
                                : `${colorMeta.bgClass} ${colorMeta.textClass}`
                            }`}
                          >
                            {colorMeta.label} Line
                          </span>
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

          {/* Floating Fare Matrix Card for Selected Route */}
          {selectedRouteItem && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[380px] z-[1000] pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                {/* Header: Route Name, Vehicle Badge, Color Pill, Close button */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {selectedRouteItem.route.route_name}
                      </h3>
                      <span className="rounded-md bg-lacvay-blush px-2 py-0.5 text-[10px] font-bold text-lacvay-green border border-lacvay-green/20">
                        {selectedRouteItem.route.vehicle_type || 'Jeepney'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-500">Route Color:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          selectedRouteItem.isWhite
                            ? 'border border-black bg-white text-black shadow-xs'
                            : `${selectedRouteItem.colorMeta.bgClass} ${selectedRouteItem.colorMeta.textClass} shadow-xs`
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedRouteItem.isWhite ? 'bg-white border border-black' : 'bg-white/80'
                          }`}
                        />
                        {selectedRouteItem.colorMeta.label}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectRouteFilter('')}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    title="Close fare matrix"
                    aria-label="Close route fare details"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Fare Matrix: Standard Trip vs Extended Trip */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="h-3.5 w-3.5 text-lacvay-green" />
                    <span className="text-xs font-bold text-gray-800">Fixed Fare Matrix</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Standard Trip */}
                    <div className="rounded-xl border border-lacvay-green/10 bg-lacvay-blush/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-lacvay-green">
                          Standard Trip
                        </span>
                        <span className="rounded bg-lacvay-blush px-1.5 py-0.5 text-[9px] font-semibold text-lacvay-green-dark">
                          Base
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between">
                        <div>
                          <p className="text-[10px] text-gray-500">Regular</p>
                          <p className="text-base font-extrabold text-gray-900">
                            ₱{selectedRouteFares.standardRegular.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">Discount</p>
                          <p className="text-sm font-bold text-lacvay-green">
                            ₱{selectedRouteFares.standardDiscounted.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Extended Trip */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          Extended Trip
                        </span>
                        <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-semibold text-amber-900">
                          Total
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between">
                        <div>
                          <p className="text-[10px] text-gray-500">Regular</p>
                          <p className="text-base font-extrabold text-gray-900">
                            ₱{selectedRouteFares.extendedRegular.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">Discount</p>
                          <p className="text-sm font-bold text-amber-700">
                            ₱{selectedRouteFares.extendedDiscounted.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commuter policy notice */}
                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Info className="h-3 w-3 shrink-0 text-lacvay-green" />
                  <span>Fixed fare policy. 20% discount for Students, Seniors & PWD.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
