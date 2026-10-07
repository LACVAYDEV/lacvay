import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bus,
  Clock,
  Footprints,
  MapPin,
  Sparkles,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { GlobalCommuteGuide, TransportSegment, CommuteGuidePlan, GuideLegMode } from '@/types';
import { dataService } from '@/services/dataService';
import { loadActiveCommutePlan, clearActiveCommutePlan } from '@/services/aiService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { MotorcycleIcon } from '@/components/ui/TransportIcons';
import { TransportBar } from '@/components/home/TransportBar';
import { launchTransportApp, type TransportAppKey } from '@/lib/transportApps';
import { CurrentLocationMarker } from '@/components/map/CurrentLocationMarker';
import { rebuildPlanPaths, sanitizePath, isInBatangas } from '@/lib/mapCoordinates';
import {
  fetchRoadPathsForLegs,
  pathLengthKm,
  MAX_WALK_KM,
  type RoadLegPath,
} from '@/lib/roadRouting';
import { buildFallbackCommutePlan } from '@/lib/commutePlanFromReply';
import 'leaflet/dist/leaflet.css';

const BATANGAS_CENTER: [number, number] = [13.7565, 121.0583];

const MODE_COLORS: Record<GuideLegMode, string> = {
  walk: '#64748b',
  jeepney: '#6B1B2E',
  tnvs: '#123A5C',
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  direct: 'Direct jeepney',
  transfer: 'With transfer',
  walk_only: 'Walk only',
  jeepney_tnvs: 'Jeepney + ride-hailing',
  tnvs_only: 'Ride-hailing',
};

const originIcon = L.divIcon({
  className: 'commute-origin-marker',
  html: `<div style="background:#6B1B2E;color:#fff;border-radius:999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">A</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destIcon = L.divIcon({
  className: 'commute-dest-marker',
  html: `<div style="background:#dc2626;color:#fff;border-radius:999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">B</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
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
    const t = window.setTimeout(sync, 200);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
      window.clearTimeout(t);
    };
  }, [map]);
  return null;
}

