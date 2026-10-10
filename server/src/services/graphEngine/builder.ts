import type {
  TransitRouteRow,
  HubPoint,
  GraphNode,
  GraphEdge,
  TransitGraph,
} from './types.js';

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Extracts [latitude, longitude] coordinates from arbitrary GeoJSON.
 */
export function extractPolylineCoords(geojson: unknown): [number, number][] {
  if (!geojson) return [];

  const convertPoint = (pt: unknown): [number, number] | null => {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const a = Number(pt[0]);
    const b = Number(pt[1]);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    let lat = a;
    let lng = b;
    // GeoJSON standard is [longitude, latitude]
    if (a > 50 && b < 50) {
      lat = b;
      lng = a;
    }
    // Batangas City valid bounding box check
    if (lat < 13.58 || lat > 13.92 || lng < 120.98 || lng > 121.22) return null;
    return [lat, lng];
  };

  if (Array.isArray(geojson)) {
    return geojson.map(convertPoint).filter((p): p is [number, number] => p !== null);
  }

  const obj = geojson as Record<string, unknown>;
  if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
    return obj.features.flatMap((f) => extractPolylineCoords((f as { geometry?: unknown }).geometry ?? f));
  }
  if (obj.type === 'Feature' && obj.geometry) {
    return extractPolylineCoords(obj.geometry);
  }
  if (obj.type === 'LineString' && Array.isArray(obj.coordinates)) {
    return obj.coordinates.map(convertPoint).filter((p): p is [number, number] => p !== null);
  }
  if (obj.type === 'MultiLineString' && Array.isArray(obj.coordinates)) {
    return obj.coordinates.flatMap((line) =>
      Array.isArray(line)
        ? line.map(convertPoint).filter((p): p is [number, number] => p !== null)
        : [],
    );
  }
  return [];
}

function sanitizeId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Builds the complete Transit Graph.
 * 
 * 1. Injects HUB_POINTS so key hubs are distinct and identifiable.
 * 2. Creates GraphNodes for each coordinate in each route's polyline (snapping to nearby hubs).
 * 3. Creates sequential 'ride' edges along routes with weight = distanceKm * 1.
 * 4. Spatial cross-check: creates 'transfer' edges between different routes within 0.15km
 *    with weight = (distanceKm * 15) + 3.
 */
