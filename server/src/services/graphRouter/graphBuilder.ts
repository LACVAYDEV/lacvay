import type { TransitNode, TransitEdge, Graph, TransitRouteRow } from './types.js';

/** Earth radius in kilometers */
const EARTH_RADIUS_KM = 6371;

/** Default distance between synthetic stops along a transit route (200 meters) */
const DEFAULT_STOP_INTERVAL_KM = 0.2;

/** Maximum distance between stops of different routes to create transfer edges (100 meters) */
const DEFAULT_TRANSFER_MAX_KM = 0.1;

/**
 * Calculates great-circle distance between two coordinates in kilometers using Haversine formula.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * Safely parses string or object GeoJSON and extracts an ordered list of [lat, lng] coordinates.
 */
export function extractPolylineCoords(geojson: unknown): [number, number][] {
  if (!geojson) return [];

  const parsed = typeof geojson === 'string' ? safeJsonParse(geojson) : geojson;
  if (!parsed) return [];

  const pts: [number, number][] = [];

  const walk = (obj: unknown): void => {
    if (!obj) return;
    if (
      Array.isArray(obj) &&
      obj.length >= 2 &&
      typeof obj[0] === 'number' &&
      typeof obj[1] === 'number'
    ) {
      const a = Number(obj[0]);
      const b = Number(obj[1]);
      if (Number.isNaN(a) || Number.isNaN(b)) return;
      // In standard GeoJSON [lng, lat], Philippines longitude is ~120-122 and latitude is ~13-14.
      // If a > 50, a is longitude, b is latitude.
      const lat = a > 50 ? b : a;
      const lng = a > 50 ? a : b;
      pts.push([lat, lng]);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    const o = obj as Record<string, unknown>;
    if (o.type === 'LineString' && Array.isArray(o.coordinates)) {
      o.coordinates.forEach(walk);
      return;
    }
    if (o.type === 'MultiLineString' && Array.isArray(o.coordinates)) {
      o.coordinates.forEach(walk);
      return;
    }
    if (o.type === 'Feature' && o.geometry) {
      walk(o.geometry);
      return;
    }
    if (o.type === 'FeatureCollection' && Array.isArray(o.features)) {
      o.features.forEach((f) => {
        if (f && typeof f === 'object') {
          walk((f as { geometry?: unknown }).geometry ?? f);
        }
      });
      return;
    }
  };

  walk(parsed);
  return pts;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Resamples a polyline path to extract coordinates at fixed distance intervals (default 200m).
 * Also retains the route terminus if it is at least `minEndpointGapKm` from the last sampled stop.
 */
export function samplePolylineAtInterval(
  coords: [number, number][],
  intervalKm: number = DEFAULT_STOP_INTERVAL_KM,
  minEndpointGapKm: number = 0.05,
): [number, number][] {
  if (coords.length <= 1) return [...coords];

  const stops: [number, number][] = [coords[0]];
  let distanceSinceLastStop = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    let segDist = haversineKm(p1[0], p1[1], p2[0], p2[1]);
    if (segDist <= 1e-7) continue;

    let currentP = p1;

    while (distanceSinceLastStop + segDist >= intervalKm) {
      const remainingNeeded = intervalKm - distanceSinceLastStop;
      const ratio = Math.min(1, Math.max(0, remainingNeeded / segDist));

      const nextStop: [number, number] = [
        currentP[0] + (p2[0] - currentP[0]) * ratio,
        currentP[1] + (p2[1] - currentP[1]) * ratio,
      ];

      stops.push(nextStop);

      segDist -= remainingNeeded;
      currentP = nextStop;
      distanceSinceLastStop = 0;
    }

    distanceSinceLastStop += segDist;
  }

  // Include destination terminus if sufficiently distant from the last added stop
  const lastPoint = coords[coords.length - 1];
  const lastStop = stops[stops.length - 1];
  const distToEndpoint = haversineKm(lastStop[0], lastStop[1], lastPoint[0], lastPoint[1]);
  if (distToEndpoint >= minEndpointGapKm) {
    stops.push(lastPoint);
  }

  return stops;
}

export interface GraphBuilderOptions {
  /** Distance in km between extracted stops on each route (default: 0.2 km / 200m) */
  stopIntervalKm?: number;
  /** Max distance in km between different routes to add a transfer edge (default: 0.1 km / 100m) */
  transferMaxKm?: number;
  /** Whether to add ride edges in reverse sequence as well (default: false) */
  bidirectionalRides?: boolean;
}

/**
 * Builds a Transit Graph from active routes:
 * 1. Iterates through the GeoJSON of all active routes.
 * 2. Extracts coordinates at 200m intervals to act as "Stops" (Nodes).
 * 3. Connects sequential stops on the same route with 'ride' edges.
 * 4. Finds nodes from different routes that are within 100 meters of each other and connects them with 'transfer' edges.
 */
export function buildTransitGraph(
  routes: TransitRouteRow[],
  options?: GraphBuilderOptions,
): Graph {
  const stopIntervalKm = options?.stopIntervalKm ?? DEFAULT_STOP_INTERVAL_KM;
  const transferMaxKm = options?.transferMaxKm ?? DEFAULT_TRANSFER_MAX_KM;
  const bidirectionalRides = options?.bidirectionalRides ?? false;

  const nodes = new Map<string, TransitNode>();
  const adjacency = new Map<string, TransitEdge[]>();
  const allNodes: TransitNode[] = [];

  // Filter active routes (handling optional is_active / status flags gracefully)
  const activeRoutes = routes.filter((r) => {
    const row = r as Record<string, unknown>;
    return row.is_active !== false && row.status !== 'inactive';
  });

  // Step 1 & 2: Extract 200m stops (Nodes) for each route
  for (const route of activeRoutes) {
    if (!route.geojson_path) continue;

    const rawCoords = extractPolylineCoords(route.geojson_path);
    if (rawCoords.length === 0) continue;

    const sampledPoints = samplePolylineAtInterval(rawCoords, stopIntervalKm);
    const routeNodes: TransitNode[] = [];

    for (let idx = 0; idx < sampledPoints.length; idx++) {
      const pt = sampledPoints[idx];
      const nodeId = `${route.id}_node_${idx}`;

      const node: TransitNode = {
        id: nodeId,
        lat: pt[0],
        lng: pt[1],
        routeId: route.id,
        routeName: route.route_name,
        stopSequence: idx,
      };

      nodes.set(nodeId, node);
      adjacency.set(nodeId, []);
      routeNodes.push(node);
      allNodes.push(node);
    }

    // Step 3: Connect sequential stops on the same route with 'ride' edges
    for (let j = 0; j < routeNodes.length - 1; j++) {
      const fromNode = routeNodes[j];
      const toNode = routeNodes[j + 1];
      const distKm = haversineKm(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);

      const rideEdge: TransitEdge = {
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        distanceKm: distKm,
        cost: distKm,
        type: 'ride',
        routeId: route.id,
        routeName: route.route_name,
      };

      adjacency.get(fromNode.id)!.push(rideEdge);

      if (bidirectionalRides) {
        adjacency.get(toNode.id)!.push({
          fromNodeId: toNode.id,
          toNodeId: fromNode.id,
          distanceKm: distKm,
          cost: distKm,
          type: 'ride',
          routeId: route.id,
          routeName: route.route_name,
        });
      }
    }
  }

  // Step 4: Find nodes from different routes within 100 meters (transferMaxKm) and connect with 'transfer' edges
  for (let i = 0; i < allNodes.length; i++) {
    const nodeA = allNodes[i];
    for (let j = i + 1; j < allNodes.length; j++) {
      const nodeB = allNodes[j];

      // Only connect nodes from DIFFERENT routes
      if (nodeA.routeId === nodeB.routeId) continue;

      // Coordinate threshold bounding box filter (~0.0015 deg corresponds to ~160m)
      if (
        Math.abs(nodeA.lat - nodeB.lat) > 0.0015 ||
        Math.abs(nodeA.lng - nodeB.lng) > 0.0015
      ) {
        continue;
      }

      const distKm = haversineKm(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
      if (distKm <= transferMaxKm) {
        // Connect bidirectionally
        adjacency.get(nodeA.id)!.push({
          fromNodeId: nodeA.id,
          toNodeId: nodeB.id,
          distanceKm: distKm,
          cost: distKm,
          type: 'transfer',
        });

        adjacency.get(nodeB.id)!.push({
          fromNodeId: nodeB.id,
          toNodeId: nodeA.id,
          distanceKm: distKm,
          cost: distKm,
          type: 'transfer',
        });
      }
    }
  }

  return {
    nodes,
    adjacency,
    edges: adjacency,
  };
}
