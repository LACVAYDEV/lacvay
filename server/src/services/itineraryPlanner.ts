export interface RouteMatchInput {
  route: { id: string; route_name: string; vehicle_type: string };
  ends: { from: string; to: string; color?: string };
  path: [number, number][];
  originKm: number | null;
  destKm: number | null;
  servesOrigin: boolean;
  servesDest: boolean;
  direct: boolean;
  fareNote: string;
  landmarkNames: string[];
  fares: {
    regular?: number | null;
    discounted?: number | null;
    extended?: number | null;
    extendedDiscounted?: number | null;
  };
}

export interface ItineraryLeg {
  mode: 'walk' | 'jeepney' | 'tnvs';
  title?: string;
  summary: string;
  minutes: number;
  fareRegular?: number;
  fareDiscounted?: number;
  routeName?: string;
}

export interface OptimizedItinerary {
  planType: 'walk_only' | 'direct' | 'transfer' | 'jeepney_tnvs' | 'tnvs_only';
  legs: ItineraryLeg[];
  totalMinutes: number;
  totalFareRegular: number | null;
  totalFareDiscounted: number | null;
  score: number;
}

const PATH_SERVE_KM = 1.8;
const MAX_TRANSFER_WALK_KM = 3.5;
const WALK_MIN_PER_KM = 12;
const JEEPNEY_KMH = 18;
const TNVS_LAST_MILE_MIN = 12;

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

function walkMinutes(km: number): number {
  return Math.max(2, Math.round(km * WALK_MIN_PER_KM));
}

function jeepneyMinutes(km: number): number {
  return Math.max(8, Math.round((km / JEEPNEY_KMH) * 60));
}

function buildAccessLeg(distanceKm: number, toFromText: string): ItineraryLeg {
  const m = Math.max(50, Math.round(distanceKm * 1000));
  if (distanceKm <= 0.3) {
    return {
      mode: 'walk',
      summary: `Walk ~${m} meters ${toFromText}`,
      minutes: walkMinutes(distanceKm),
    };
  } else if (distanceKm <= 1.2) {
    return {
      mode: 'walk', // Keeps the map line dashed
      title: 'Walk / Tricycle / App',
      summary: `Walk or book a tricycle/app (~${m} meters) ${toFromText}`,
      minutes: walkMinutes(distanceKm),
    };
  } else {
    return {
      mode: 'tnvs',
      title: 'Tricycle / TNVS',
      summary: `Book a tricycle or TNVS app (~${distanceKm.toFixed(1)} km) ${toFromText}`,
      minutes: Math.max(5, Math.round(distanceKm * 4)),
    };
  }
}

function nearestPointsBetweenPaths(
  a: [number, number][],
  b: [number, number][],
): { walkKm: number } | null {
  if (a.length === 0 || b.length === 0) return null;
  let walkKm = Infinity;
  for (const [aLat, aLng] of a) {
    for (const [bLat, bLng] of b) {
      walkKm = Math.min(walkKm, haversineKm(aLat, aLng, bLat, bLng));
    }
  }
  return { walkKm };
}