export function buildTransitGraph(
  routes: TransitRouteRow[],
  hubs: HubPoint[] = [],
): TransitGraph {
  const nodes = new Map<string, GraphNode>();
  const adjacency = new Map<string, GraphEdge[]>();

  const addEdge = (edge: GraphEdge) => {
    let list = adjacency.get(edge.fromNode);
    if (!list) {
      list = [];
      adjacency.set(edge.fromNode, list);
    }
    list.push(edge);
  };

  // 1. Forcefully inject HUB_POINTS into the graph
  const hubNodes: GraphNode[] = [];
  for (const hub of hubs) {
    const hubId = `hub_${sanitizeId(hub.label || hub.name || 'hub')}`;
    const hubNode: GraphNode = {
      id: hubId,
      lat: hub.lat,
      lng: hub.lng,
      routeIds: [],
      isHub: true,
      hubName: hub.label || hub.name,
    };
    nodes.set(hubId, hubNode);
    hubNodes.push(hubNode);
  }

  // Snapping distance threshold to snap route nodes to hubs (200m)
  const HUB_SNAP_DISTANCE_KM = 0.2;

  // 2. Iterate through routes and create GraphNodes + sequential ride edges
  for (const route of routes) {
    const rawCoords = extractPolylineCoords(route.geojson_path);
    if (rawCoords.length < 2) continue;

    // Filter consecutive duplicate coordinates (< 2 meters)
    const cleanedCoords: [number, number][] = [rawCoords[0]];
    for (let i = 1; i < rawCoords.length; i++) {
      const prev = cleanedCoords[cleanedCoords.length - 1];
      const curr = rawCoords[i];
      if (haversineKm(prev[0], prev[1], curr[0], curr[1]) >= 0.002) {
        cleanedCoords.push(curr);
      }
    }

    const routeNodeList: GraphNode[] = [];

    // 2a. Create GraphNodes for every coordinate in the route's polyline
    // Retain exact surveyed coordinates from GeoJSON to avoid warping road lines
    for (let i = 0; i < cleanedCoords.length; i++) {
      const [lat, lng] = cleanedCoords[i];
      const nodeId = `node_${sanitizeId(route.id)}_${i}`;

      const node: GraphNode = {
        id: nodeId,
        lat,
        lng,
        routeIds: [route.id],
        isHub: false,
        stopSequence: i,
      };

      nodes.set(nodeId, node);
      routeNodeList.push(node);
    }

    // 2b. Connect closest route stop to each hub within HUB_SNAP_DISTANCE_KM
    for (const hubNode of hubNodes) {
      let closestNode: GraphNode | null = null;
      let minDistance = Infinity;

      for (const node of routeNodeList) {
        const d = haversineKm(node.lat, node.lng, hubNode.lat, hubNode.lng);
        if (d <= HUB_SNAP_DISTANCE_KM && d < minDistance) {
          minDistance = d;
          closestNode = node;
        }
      }

      if (closestNode) {
        closestNode.isHub = true;
        closestNode.hubName = hubNode.hubName;
        if (!hubNode.routeIds.includes(route.id)) {
          hubNode.routeIds.push(route.id);
        }

        // Bridge connector between route stop and central hub
        addEdge({
          fromNode: hubNode.id,
          toNode: closestNode.id,
          weight: 0.001,
          type: 'walk',
          distanceKm: 0,
        });
        addEdge({
          fromNode: closestNode.id,
          toNode: hubNode.id,
          weight: 0.001,
          type: 'walk',
          distanceKm: 0,
        });
      }
    }

    // Connect sequential nodes on the same route with 'ride' edges
    // Base ride cost: weight = distanceKm * 1.0
    for (let i = 0; i < routeNodeList.length - 1; i++) {
      const u = routeNodeList[i];
      const v = routeNodeList[i + 1];
      const dist = Math.max(0.01, haversineKm(u.lat, u.lng, v.lat, v.lng));
      const rideWeight = dist * 1.0;

      // Forward ride edge
      addEdge({
        fromNode: u.id,
        toNode: v.id,
        weight: rideWeight,
        type: 'ride',
        routeId: route.id,
        routeName: route.route_name,
        distanceKm: dist,
      });

      // Backward ride edge (supports two-way travel along the route corridor)
      addEdge({
        fromNode: v.id,
        toNode: u.id,
        weight: rideWeight,
        type: 'ride',
        routeId: route.id,
        routeName: route.route_name,
        distanceKm: dist,
      });
    }
  }

  // 3. Spatial cross-check for Transfer Edges (Haversine <= 0.15km)
  // Weight = (distanceKm * 15) + 3 (Heavy walk penalty + flat transfer hassle penalty)
  const TRANSFER_MAX_KM = 0.15;
  const CELL_SIZE_DEG = 0.002; // ~220m per grid cell for fast spatial queries

  const grid = new Map<string, GraphNode[]>();
  const getCellKey = (lat: number, lng: number) =>
    `${Math.floor(lat / CELL_SIZE_DEG)}:${Math.floor(lng / CELL_SIZE_DEG)}`;

  // Populate spatial grid with all route nodes (excluding pure hub containers)
  for (const node of nodes.values()) {
    if (node.id.startsWith('hub_')) continue;
    const key = getCellKey(node.lat, node.lng);
    let cellNodes = grid.get(key);
    if (!cellNodes) {
      cellNodes = [];
      grid.set(key, cellNodes);
    }
    cellNodes.push(node);
  }

  const processedTransferPairs = new Set<string>();

  for (const u of nodes.values()) {
    if (u.id.startsWith('hub_')) continue;
    const uCellLat = Math.floor(u.lat / CELL_SIZE_DEG);
    const uCellLng = Math.floor(u.lng / CELL_SIZE_DEG);

    // Search in current cell and adjacent 8 cells
    for (let dLat = -1; dLat <= 1; dLat++) {
      for (let dLng = -1; dLng <= 1; dLng++) {
        const neighborKey = `${uCellLat + dLat}:${uCellLng + dLng}`;
        const candidates = grid.get(neighborKey);
        if (!candidates) continue;

        for (const v of candidates) {
          if (u.id === v.id) continue;

          // Check if they are on different routes
          const shareAnyRoute = u.routeIds.some((rId) => v.routeIds.includes(rId));
          if (shareAnyRoute) continue;

          const pairKey = u.id < v.id ? `${u.id}:${v.id}` : `${v.id}:${u.id}`;
          if (processedTransferPairs.has(pairKey)) continue;

          const dist = haversineKm(u.lat, u.lng, v.lat, v.lng);
          if (dist <= TRANSFER_MAX_KM) {
            processedTransferPairs.add(pairKey);
            const transferWeight = dist * 15.0 + 1.5;

            addEdge({
              fromNode: u.id,
              toNode: v.id,
              weight: transferWeight,
              type: 'transfer',
              distanceKm: dist,
            });

            addEdge({
              fromNode: v.id,
              toNode: u.id,
              weight: transferWeight,
              type: 'transfer',
              distanceKm: dist,
            });
          }
        }
      }
    }
  }

  return { nodes, adjacency };
}
