/**
 * Road-snapped routing via public OSRM (OpenStreetMap roads).
 * Walk = short dashed footpaths only; jeepney/TNVS = solid driving roads.
 */

export type LatLngTuple = [number, number];

const OSRM_BASE = 'https://router.project-osrm.org';
/** Walk legs longer than this are treated as rides (mis-assigned coastal stretch). */
export const MAX_WALK_KM = 1.2;

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
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

/** Straight-line hop between endpoints. */
export function endpointKm(path: LatLngTuple[]): number {
  if (path.length < 2) return 0;
  return haversineKm(path[0], path[path.length - 1]);
}

/** Full polyline length (follows road bends). */
export function pathLengthKm(path: LatLngTuple[]): number {
  if (path.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    sum += haversineKm(path[i - 1], path[i]);
  }
  return sum;
}

function dedupeNear(points: LatLngTuple[], minKm = 0.06): LatLngTuple[] {
  const out: LatLngTuple[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || haversineKm(last, p) >= minKm) out.push(p);
  }
  return out;
}

export async function fetchRoadRoute(
  points: LatLngTuple[],
  profile: 'driving' | 'foot' = 'driving',
): Promise<LatLngTuple[]> {
  const cleaned = dedupeNear(
    points.filter(
      ([lat, lng]) =>
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat > 13.5 &&
        lat < 14 &&
        lng > 120.9 &&
        lng < 121.3,
    ),
  );

  if (cleaned.length < 2) return cleaned;

  const chunkSize = 20;
  const full: LatLngTuple[] = [];

  for (let i = 0; i < cleaned.length - 1; i += chunkSize - 1) {
    const chunk = cleaned.slice(i, Math.min(i + chunkSize, cleaned.length));
    if (chunk.length < 2) continue;

    const coords = chunk.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `${OSRM_BASE}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=false`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as OsrmRouteResponse;
      if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) continue;

      const segment = data.routes[0].geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as LatLngTuple,
      );
      for (const p of segment) {
        const last = full[full.length - 1];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) full.push(p);
      }
    } catch {
      /* ignore chunk */
    }
  }

  return full.length >= 2 ? full : cleaned;
}

export type RoadLegPath = {
  order: number;
  mode: 'walk' | 'jeepney' | 'tnvs';
  path: LatLngTuple[];
};

export function normalizeMode(mode: string, pathKm: number): 'walk' | 'jeepney' | 'tnvs' {
  const m = mode.toLowerCase();
  if (m === 'tnvs' || m.includes('angkas') || m.includes('grab')) return 'tnvs';
  // Long "walk" stretches on the coast are jeepney corridor — never dash those
  if (m === 'walk' || m === 'walking') {
    return pathKm > MAX_WALK_KM ? 'jeepney' : 'walk';
  }
  if (m === 'jeepney' || m.includes('jeep')) return 'jeepney';
  // Unknown / ride-like → jeepney when long, else jeepney default for transit maps
  return pathKm > MAX_WALK_KM ? 'jeepney' : m.includes('walk') ? 'walk' : 'jeepney';
}

/**
 * Snap each commute leg to OSM roads.
 * - Walk: foot profile only when the hop is short (≤1.2 km)
 * - Jeepney / TNVS / long hops: driving profile (solid road line)
 * Re-checks length after routing so winding footpaths can't stay dashed.
 */
export async function fetchRoadPathsForLegs(
  legs: Array<{ order: number; mode: string; path: LatLngTuple[] }>,
): Promise<RoadLegPath[]> {
  const results: RoadLegPath[] = [];

  // One continuous driving spine through every leg endpoint (best road continuity)
  const spinePts: LatLngTuple[] = [];
  for (const leg of legs) {
    const clean = dedupeNear(leg.path);
    if (!clean.length) continue;
    if (!spinePts.length) spinePts.push(clean[0]);
    spinePts.push(clean[clean.length - 1]);
  }
  const spine = await fetchRoadRoute(dedupeNear(spinePts), 'driving');

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];

    // If leg already contains a polyline from transit_routes.geojson_path, preserve it directly
    if (leg.path.length > 2 || leg.mode === 'jeepney') {
      results.push({
        order: leg.order,
        mode: leg.mode as 'walk' | 'jeepney' | 'tnvs',
        path: leg.path,
      });
      continue;
    }

    const ends =
      leg.path.length >= 2
        ? ([leg.path[0], leg.path[leg.path.length - 1]] as LatLngTuple[])
        : (leg.path as LatLngTuple[]);
    const hopKm = endpointKm(ends.length >= 2 ? ends : leg.path);
    let mode = normalizeMode(leg.mode, hopKm);

    let path: LatLngTuple[] = [];

    if (mode === 'walk') {
      if (hopKm <= 0.8) {
        // Bypass OSRM for short city walks to prevent it from drawing massive loops around blocks
        path = ends;
      } else {
        path = await fetchRoadRoute(ends, 'foot');
        if (path.length < 2) path = ends;
      }
    } else {
      path = await fetchRoadRoute(
        leg.path.length <= 6 && leg.path.length >= 2 ? (leg.path as LatLngTuple[]) : ends,
        'driving',
      );
      if (path.length < 2 && spine.length >= 2 && ends.length >= 2) {
        path = sliceNearest(spine, ends[0], ends[1]);
      }
    }

    if (path.length < 2) path = ends.length >= 2 ? ends : (leg.path as LatLngTuple[]);

    results.push({ order: leg.order, mode, path });
  }

  return results;
}

function nearestIndex(path: LatLngTuple[], pt: LatLngTuple): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(path[i], pt);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function sliceNearest(spine: LatLngTuple[], from: LatLngTuple, to: LatLngTuple): LatLngTuple[] {
  const a = nearestIndex(spine, from);
  const b = nearestIndex(spine, to);
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  const slice = spine.slice(start, end + 1);
  return slice.length >= 2 ? slice : [from, to];
}
