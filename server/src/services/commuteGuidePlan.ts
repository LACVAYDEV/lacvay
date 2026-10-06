import {
  buildOptimizedItinerary,
  type OptimizedItinerary,
  type RouteMatchInput,
} from './itineraryPlanner.js';

export type GuideLegMode = 'walk' | 'jeepney' | 'tnvs';

export interface GuideLeg {
  order: number;
  mode: GuideLegMode;
  title: string;
  description: string;
  minutes?: number;
  fareRegular?: number;
  fareDiscounted?: number;
  routeName?: string;
  /** [lat, lng] polyline for this leg */
  path: [number, number][];
}

export interface CommuteGuidePlan {
  title: string;
  origin: { label: string; lat: number; lng: number };
  destination: { label: string; lat: number; lng: number };
  planType: OptimizedItinerary['planType'] | 'from_reply';
  legs: GuideLeg[];
  totalMinutes: number | null;
  totalFareRegular: number | null;
  totalFareDiscounted: number | null;
  sourceReply?: string;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function nearestIndex(path: [number, number][], lat: number, lng: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(lat, lng, path[i][0], path[i][1]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function modeTitle(mode: GuideLegMode): string {
  if (mode === 'walk') return 'Walk';
  if (mode === 'jeepney') return 'Jeepney';
  return 'TNVS';
}

function findRoutePath(matches: RouteMatchInput[], routeName?: string): [number, number][] {
  if (!routeName) return [];
  const n = routeName.toLowerCase();
  const hit = matches.find(
    (m) =>
      m.route.route_name.toLowerCase() === n ||
      m.route.route_name.toLowerCase().includes(n) ||
      n.includes(m.route.route_name.toLowerCase()),
  );
  const raw = hit?.path ?? [];
  // Keep only Batangas land corridor points (drop ferry / bay outliers)
  return raw.filter(
    ([lat, lng]) =>
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= 13.58 &&
      lat <= 13.92 &&
      lng >= 121.025 &&
      lng <= 121.22,
  );
}

function enrichLegs(
  itinerary: OptimizedItinerary,
  origin: { label: string; lat: number; lng: number },
  destination: { label: string; lat: number; lng: number },
  matches: RouteMatchInput[],
): GuideLeg[] {
  let cursor: [number, number] = [origin.lat, origin.lng];
  const dest: [number, number] = [destination.lat, destination.lng];
  const legs = itinerary.legs;
  const out: GuideLeg[] = [];

  for (let index = 0; index < legs.length; index++) {
    const leg = legs[index];
    const isLast = index === legs.length - 1;
    const routePath = findRoutePath(matches, leg.routeName);

    let path: [number, number][];
    let next: [number, number];

    if (leg.mode === 'jeepney' && routePath.length >= 2) {
      const boardIdx = nearestIndex(routePath, cursor[0], cursor[1]);
      const board = routePath[boardIdx];
      // Walk stub onto the line if needed
      if (haversineKm(cursor[0], cursor[1], board[0], board[1]) > 0.05) {
        // board point is on the corridor
      }
      const nextJeepneyLeg = legs.slice(index + 1).find((l) => l.mode === 'jeepney' && l.routeName);
      const target = isLast
        ? dest
        : nextJeepneyLeg
          ? (() => {
              const nextPath = findRoutePath(matches, nextJeepneyLeg.routeName);
              if (nextPath.length) {
                const gap = nearestPoints(routePath, nextPath);
                return gap?.onA ?? dest;
              }
              return dest;
            })()
          : dest;
      const alightIdx = nearestIndex(routePath, target[0], target[1]);
      if (boardIdx <= alightIdx) {
        path = routePath.slice(boardIdx, alightIdx + 1);
      } else {
        path = routePath.slice(alightIdx, boardIdx + 1).reverse();
      }
      if (path.length < 2) {
        path = [board, routePath[alightIdx]];
      }
      // Always finish jeepney leg toward destination side on the corridor, then hand off
      next = isLast ? dest : path[path.length - 1];
      if (isLast) {
        path = [...path, dest];
      }
    } else if (isLast) {
      path = [cursor, dest];
      next = dest;
    } else if (legs[index + 1]?.mode === 'jeepney') {
      const nextPath = findRoutePath(matches, legs[index + 1].routeName);
      next = nextPath.length
        ? nextPath[nearestIndex(nextPath, cursor[0], cursor[1])]
        : [
            cursor[0] + (dest[0] - cursor[0]) / (legs.length - index),
            cursor[1] + (dest[1] - cursor[1]) / (legs.length - index),
          ];
      path = [cursor, next];
    } else {
      next = [
        cursor[0] + (dest[0] - cursor[0]) / (legs.length - index),
        cursor[1] + (dest[1] - cursor[1]) / (legs.length - index),
      ];
      path = [cursor, next];
    }

    out.push({
      order: index + 1,
      mode: leg.mode,
      title:
        leg.title ||
        (leg.mode === 'walk' &&
        index > 0 &&
        index < legs.length - 1 &&
        legs.slice(index + 1).some((l) => l.mode === 'jeepney')
          ? 'Transfer Walk'
          : modeTitle(leg.mode)),
      description: leg.summary,
      minutes: leg.minutes,
      fareRegular: leg.fareRegular,
      fareDiscounted: leg.fareDiscounted,
      routeName: leg.routeName,
      path,
    });
    cursor = next;
  }

  return out;
}

function nearestPoints(
  a: [number, number][],
  b: [number, number][],
): { onA: [number, number]; onB: [number, number] } | null {
  if (!a.length || !b.length) return null;
  let best = Infinity;
  let onA = a[0];
  let onB = b[0];
  for (const p of a) {
    for (const q of b) {
      const d = haversineKm(p[0], p[1], q[0], q[1]);
      if (d < best) {
        best = d;
        onA = p;
        onB = q;
      }
    }
  }
  return { onA, onB };
}

/** Parse RESOLVED ORIGIN/DESTINATION lines; coords are always the last (lat, lng) pair on the line. */
export function parseResolvedPoint(
  briefing: string,
  kind: 'ORIGIN' | 'DESTINATION',
): { label: string; lat: number; lng: number } | null {
  const prefix = `RESOLVED ${kind}:`;
  const line = briefing.split('\n').find((l) => l.startsWith(prefix));
  if (!line) return null;
  const rest = line.slice(prefix.length).trim();
  const coordMatch = rest.match(/\((\d+\.\d+)\s*,\s*(\d+\.\d+)\)\s*$/);
  if (!coordMatch || coordMatch.index == null) return null;
  const label = rest.slice(0, coordMatch.index).trim();
  if (!label || /^unknown/i.test(label)) return null;
  let lat = Number(coordMatch[1]);
  let lng = Number(coordMatch[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Fix swapped GeoJSON-style pairs (lng, lat)
  if (lat > 50 && lng < 50) {
    const t = lat;
    lat = lng;
    lng = t;
  }
  // Batangas City bbox
  if (lat < 13.58 || lat > 13.92 || lng < 120.98 || lng > 121.22) return null;
  return { label, lat, lng };
}

function parseReplyLegs(
  reply: string,
  origin: { label: string; lat: number; lng: number },
  destination: { label: string; lat: number; lng: number },
): GuideLeg[] {
  const lines = reply.split('\n').map((l) => l.trim()).filter(Boolean);
  const steps: { mode: GuideLegMode; title: string; description: string }[] = [];

  for (const line of lines) {
    const num = line.match(/^\d+[.)]\s+\*\*(Walk|Jeepney|TNVS|Transfer Walk)[^*]*\*\*\s*[—:-]?\s*(.*)/i);
    const plain = line.match(/^\d+[.)]\s+(Walk|Jeepney|TNVS|Transfer Walk)\b[—:-]?\s*(.*)/i);
    const hit = num ?? plain;
    if (!hit) continue;
    const modeRaw = hit[1].toLowerCase();
    const mode: GuideLegMode =
      modeRaw.includes('walk') ? 'walk' : modeRaw.startsWith('jeep') ? 'jeepney' : 'tnvs';
    const isTransfer = /transfer\s+walk/i.test(hit[1]);
    const rest = (hit[2] || '').replace(/[*_]/g, '').trim();
    steps.push({
      mode,
      title: isTransfer ? 'Transfer Walk' : modeTitle(mode),
      description: rest || (isTransfer ? 'Transfer Walk' : modeTitle(mode)),
    });
  }

  if (!steps.length) return [];

  return steps.map((step, index) => {
    const t0 = index / steps.length;
    const t1 = (index + 1) / steps.length;
    const from: [number, number] = [
      origin.lat + (destination.lat - origin.lat) * t0,
      origin.lng + (destination.lng - origin.lng) * t0,
    ];
    const to: [number, number] = [
      origin.lat + (destination.lat - origin.lat) * t1,
      origin.lng + (destination.lng - origin.lng) * t1,
    ];
    return {
      order: index + 1,
      mode: step.mode,
      title: step.title,
      description: step.description,
      path: [from, to],
    };
  });
}

export function buildCommuteGuidePlan(opts: {
  briefing: string;
  reply: string;
  matches: RouteMatchInput[];
}): CommuteGuidePlan | null {
  const origin = parseResolvedPoint(opts.briefing, 'ORIGIN');
  const destination = parseResolvedPoint(opts.briefing, 'DESTINATION');
  if (!origin || !destination) return null;

  const itinerary = buildOptimizedItinerary(origin, destination, opts.matches);
  if (itinerary?.legs.length) {
    const legs = enrichLegs(itinerary, origin, destination, opts.matches);
    return {
      title: `${origin.label} → ${destination.label}`,
      origin,
      destination,
      planType: itinerary.planType,
      legs,
      totalMinutes: itinerary.totalMinutes,
      totalFareRegular: itinerary.totalFareRegular,
      totalFareDiscounted: itinerary.totalFareDiscounted,
      sourceReply: opts.reply,
    };
  }

  const replyLegs = parseReplyLegs(opts.reply, origin, destination);
  if (!replyLegs.length) {
    return {
      title: `${origin.label} → ${destination.label}`,
      origin,
      destination,
      planType: 'from_reply',
      legs: [
        {
          order: 1,
          mode: 'walk',
          title: 'Walk',
          description: `Head from ${origin.label} toward ${destination.label}`,
          path: [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ],
        },
      ],
      totalMinutes: null,
      totalFareRegular: null,
      totalFareDiscounted: null,
      sourceReply: opts.reply,
    };
  }

  return {
    title: `${origin.label} → ${destination.label}`,
    origin,
    destination,
    planType: 'from_reply',
    legs: replyLegs,
    totalMinutes: null,
    totalFareRegular: null,
    totalFareDiscounted: null,
    sourceReply: opts.reply,
  };
}
