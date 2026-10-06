/** Batangas City bounding box — reject / fix points that land in the bay or off-map. */
const BATANGAS_BOUNDS = {
  minLat: 13.58,
  maxLat: 13.92,
  minLng: 120.98,
  maxLng: 121.22,
};

/** West of this longitude is mostly Batangas Bay for the city–south coast corridor. */
const BAY_WEST_LNG = 121.038;

export type LatLng = { lat: number; lng: number };
export type LatLngTuple = [number, number];

const HUBS = {
  clb: { label: 'Colegio ng Lungsod ng Batangas (CLB)', lat: 13.7539, lng: 121.05 },
  pier: { label: 'Batangas Pier', lat: 13.754, lng: 121.043 },
  city: { label: 'Plaza Mabini / City proper', lat: 13.7565, lng: 121.0583 },
  sm: { label: 'SM City Batangas', lat: 13.7594, lng: 121.0722 },
  ilijanTerminal: { label: 'Ilijan Jeepney Terminal (SM)', lat: 13.7578, lng: 121.0708 },
  tabangao: { label: 'Tabangao corridor', lat: 13.72, lng: 121.068 },
  sanIsidro: { label: 'San Isidro', lat: 13.7333, lng: 121.0769 },
  /** On-land Pagkilatan / Montemaria (OSM ~13.642, 121.043 — nudged east onto land) */
  monteMaria: { label: 'Monte Maria', lat: 13.6422, lng: 121.0465 },
  pagkilatan: { label: 'Pagkilatan', lat: 13.668, lng: 121.048 },
  ilijan: { label: 'Ilijan', lat: 13.658, lng: 121.048 },
  stoNino: { label: 'Barangay Sto. Niño', lat: 13.699, lng: 121.0941 },
  grandTerminal: { label: 'Batangas City Grand Terminal', lat: 13.7818, lng: 121.0543 },
  pabloBorbon: { label: 'BatStateU Pablo Borbon Main Campus (Alangilan)', lat: 13.786, lng: 121.074 },
  evangelista: { label: 'A. Evangelista Street', lat: 13.75786, lng: 121.05735 },
} as const;

/** Snap common place labels to trusted on-land coordinates. */
const TRUSTED_POINTS: { label: string; lat: number; lng: number; aliases: string[] }[] = [
  { ...HUBS.clb, aliases: ['clb', 'colegio', 'sports coliseum', 'arrieta'] },
  { ...HUBS.stoNino, aliases: ['sto nino', 'santo nino', 'barangay sto'] },
  { ...HUBS.sm, aliases: ['sm batangas', 'sm city', 'sm city batangas'] },
  { ...HUBS.pier, aliases: ['pier', 'batangas pier', 'ppa', 'port of batangas'] },
  { ...HUBS.monteMaria, aliases: ['monte maria', 'montemaria', 'montemaria shrine'] },
  { ...HUBS.grandTerminal, aliases: ['grand terminal', 'city terminal'] },
  { ...HUBS.pabloBorbon, aliases: ['pablo borbon', 'batstateu', 'alangilan', 'main campus'] },
  { ...HUBS.city, aliases: ['basilica', 'plaza mabini', 'city hall', 'city proper'] },
  { ...HUBS.ilijanTerminal, aliases: ['ilijan terminal', 'ilijan jeepney', 'sm parking'] },
  { ...HUBS.pagkilatan, aliases: ['pagkilatan'] },
  { ...HUBS.ilijan, aliases: ['ilijan'] },
  { ...HUBS.sanIsidro, aliases: ['san isidro'] },
  { ...HUBS.tabangao, aliases: ['tabangao'] },
  { ...HUBS.evangelista, aliases: ['evangelista'] },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isInBatangas(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= BATANGAS_BOUNDS.minLat &&
    lat <= BATANGAS_BOUNDS.maxLat &&
    lng >= BATANGAS_BOUNDS.minLng &&
    lng <= BATANGAS_BOUNDS.maxLng
  );
}