function FitPlanBounds({ paths }: { paths: [number, number][][] }) {
  const map = useMap();
  useEffect(() => {
    const pts = paths.flat();
    if (pts.length < 2) return;
    const bounds = L.latLngBounds(pts.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, paths]);
  return null;
}

function ModeIcon({ mode }: { mode: GuideLegMode }) {
  if (mode === 'walk') return <Footprints className="h-4 w-4" />;
  if (mode === 'jeepney') return <Bus className="h-4 w-4" />;
  return <MotorcycleIcon className="h-4 w-4" />;
}

function PlanGuideView({
  plan: rawPlan,
  onClear,
}: {
  plan: CommuteGuidePlan;
  onClear: () => void;
}) {
  const navigate = useNavigate();
  const [activeLeg, setActiveLeg] = useState<number | null>(null);
  const [roadLegs, setRoadLegs] = useState<RoadLegPath[] | null>(null);
  const [routing, setRouting] = useState(true);

  const plan = useMemo(() => rebuildPlanPaths(rawPlan), [rawPlan]);

  useEffect(() => {
    let cancelled = false;
    setRouting(true);
    setRoadLegs(null);

    void fetchRoadPathsForLegs(
      plan.legs.map((leg) => ({
        order: leg.order,
        mode: leg.mode,
        path: sanitizePath(leg.path),
      })),
    ).then((paths) => {
      if (cancelled) return;
      setRoadLegs(paths);
      setRouting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [plan]);

  const displayLegs = useMemo(() => {
    // Step list keeps plan labels; map path comes from road snap.
    // Do not overwrite Walk titles just because routing upgraded a long hop.
    return plan.legs.map((leg) => {
      const road = roadLegs?.find((r) => r.order === leg.order);
      const isRouteGeoJson = leg.path.length > 2 || leg.mode === 'jeepney';
      return {
        order: leg.order,
        mode: leg.mode as GuideLegMode,
        mapMode: (road?.mode ?? leg.mode) as GuideLegMode,
        path: isRouteGeoJson ? sanitizePath(leg.path) : (road?.path?.length ? road.path : sanitizePath(leg.path)),
        title: leg.title,
        description: leg.description,
        minutes: leg.minutes,
        fareRegular: leg.fareRegular,
        routeName: leg.routeName,
        color: leg.color,
      };
    });
  }, [roadLegs, plan.legs]);

  const paths = useMemo(
    () => displayLegs.map((leg) => leg.path).filter((p) => p.length > 1),
    [displayLegs],
  );

  const highlightedPaths = useMemo(() => {
    if (activeLeg == null) return paths;
    const leg = displayLegs.find((l) => l.order === activeLeg);
    return leg?.path?.length ? [leg.path] : paths;
  }, [activeLeg, paths, displayLegs]);

  const fareLabel =
    plan.totalFareRegular != null
      ? `₱${plan.totalFareRegular}${
          plan.totalFareDiscounted != null ? ` (disc. ₱${plan.totalFareDiscounted})` : ''
        }${plan.legs.some((l) => l.mode === 'tnvs') ? ' + TNVS in app' : ''}`
      : plan.legs.some((l) => l.mode === 'tnvs')
        ? 'TNVS fare in app'
        : null;

  const openTnvs = (app: TransportAppKey) => {
    launchTransportApp(app);
  };

  return (
    <div className="space-y-5">
      {(plan.origin?.outOfBounds || plan.destination?.outOfBounds) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Location Outside Batangas City</p>
          <p className="mt-1 text-xs text-red-700">
            LACVAY transit navigation only supports destinations and origins located within Batangas City.
            Routes cannot be plotted on the map.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {PLAN_TYPE_LABELS[plan.planType] && (
            <div className="mb-1">
              <Badge variant="yellow">{PLAN_TYPE_LABELS[plan.planType]}</Badge>
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">{plan.title}</h2>
          {(plan.totalMinutes != null || fareLabel) && (
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
              {plan.totalMinutes != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ~{plan.totalMinutes} min
                </span>
              )}
              {fareLabel && <span>{fareLabel}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/ai-assistant')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:border-lacvay-green hover:text-lacvay-green"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to chat
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm hover:bg-gray-50"
          >
            Clear plan
          </button>
        </div>
      </div>

      <Card className="p-3 sm:p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-900">Quick Book a Ride</h3>
        <TransportBar variant="horizontal" />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card className="space-y-3 p-3 sm:p-4">
          <h3 className="text-sm font-bold text-gray-900">Step-by-step actions</h3>
          <ol className="space-y-2.5">
            {displayLegs.map((leg) => {
              const isActive = activeLeg === leg.order;
              return (
                <li key={leg.order}>
                  <button
                    type="button"
                    onClick={() => setActiveLeg(isActive ? null : leg.order)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      isActive
                        ? 'border-lacvay-green bg-lacvay-blush/60 ring-1 ring-lacvay-green/30'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: (leg.mode === 'jeepney' && leg.color) ? leg.color : MODE_COLORS[leg.mode] }}
                      >
                        <ModeIcon mode={leg.mode} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">#{leg.order}</span>
                          <span className="font-semibold text-gray-900">{leg.title}</span>
                          {leg.minutes != null && (
                            <span className="text-[11px] text-gray-500">~{leg.minutes} min</span>
                          )}
                          {leg.fareRegular != null && (
                            <span className="text-[11px] font-semibold text-lacvay-green">
                              ₱{leg.fareRegular}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">
                          {leg.description}
                        </p>
                        {leg.routeName && (
                          <p className="mt-1 text-[11px] font-medium text-gray-500">
                            Route: {leg.routeName}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  {leg.mode === 'tnvs' && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-12">
                      {(
                        [
                          ['angkas', 'Open Angkas'],
                          ['grab', 'Open Grab'],
                          ['idolTaxi', 'Open iDOL Taxi'],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => openTnvs(key)}
                          className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 border-t-2 border-dashed"
                style={{ borderColor: MODE_COLORS.walk }}
              />
              Walk (short dashed)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: MODE_COLORS.jeepney }} />
              Jeepney (solid road)
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 border-t-2 border-dotted"
                style={{ borderColor: MODE_COLORS.tnvs }}
              />
              TNVS
            </span>
          </div>
        </Card>

        <Card className="order-first overflow-hidden p-0 lg:sticky lg:top-16 lg:order-none lg:self-start">
          <div data-map-host className="relative h-[52vh] min-h-[320px] w-full overflow-hidden lg:h-[calc(100vh-6rem)]">
            {routing && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-gray-600 shadow">
                  <Loader2 className="h-3 w-3 animate-spin text-lacvay-green" />
                  Tracing roads…
                </span>
              </div>
            )}
            <MapContainer
              center={BATANGAS_CENTER}
              zoom={13}
              className="h-full w-full"
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapResizeController />
              <FitPlanBounds
                paths={[
                  ...(highlightedPaths.length ? highlightedPaths : paths),
                  [
                    [plan.origin.lat, plan.origin.lng],
                    [plan.destination.lat, plan.destination.lng],
                  ],
                ]}
              />
              <CurrentLocationMarker />

              {!plan.origin?.outOfBounds && isInBatangas(plan.origin.lat, plan.origin.lng) && (
                <Marker
                  position={[plan.origin.lat, plan.origin.lng]}
                  icon={originIcon}
                >
                  <Popup>
                    <strong>Origin (A)</strong>
                    <br />
                    {plan.origin.label}
                  </Popup>
                </Marker>
              )}
              {!plan.destination?.outOfBounds && isInBatangas(plan.destination.lat, plan.destination.lng) && (
                <Marker
                  position={[plan.destination.lat, plan.destination.lng]}
                  icon={destIcon}
                >
                  <Popup>
                    <strong>Destination (B)</strong>
                    <br />
                    {plan.destination.label}
                  </Popup>
                </Marker>
              )}

              {displayLegs.map((leg) => {
                const positions = sanitizePath(leg.path);
                if (positions.length < 2) return null;
                const km = pathLengthKm(positions);
                const isLast = leg.order === displayLegs[displayLegs.length - 1]?.order;
                // Last-mile to shrine: keep walk dash so Pagkilatan → Monte Maria spur shows
                const styleMode: GuideLegMode =
                  leg.mode === 'walk' && (km <= MAX_WALK_KM || isLast)
                    ? 'walk'
                    : leg.mode === 'walk' && km > MAX_WALK_KM
                      ? 'jeepney'
                      : (leg.mapMode as GuideLegMode);
                const dimmed = activeLeg != null && activeLeg !== leg.order;
                const isWalk = styleMode === 'walk';
                const isTnvs = styleMode === 'tnvs';
                return (
                  <Fragment key={`${leg.order}-${styleMode}-${positions.length}`}>
                    {/* Bottom Layer: Thicker Black Outline */}
                    <Polyline
                      positions={positions}
                      pathOptions={{
                        color: '#000000',
                        weight: dimmed ? 5 : isWalk ? 7 : 8,
                        opacity: dimmed ? 0.25 : 0.85,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />
                    {/* Top Layer: Thinner Route Color */}
                    <Polyline
                      positions={positions}
                      pathOptions={{
                        color: (styleMode === 'jeepney' && leg.color) ? leg.color : (MODE_COLORS[styleMode] ?? MODE_COLORS.jeepney),
                        weight: dimmed ? 3 : isWalk ? 4 : 5,
                        opacity: dimmed ? 0.35 : 1,
                        dashArray: isWalk ? '8 10' : isTnvs ? '2 12' : undefined,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                      eventHandlers={{
                        click: () => setActiveLeg(leg.order),
                      }}
                    />
                  </Fragment>
                );
              })}
            </MapContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function parsePassedGuide(g: any): GlobalCommuteGuide {
  return {
    id: g.id || 'saved-guide',
    title: g.title || 'Saved Itinerary',
    summary: g.summary || null,
    destination: g.destination || null,
    difficulty: g.difficulty || 'Custom Itinerary',
    estimated_travel_time_min: g.estimated_travel_time_min ?? null,
    estimated_fare_min: g.estimated_fare_min ?? null,
    estimated_fare_max: g.estimated_fare_max ?? null,
    is_global: false,
    transport_segments: Array.isArray(g.transport_segments) ? g.transport_segments : [],
    steps: Array.isArray(g.steps)
      ? g.steps.map((s: any, idx: number) => ({
          order: s.order ?? idx + 1,
          title: s.title || `Stop ${idx + 1}`,
          description: s.description || (s.location ? `Location: ${s.location}` : ''),
          tip: s.tip,
        }))
      : [],
  };
}

export default function CommutePage() {
  const location = useLocation();
  const stateObj = location.state as {
    plan?: CommuteGuidePlan;
    guide?: any;
    commuteGuide?: any;
  } | null;
  const passedGuide = stateObj?.guide || stateObj?.commuteGuide;

  const [selected, setSelected] = useState<GlobalCommuteGuide | null>(() => {
    return passedGuide ? parsePassedGuide(passedGuide) : null;
  });

  const [guides, setGuides] = useState<GlobalCommuteGuide[]>(() => {
    return passedGuide ? [parsePassedGuide(passedGuide)] : [];
  });

  const [loading, setLoading] = useState(true);

  const [activePlan, setActivePlan] = useState<CommuteGuidePlan | null>(() => {
    // If a saved guide was passed explicitly, prioritize showing it rather than any stale activePlan from localStorage
    if (passedGuide) {
      return null;
    }
    const fromState = stateObj?.plan;
    const loaded = fromState ?? loadActiveCommutePlan();
    return loaded ? rebuildPlanPaths(loaded) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const currentState = location.state as {
      plan?: CommuteGuidePlan;
      guide?: any;
      commuteGuide?: any;
    } | null;
    const currentPassed = currentState?.guide || currentState?.commuteGuide;

    if (currentState?.plan) {
      setActivePlan(rebuildPlanPaths(currentState.plan));
    } else if (currentPassed) {
      setActivePlan(null);
      const parsed = parsePassedGuide(currentPassed);
      setSelected(parsed);
      setGuides((prev) => [parsed, ...prev.filter((g) => g.id !== parsed.id)]);
    }
  }, [location.state]);

  useEffect(() => {
    dataService.getCommuteGuides().then((g) => {
      const currentState = location.state as {
        plan?: CommuteGuidePlan;
        guide?: any;
        commuteGuide?: any;
      } | null;
      const currentPassed = currentState?.guide || currentState?.commuteGuide;

      if (currentPassed) {
        const parsed = parsePassedGuide(currentPassed);
        setGuides([parsed, ...g.filter((item) => item.id !== parsed.id)]);
        setSelected(parsed);
      } else {
        setGuides(g);
      }
      setLoading(false);
    });
  }, [location.state]);

  const clearPlan = () => {
    clearActiveCommutePlan();
    setActivePlan(null);
    navigate('/commute', { replace: true, state: {} });
  };

  const handleViewRoute = (guide: GlobalCommuteGuide) => {
    const content = `${guide.title}\n${guide.summary || ''}\n` +
      (Array.isArray(guide.steps)
        ? guide.steps.map((s) => `${s.order}. ${s.title}: ${s.description || ''}`).join('\n')
        : '');
    const plan = buildFallbackCommutePlan(content, guide.destination || undefined);
    if (plan) {
      setActivePlan(rebuildPlanPaths(plan));
    } else {
      navigate(`/ai-assistant?prompt=${encodeURIComponent(`How do I travel to ${guide.destination || guide.title}`)}`);
    }
  };

  if (activePlan) {
    return <PlanGuideView plan={activePlan} onClear={clearPlan} />;
  }

  if (loading) return <LoadingState />;

  if (!guides.length) {
    return (
      <EmptyState
        icon={<Bus className="h-6 w-6" />}
        title="No commute guides yet"
        description="Ask LACVAY AI for a route, then tap View on Commute Guide to see the map and each walk, jeepney, and ride-hailing step here."
        action={
          <button
            type="button"
            onClick={() => navigate('/ai-assistant')}
            className="inline-flex items-center gap-2 rounded-lg bg-lacvay-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-lacvay-green-dark"
          >
            <Sparkles className="h-4 w-4" />
            Ask LACVAY AI
          </button>
        }
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="space-y-2.5">
          {guides.map((g) => {
            const segments: TransportSegment[] = Array.isArray(g.transport_segments)
              ? g.transport_segments
              : [];

            return (
              <Card
                key={g.id}
                className={`cursor-pointer border transition duration-200 ${
                  selected?.id === g.id
                    ? 'border-lacvay-green/40 ring-1 ring-lacvay-green/30'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setSelected(g)}
              >
                <h3 className="font-bold text-gray-900">{g.title}</h3>
                {g.destination && (
                  <p className="text-xs text-gray-500 mt-0.5">→ {g.destination}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="gray">{g.difficulty || 'Easy'}</Badge>
                  {g.estimated_travel_time_min && (
                    <Badge>~{g.estimated_travel_time_min} min</Badge>
                  )}
                  {g.estimated_fare_min != null && g.estimated_fare_max != null && (
                    <Badge variant="lime">
                      ₱{g.estimated_fare_min}–₱{g.estimated_fare_max}
                    </Badge>
                  )}
                </div>

                {segments.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {segments.map((seg, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-lacvay-cream px-2 py-1 text-[10.5px] font-semibold text-gray-600"
                      >
                        {seg.color && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: seg.color }}
                          />
                        )}
                        <Bus className="h-3 w-3" />
                        {seg.routeName || seg.type}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {selected ? (
          <Card className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selected.title}</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                {selected.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {selected.destination}
                  </span>
                )}
                {selected.estimated_travel_time_min && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> ~{selected.estimated_travel_time_min} min
                  </span>
                )}
                {selected.estimated_fare_min != null && selected.estimated_fare_max != null && (
                  <span>
                    ₱{selected.estimated_fare_min}–₱{selected.estimated_fare_max}
                  </span>
                )}
              </div>
            </div>

            {selected.summary && (
              <p className="text-sm text-gray-600 leading-relaxed bg-lacvay-blush/50 border border-lacvay-green/10 p-3 rounded-lg">
                {selected.summary}
              </p>
            )}

            {Array.isArray(selected.transport_segments) && selected.transport_segments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Transport Needed
                </h4>
                <div className="space-y-2">
                  {(selected.transport_segments as TransportSegment[]).map((seg, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 border border-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        {seg.color && (
                          <span
                            className="h-3 w-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: seg.color }}
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {seg.routeName || seg.type}
                          </p>
                          <p className="text-[10.5px] text-gray-500">{seg.type}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {seg.fare != null ? `₱${seg.fare}` : 'Varies'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selected.steps) && selected.steps.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Step-by-Step Directions
                </h4>
                <ol className="space-y-2.5">
                  {selected.steps.map((step) => (
                    <li key={step.order} className="flex gap-3 rounded-lg bg-gray-50 p-3 sm:p-3.5 border border-gray-100">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-xs font-bold text-white">
                        {step.order}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{step.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                        {step.tip && (
                          <p className="mt-1.5 text-xs text-lacvay-green font-medium">
                            Tip: {step.tip}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <Button onClick={() => handleViewRoute(selected)} className="w-full h-10 gap-2">
              <ArrowRight className="h-4 w-4" />
              View on Map & Routes
            </Button>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="Select a guide"
              description="Choose a commute guide from the list to see step-by-step directions and transport details."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