export function nearestPointOnLine(
  pt: [number, number],
  path: [number, number][],
): { point: [number, number]; index: number; distanceKm: number } {
  if (!path.length) {
    return { point: pt, index: 0, distanceKm: 0 };
  }
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = haversineKm(pt[0], pt[1], path[i][0], path[i][1]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return { point: path[bestIdx], index: bestIdx, distanceKm: bestDist };
}

function pickFare(match: RouteMatchInput, tripKm: number): { regular?: number; discounted?: number } {
  const useExtended = tripKm > 3 && match.fares.extended != null;
  if (useExtended) {
    return {
      regular: match.fares.extended ?? undefined,
      discounted: match.fares.extendedDiscounted ?? undefined,
    };
  }
  return {
    regular: match.fares.regular ?? undefined,
    discounted: match.fares.discounted ?? undefined,
  };
}

function sumFares(legs: ItineraryLeg[]): { regular: number | null; discounted: number | null } {
  let regular = 0;
  let discounted = 0;
  let hasRegular = false;
  let hasDiscount = false;
  for (const leg of legs) {
    if (leg.fareRegular != null) {
      regular += leg.fareRegular;
      hasRegular = true;
    }
    if (leg.fareDiscounted != null) {
      discounted += leg.fareDiscounted;
      hasDiscount = true;
    }
  }
  return {
    regular: hasRegular ? regular : null,
    discounted: hasDiscount ? discounted : null,
  };
}

export function buildOptimizedItinerary(
  origin: { label: string; lat: number; lng: number },
  destination: { label: string; lat: number; lng: number },
  matches: RouteMatchInput[],
): OptimizedItinerary | null {
  const straightKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const candidates: OptimizedItinerary[] = [];

  if (straightKm <= 0.35) {
    const minutes = walkMinutes(straightKm);
    return {
      planType: 'walk_only',
      legs: [
        {
          mode: 'walk',
          summary: `Walk from ${origin.label} to ${destination.label} (~${straightKm.toFixed(2)} km)`,
          minutes,
        },
      ],
      totalMinutes: minutes,
      totalFareRegular: 0,
      totalFareDiscounted: 0,
      score: straightKm,
    };
  }

  const directRoutes = matches
    .filter((m) => m.direct && m.originKm != null && m.destKm != null)
    .sort((a, b) => a.originKm! + a.destKm! - (b.originKm! + b.destKm!));

  if (directRoutes.length) {
    const m = directRoutes[0];
    const walkOrigKm = m.originKm!;
    const walkDestKm = m.destKm!;
    const rideKm = Math.max(straightKm, walkOrigKm + walkDestKm);
    const fare = pickFare(m, rideKm);
    const legs: ItineraryLeg[] = [
      buildAccessLeg(walkOrigKm, `from ${origin.label} to the nearest stop on ${m.route.route_name}`),
      {
        mode: 'jeepney',
        summary: `Ride ${m.route.route_name} (corridor ${m.ends.from} ↔ ${m.ends.to}). Fares on file: ${m.fareNote}`,
        minutes: jeepneyMinutes(rideKm),
        fareRegular: fare.regular,
        fareDiscounted: fare.discounted,
        routeName: m.route.route_name,
      },
      buildAccessLeg(walkDestKm, `from the alight point on ${m.route.route_name} to ${destination.label}`),
    ];
    const totals = sumFares(legs);
    candidates.push({
      planType: 'direct',
      legs,
      totalMinutes: legs.reduce((s, l) => s + l.minutes, 0),
      totalFareRegular: totals.regular,
      totalFareDiscounted: totals.discounted,
      score: walkOrigKm + walkDestKm,
    });
  }

  const nearOrigin = matches
    .filter((m) => m.servesOrigin && !m.servesDest && m.originKm != null)
    .sort((a, b) => (a.originKm ?? 99) - (b.originKm ?? 99));
  const nearDest = matches
    .filter((m) => m.servesDest && !m.servesOrigin && m.destKm != null)
    .sort((a, b) => (a.destKm ?? 99) - (b.destKm ?? 99));

  let bestTransfer: {
    leg1: RouteMatchInput;
    leg2: RouteMatchInput;
    walkKm: number;
    score: number;
  } | null = null;

  for (const leg1 of nearOrigin.slice(0, 8)) {
    for (const leg2 of nearDest.slice(0, 8)) {
      if (leg1.route.id === leg2.route.id) continue;
      const gap = nearestPointsBetweenPaths(leg1.path, leg2.path);
      if (!gap || gap.walkKm > MAX_TRANSFER_WALK_KM) continue;
      const score = (leg1.originKm ?? 0) * 2 + gap.walkKm + (leg2.destKm ?? 0);
      if (!bestTransfer || score < bestTransfer.score) {
        bestTransfer = { leg1, leg2, walkKm: gap.walkKm, score };
      }
    }
  }

  if (bestTransfer) {
    const { leg1, leg2, walkKm, score } = bestTransfer;
    const fare1 = pickFare(leg1, leg1.originKm! + walkKm);
    const fare2 = pickFare(leg2, walkKm + leg2.destKm!);
    const legs: ItineraryLeg[] = [
      buildAccessLeg(leg1.originKm!, `from ${origin.label} to ${leg1.route.route_name} stop`),
      {
        mode: 'jeepney',
        summary: `Ride ${leg1.route.route_name}. Alight where this route is closest to ${leg2.route.route_name} (~${walkKm.toFixed(1)} km walk to transfer). Fares: ${leg1.fareNote}`,
        minutes: jeepneyMinutes(leg1.originKm! + walkKm),
        fareRegular: fare1.regular,
        fareDiscounted: fare1.discounted,
        routeName: leg1.route.route_name,
      },
      {
        mode: 'walk',
        summary: `Walk ~${Math.max(1, Math.round(walkMinutes(walkKm)))} min (~${Math.max(50, Math.round(walkKm * 1000))}m) to ${leg2.route.route_name} stop`,
        minutes: walkMinutes(walkKm),
      },
      {
        mode: 'jeepney',
        summary: `Ride ${leg2.route.route_name} toward ${destination.label}. Fares: ${leg2.fareNote}`,
        minutes: jeepneyMinutes(walkKm + leg2.destKm!),
        fareRegular: fare2.regular,
        fareDiscounted: fare2.discounted,
        routeName: leg2.route.route_name,
      },
      buildAccessLeg(leg2.destKm!, `from ${leg2.route.route_name} to ${destination.label}`),
    ];
    const totals = sumFares(legs);
    candidates.push({
      planType: 'transfer',
      legs,
      totalMinutes: legs.reduce((s, l) => s + l.minutes, 0),
      totalFareRegular: totals.regular,
      totalFareDiscounted: totals.discounted,
      score,
    });
  }

  // 3-jeepney transfer fallback: if no 2-jeepney transfer is found, find an intermediate bridge route
  let best3Transfer: {
    leg1: RouteMatchInput;
    mid: RouteMatchInput;
    leg2: RouteMatchInput;
    walkKm1: number;
    walkKm2: number;
    score: number;
  } | null = null;

  if (!bestTransfer) {
    const intermediateRoutes = matches.filter((m) => m.path.length >= 2);
    for (const leg1 of nearOrigin.slice(0, 6)) {
      for (const leg2 of nearDest.slice(0, 6)) {
        if (leg1.route.id === leg2.route.id) continue;
        for (const mid of intermediateRoutes) {
          if (mid.route.id === leg1.route.id || mid.route.id === leg2.route.id) continue;
          const gap1 = nearestPointsBetweenPaths(leg1.path, mid.path);
          if (!gap1 || gap1.walkKm > MAX_TRANSFER_WALK_KM) continue;
          const gap2 = nearestPointsBetweenPaths(mid.path, leg2.path);
          if (!gap2 || gap2.walkKm > MAX_TRANSFER_WALK_KM) continue;

          const score = (leg1.originKm ?? 0) * 2 + gap1.walkKm + gap2.walkKm + (leg2.destKm ?? 0) + 1.0;
          if (!best3Transfer || score < best3Transfer.score) {
            best3Transfer = {
              leg1,
              mid,
              leg2,
              walkKm1: gap1.walkKm,
              walkKm2: gap2.walkKm,
              score,
            };
          }
        }
      }
    }
  }

  if (best3Transfer) {
    const { leg1, mid, leg2, walkKm1, walkKm2, score } = best3Transfer;
    const fare1 = pickFare(leg1, (leg1.originKm ?? 0) + walkKm1);
    const fareMid = pickFare(mid, walkKm1 + walkKm2 + 3);
    const fare2 = pickFare(leg2, walkKm2 + (leg2.destKm ?? 0));
    const legs: ItineraryLeg[] = [
      buildAccessLeg(leg1.originKm ?? 0, `from ${origin.label} to ${leg1.route.route_name} stop`),
      {
        mode: 'jeepney',
        summary: `Ride ${leg1.route.route_name}. Alight where this route is closest to ${mid.route.route_name} (~${walkKm1.toFixed(1)} km transfer). Fares: ${leg1.fareNote}`,
        minutes: jeepneyMinutes((leg1.originKm ?? 0) + walkKm1),
        fareRegular: fare1.regular,
        fareDiscounted: fare1.discounted,
        routeName: leg1.route.route_name,
      },
      {
        mode: 'walk',
        summary: `Walk ~${Math.max(1, Math.round(walkMinutes(walkKm1)))} min (~${Math.max(50, Math.round(walkKm1 * 1000))}m) to ${mid.route.route_name} stop`,
        minutes: walkMinutes(walkKm1),
      },
      {
        mode: 'jeepney',
        summary: `Ride ${mid.route.route_name}. Alight where this route connects with ${leg2.route.route_name} (~${walkKm2.toFixed(1)} km transfer). Fares: ${mid.fareNote}`,
        minutes: jeepneyMinutes(walkKm1 + walkKm2 + 3),
        fareRegular: fareMid.regular,
        fareDiscounted: fareMid.discounted,
        routeName: mid.route.route_name,
      },
      {
        mode: 'walk',
        summary: `Walk ~${Math.max(1, Math.round(walkMinutes(walkKm2)))} min (~${Math.max(50, Math.round(walkKm2 * 1000))}m) to ${leg2.route.route_name} stop`,
        minutes: walkMinutes(walkKm2),
      },
      {
        mode: 'jeepney',
        summary: `Ride ${leg2.route.route_name} toward ${destination.label}. Fares: ${leg2.fareNote}`,
        minutes: jeepneyMinutes(walkKm2 + (leg2.destKm ?? 0)),
        fareRegular: fare2.regular,
        fareDiscounted: fare2.discounted,
        routeName: leg2.route.route_name,
      },
      buildAccessLeg(leg2.destKm ?? 0, `from ${leg2.route.route_name} to ${destination.label}`),
    ];
    const totals = sumFares(legs);
    candidates.push({
      planType: 'transfer',
      legs,
      totalMinutes: legs.reduce((s, l) => s + l.minutes, 0),
      totalFareRegular: totals.regular,
      totalFareDiscounted: totals.discounted,
      score,
    });
  }

  const bestOriginRoute = nearOrigin[0] ?? matches.filter((m) => m.servesOrigin).sort((a, b) => (a.originKm ?? 99) - (b.originKm ?? 99))[0];
  const destOffRouteKm = Math.min(...matches.map((m) => m.destKm ?? 99));

  if (bestOriginRoute && destOffRouteKm >= PATH_SERVE_KM && !directRoutes.length) {
    const walkOrigKm = bestOriginRoute.originKm ?? PATH_SERVE_KM;
    const fare = pickFare(bestOriginRoute, walkOrigKm + destOffRouteKm);
    const legs: ItineraryLeg[] = [
      {
        mode: 'walk',
        summary: `Walk from ${origin.label} to ${bestOriginRoute.route.route_name} (~${walkOrigKm.toFixed(1)} km)`,
        minutes: walkMinutes(walkOrigKm),
      },
      {
        mode: 'jeepney',
        summary: `Ride ${bestOriginRoute.route.route_name} toward the destination side. Fares: ${bestOriginRoute.fareNote}`,
        minutes: jeepneyMinutes(walkOrigKm + straightKm * 0.6),
        fareRegular: fare.regular,
        fareDiscounted: fare.discounted,
        routeName: bestOriginRoute.route.route_name,
      },
      {
        mode: 'tnvs',
        summary: `Book Angkas, Grab, or iDOL Taxi from the jeepney alight point for the last ~${destOffRouteKm.toFixed(1)} km to ${destination.label} (fare in app)`,
        minutes: TNVS_LAST_MILE_MIN,
      },
      {
        mode: 'walk',
        summary: `Short walk to ${destination.label} after TNVS drop-off if needed`,
        minutes: 3,
      },
    ];
    const totals = sumFares(legs);
    candidates.push({
      planType: 'jeepney_tnvs',
      legs,
      totalMinutes: legs.reduce((s, l) => s + l.minutes, 0),
      totalFareRegular: totals.regular,
      totalFareDiscounted: totals.discounted,
      score: walkOrigKm + destOffRouteKm + 1.5,
    });
  }

  // First-mile access: if origin is away from a route, check if any routes serve the destination
  const destServingRoutes = matches
    .filter((m) => m.servesDest && m.path.length >= 2)
    .map((m) => {
      const nearest = nearestPointOnLine([origin.lat, origin.lng], m.path);
      const originKm = m.originKm ?? nearest.distanceKm;
      return { match: m, originKm, nearestPoint: nearest.point, nearestIndex: nearest.index };
    })
    .sort((a, b) => a.originKm - b.originKm);

  if (destServingRoutes.length > 0) {
    const best = destServingRoutes[0];
    const m = best.match;
    const originKm = best.originKm;
    const destKm = m.destKm ?? 0.1;
    const rideKm = Math.max(straightKm, originKm + destKm);
    const fare = pickFare(m, rideKm);

    const accessLeg: ItineraryLeg = buildAccessLeg(originKm, `to ${m.route.route_name} corridor`);

    const jeepneyLeg: ItineraryLeg = {
      mode: 'jeepney',
      summary: `Board ${m.route.route_name} and alight near ${destination.label}`,
      minutes: jeepneyMinutes(rideKm),
      fareRegular: fare.regular,
      fareDiscounted: fare.discounted,
      routeName: m.route.route_name,
    };

    const finalWalkLeg: ItineraryLeg = buildAccessLeg(destKm, `to ${destination.label}`);

    const legs: ItineraryLeg[] = [accessLeg, jeepneyLeg, finalWalkLeg];
    const totals = sumFares(legs);
    candidates.push({
      planType: originKm <= 1.2 ? 'direct' : 'jeepney_tnvs',
      legs,
      totalMinutes: legs.reduce((s, l) => s + l.minutes, 0),
      totalFareRegular: totals.regular,
      totalFareDiscounted: totals.discounted,
      score: originKm + destKm,
    });
  }

  // Only fallback to full tnvs_only if neither the origin nor the destination has any accessible jeepney routes
  const hasAccessibleOrigin = matches.some((m) => m.servesOrigin);
  const hasAccessibleDest = matches.some((m) => m.servesDest);
  if (!hasAccessibleOrigin && !hasAccessibleDest) {
    const legs: ItineraryLeg[] = [
      {
        mode: 'tnvs',
        summary: `No accessible jeepney route found near ${origin.label} or ${destination.label}. Book Angkas, Grab, or iDOL Taxi door-to-door to ${destination.label}`,
        minutes: jeepneyMinutes(straightKm),
      },
    ];
    candidates.push({
      planType: 'tnvs_only',
      legs,
      totalMinutes: legs[0].minutes,
      totalFareRegular: null,
      totalFareDiscounted: null,
      score: straightKm + 10,
    });
  }

  if (!candidates.length) return null;
  return candidates.sort((a, b) => {
    const planPriority = (planType: string): number => {
      if (planType === 'direct') return 1;
      if (planType === 'transfer') return 2;
      if (planType === 'jeepney_tnvs') return 3;
      return 4; // tnvs_only
    };
    const prioA = planPriority(a.planType);
    const prioB = planPriority(b.planType);
    if (prioA !== prioB) return prioA - prioB;
    return a.score - b.score;
  })[0];
}

export function formatOptimizedItinerary(
  itinerary: OptimizedItinerary,
  origin: { label: string },
  destination: { label: string },
): string[] {
  const lines = [
    `OPTIMIZED ITINERARY (${itinerary.planType.replace(/_/g, ' ')} — computed from live route paths, fares, and coordinates; follow this plan):`,
    `From ${origin.label} to ${destination.label}`,
    '',
  ];

  itinerary.legs.forEach((leg, index) => {
    const modeLabel =
      leg.title
        ? leg.title
        : leg.mode === 'walk'
          ? index === 0
            ? 'Walk / Tricycle'
            : itinerary.planType === 'transfer' && (index === 2 || index === 4)
              ? 'Transfer Walk'
              : 'Walk'
          : leg.mode === 'jeepney'
            ? 'Jeepney'
            : 'TNVS';
    let line = `${index + 1}. **${modeLabel}** (~${leg.minutes} min) — ${leg.summary}`;
    if (leg.fareRegular != null) {
      line += `. Fare ₱${leg.fareRegular}${leg.fareDiscounted != null ? ` (discounted ₱${leg.fareDiscounted})` : ''}`;
    }
    lines.push(line);
  });

  lines.push('');
  if (itinerary.totalFareRegular != null) {
    lines.push(
      `**Total:** jeepney fares ₱${itinerary.totalFareRegular}${itinerary.totalFareDiscounted != null ? ` (discounted ₱${itinerary.totalFareDiscounted})` : ''}${itinerary.legs.some((l) => l.mode === 'tnvs') ? ' + TNVS fare in app' : ''}; estimated ~${itinerary.totalMinutes} min including walks.`,
    );
  } else {
    lines.push(`**Total:** TNVS fare in app; estimated ~${itinerary.totalMinutes} min.`);
  }

  return lines;
}