export function sanitizeLatLng(lat: number, lng: number): LatLngTuple | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  if (lat > 50 && lng < 50) {
    const swapped: LatLngTuple = [lng, lat];
    return isInBatangas(swapped[0], swapped[1]) ? swapped : null;
  }

  if (isInBatangas(lat, lng)) return [lat, lng];
  if (isInBatangas(lng, lat)) return [lng, lat];
  return null;
}

export function snapTrustedPlace(label: string): (LatLng & { label: string }) | null {
  const n = normalize(label);
  let best: (typeof TRUSTED_POINTS)[number] | null = null;
  let bestLen = 0;
  for (const p of TRUSTED_POINTS) {
    for (const alias of p.aliases) {
      const a = normalize(alias);
      if ((n.includes(a) || normalize(p.label).includes(n)) && a.length >= bestLen) {
        best = p;
        bestLen = a.length;
      }
    }
  }
  return best ? { label: best.label, lat: best.lat, lng: best.lng } : null;
}

export function resolveMapPoint(
  label: string,
  lat: number,
  lng: number,
): { label: string; lat: number; lng: number } {
  const trusted = snapTrustedPlace(label);
  if (trusted) return trusted;

  const sanitized = sanitizeLatLng(lat, lng);
  if (sanitized) {
    // Nudge points that sit in the open bay east onto the coastal road
    if (sanitized[1] < BAY_WEST_LNG && sanitized[0] < 13.76) {
      return { label, lat: sanitized[0], lng: Math.max(sanitized[1], 121.046) };
    }
    return { label, lat: sanitized[0], lng: sanitized[1] };
  }

  return { label, lat: HUBS.city.lat, lng: HUBS.city.lng };
}

export function sanitizePath(path: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const pt of path) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const fixed = sanitizeLatLng(Number(pt[0]), Number(pt[1]));
    if (fixed && fixed[1] >= BATANGAS_BOUNDS.minLng) out.push(fixed);
  }
  return out;
}

function toTuple(p: LatLng): LatLngTuple {
  return [p.lat, p.lng];
}

function haversineKm(a: LatLngTuple, b: LatLngTuple): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** True if a straight segment would cut across Batangas Bay. */
function crossesBay(a: LatLngTuple, b: LatLngTuple): boolean {
  const midLat = (a[0] + b[0]) / 2;
  const midLng = (a[1] + b[1]) / 2;
  const longNorthSouth = Math.abs(a[0] - b[0]) > 0.04;
  const nearCoast = Math.min(a[1], b[1]) < 121.06;
  return longNorthSouth && nearCoast && midLng < 121.055 && midLat > 13.63 && midLat < 13.78;
}

/**
 * South-coast / pier–city land corridor (never across the bay).
 * Goes CLB/Pier → city → SM → Tabangao road → Pagkilatan → Monte Maria.
 */
function southCoastCorridor(from: LatLngTuple, to: LatLngTuple): LatLngTuple[] {
  const south = from[0] < to[0] ? from : to;
  const north = from[0] < to[0] ? to : from;
  const goingSouth = from[0] > to[0];

  const chain: LatLngTuple[] = [
    north,
    toTuple(HUBS.city),
    toTuple(HUBS.sm),
    toTuple(HUBS.ilijanTerminal),
    toTuple(HUBS.tabangao),
    [13.70, 121.06],
    [13.68, 121.052],
    toTuple(HUBS.pagkilatan),
    toTuple(HUBS.monteMaria),
    south,
  ];

  // Dedupe consecutive duplicates
  const cleaned: LatLngTuple[] = [];
  for (const p of chain) {
    const last = cleaned[cleaned.length - 1];
    if (!last || haversineKm(last, p) > 0.05) cleaned.push(p);
  }

  return goingSouth ? cleaned : [...cleaned].reverse();
}

/** Build a land-safe polyline between two points (insert SM corridor if needed). */
export function landSafePath(from: LatLngTuple, to: LatLngTuple): LatLngTuple[] {
  if (haversineKm(from, to) < 0.15) return [from, to];
  if (!crossesBay(from, to)) return [from, to];
  return southCoastCorridor(from, to);
}

function waypointFromText(text: string): LatLng | null {
  return snapTrustedPlace(text);
}

/**
 * Assign a waypoint to each leg from description landmarks, then connect
 * with land-safe polylines (via SM / coastal road — never across the bay).
 */
export function rebuildPlanPaths<
  T extends {
    origin: { label: string; lat: number; lng: number };
    destination: { label: string; lat: number; lng: number };
    legs: Array<{
      mode: string;
      path: [number, number][];
      order: number;
      description?: string;
      title?: string;
      routeName?: string;
    }>;
  },
>(plan: T): T {
  // If the plan already contains valid polyline coordinates from transit_routes.geojson_path,
  // bypass hardcoded southCoastCorridor and HUBS snapping and strictly render the actual path.
  const hasRouteGeoJson = plan.legs.some(
    (l) => Array.isArray(l.path) && l.path.length >= 2 && (l.mode === 'jeepney' || l.path.length > 2),
  );
  if (hasRouteGeoJson) {
    return {
      ...plan,
      origin:
        plan.origin.lat && plan.origin.lng
          ? plan.origin
          : resolveMapPoint(plan.origin.label, plan.origin.lat, plan.origin.lng),
      destination:
        plan.destination.lat && plan.destination.lng
          ? plan.destination
          : resolveMapPoint(plan.destination.label, plan.destination.lat, plan.destination.lng),
      legs: plan.legs.map((leg) => ({
        ...leg,
        path: sanitizePath(leg.path),
      })),
    };
  }

  const origin = resolveMapPoint(plan.origin.label, plan.origin.lat, plan.origin.lng);
  const destination = resolveMapPoint(
    plan.destination.label,
    plan.destination.lat,
    plan.destination.lng,
  );

  const originT = toTuple(origin);
  const destT = toTuple(destination);

  // Build ordered waypoints: origin → (landmarks from each leg) → destination
  const stops: LatLngTuple[] = [originT];
  for (const leg of plan.legs) {
    const blob = `${leg.title ?? ''} ${leg.description ?? ''} ${leg.routeName ?? ''}`;
    const hit = waypointFromText(blob);
    if (hit) {
      const t = toTuple(hit);
      const last = stops[stops.length - 1];
      if (haversineKm(last, t) > 0.12) stops.push(t);
    }
  }
  if (haversineKm(stops[stops.length - 1], destT) > 0.12) stops.push(destT);
  else stops[stops.length - 1] = destT;

  // Assign endpoints by mode: short walks at ends / transfers; rides get the corridor.
  // Trust leg.mode only — descriptions often say "jeepney stop" on walk steps.
  const MAX_WALK_KM = 1.2;
  const boardStop = stops[Math.min(1, stops.length - 1)] ?? originT;
  const alightStop = stops[Math.max(0, stops.length - 2)] ?? destT;
  const rideStops = stops.length >= 3 ? stops.slice(1, -1) : [boardStop, alightStop];

  const modeOf = (leg: (typeof plan.legs)[number]): 'walk' | 'jeepney' | 'tnvs' => {
    const m = (leg.mode || '').toLowerCase();
    if (m === 'tnvs' || m.includes('angkas') || m.includes('grab')) return 'tnvs';
    if (m === 'walk' || m === 'walking') return 'walk';
    if (m === 'jeepney' || m.includes('jeep')) return 'jeepney';
    // Fallback from title only (not description — avoids "walk to jeepney stop" → jeepney)
    const t = (leg.title || '').toLowerCase();
    if (t.startsWith('walk')) return 'walk';
    if (t.startsWith('tnvs') || t.includes('angkas') || t.includes('grab')) return 'tnvs';
    return 'jeepney';
  };

  const classified = plan.legs.map((leg, index) => {
    const mode = modeOf(leg);
    return { leg, index, mode, isWalk: mode === 'walk', isRide: mode !== 'walk' };
  });

  const rideIdx = classified.filter((c) => c.isRide).map((c) => c.index);

  const legs = classified.map(({ leg, index, mode, isWalk }) => {
    let from: LatLngTuple;
    let to: LatLngTuple;
    let outMode = mode;

    if (isWalk && plan.legs.length === 1) {
      // Single-leg fallback: full trip line (never clip to 12% first-mile stub)
      from = originT;
      to = destT;
    } else if (isWalk && index === 0) {
      from = originT;
      to = boardStop;
      // Keep first-mile walk short on the map (board at nearest stop)
      if (haversineKm(from, to) > MAX_WALK_KM) {
        const t = 0.12;
        to = [
          from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t,
        ];
      }
    } else if (isWalk && index === plan.legs.length - 1) {
      // Last mile: ALWAYS draw full alight → destination (e.g. Pagkilatan → Monte Maria).
      // Never clip this — clipping left a blank gap inland at the shrine.
      from = alightStop;
      to = destT;
      // Prefer coastal jeepney alight (Pagkilatan) when dest is Monte Maria / inland shrine
      if (/monte maria|montemaria|pagkilatan|ilijan/i.test(destination.label)) {
        from = toTuple(HUBS.pagkilatan);
        // If dest snapped to Pagkilatan itself, push B inland to shrine access
        if (haversineKm(to, toTuple(HUBS.pagkilatan)) < 0.35) {
          to = toTuple(HUBS.monteMaria);
        }
      }
    } else if (isWalk) {
      // Transfer walk (e.g. SM entrance → Ilijan terminal): short hub hop only
      from = toTuple(HUBS.sm);
      to = toTuple(HUBS.ilijanTerminal);
    } else {
      // Jeepney / TNVS: slice of the land corridor
      const ridePos = Math.max(0, rideIdx.indexOf(index));
      const rideCount = Math.max(1, rideIdx.length);
      const aIdx = Math.floor((ridePos / rideCount) * Math.max(1, rideStops.length - 1));
      const bIdx = Math.max(
        aIdx + 1,
        Math.floor(((ridePos + 1) / rideCount) * Math.max(1, rideStops.length - 1)),
      );
      from = rideStops[Math.min(aIdx, rideStops.length - 1)] ?? boardStop;
      to = rideStops[Math.min(bIdx, rideStops.length - 1)] ?? alightStop;
      if (ridePos === 0) from = boardStop;
      if (ridePos === rideCount - 1) {
        // End jeepney at coastal alight — last walk/TNVS covers shrine spur
        to =
          /monte maria|montemaria/i.test(destination.label)
            ? toTuple(HUBS.pagkilatan)
            : alightStop;
      }
      if (index === 0) from = originT;
      // Only pin last ride to dest when there is no trailing walk leg
      if (index === plan.legs.length - 1) to = destT;
    }

    // Long last-mile to shrine: keep mode as walk/tnvs for labels; map may solid-style if long
    if (
      outMode === 'walk' &&
      haversineKm(from, to) > MAX_WALK_KM &&
      index !== plan.legs.length - 1
    ) {
      outMode = 'jeepney';
    }

    const title =
      outMode === mode
        ? leg.title ||
          (outMode === 'walk' ? 'Walk' : outMode === 'tnvs' ? 'TNVS' : 'Jeepney')
        : outMode === 'tnvs'
          ? 'TNVS'
          : outMode === 'walk'
            ? 'Walk'
            : 'Jeepney';

    return {
      ...leg,
      mode: outMode as typeof leg.mode,
      title,
      path: landSafePath(from, to),
    };
  });

  return {
    ...plan,
    origin,
    destination,
    legs,
  };
}
