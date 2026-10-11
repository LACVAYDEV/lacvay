import type { Graph, TransitNode, TransitEdge } from './types.js';
import { haversineKm } from './graphBuilder.js';

/** Maximum walking access distance from origin to the first transit stop in km (800m) */
export const MAX_ORIGIN_ACCESS_DISTANCE_KM = 0.8;

export type CoordinateInput = { lat: number; lng: number } | [number, number];

export interface PathResult {
  nodes: TransitNode[];
  edges: TransitEdge[];
  totalDistanceKm: number;
  totalCost: number;
}

export interface RouteStep {
  type: 'walk' | 'ride' | 'transfer';
  instruction: string;
  distanceKm: number;
  routeName?: string;
  fromNodeId?: string;
  toNodeId?: string;
  fromRouteName?: string;
  toRouteName?: string;
  fromStopName?: string;
  toStopName?: string;
  stopCount?: number;
}

export interface RouteTripPlan extends Array<RouteStep> {
  steps: RouteStep[];
  totalDistanceKm: number;
  totalCost: number;
  originWalkKm: number;
  destWalkKm: number;
  startNode: TransitNode;
  endNode: TransitNode;
}

/**
 * Calculates the strict edge traversal cost:
 * - Base cost = distanceKm
 * - If type === 'ride', multiply by 1.0
 * - If type === 'walk', multiply by 10.0 (heavily penalizes walking)
 * - If type === 'transfer', add a flat penalty of 2.0 (prevents unnecessary swapping of jeeps)
 */
export function calculateEdgeCost(edge: TransitEdge): number {
  const baseCost = edge.distanceKm;
  if (edge.type === 'ride') {
    return baseCost * 1.0;
  }
  if (edge.type === 'walk') {
    return baseCost * 10.0;
  }
  if (edge.type === 'transfer') {
    return baseCost + 2.0;
  }
  return baseCost;
}

/**
 * Min Priority Queue implemented as a binary min-heap.
 */
class MinPriorityQueue<T> {
  private heap: { item: T; priority: number }[] = [];

  push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].item;
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.heap[idx].priority < this.heap[parentIdx].priority) {
        const temp = this.heap[idx];
        this.heap[idx] = this.heap[parentIdx];
        this.heap[parentIdx] = temp;
        idx = parentIdx;
      } else {
        break;
      }
    }
  }

  private bubbleDown(idx: number): void {
    const length = this.heap.length;
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let smallest = idx;

      if (leftIdx < length && this.heap[leftIdx].priority < this.heap[smallest].priority) {
        smallest = leftIdx;
      }
      if (rightIdx < length && this.heap[rightIdx].priority < this.heap[smallest].priority) {
        smallest = rightIdx;
      }
      if (smallest !== idx) {
        const temp = this.heap[idx];
        this.heap[idx] = this.heap[smallest];
        this.heap[smallest] = temp;
        idx = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Normalizes coordinate inputs into a standard { lat, lng } object.
 */
function normalizeCoord(coord: CoordinateInput): { lat: number; lng: number } {
  if (Array.isArray(coord)) {
    return { lat: coord[0], lng: coord[1] };
  }
  return coord;
}

/**
 * Finds the closest TransitNode in the graph to the specified coordinates.
 */
export function findClosestNode(
  coord: CoordinateInput,
  graph: Graph,
): { node: TransitNode; distanceKm: number } | null {
  const { lat, lng } = normalizeCoord(coord);
  let closest: TransitNode | null = null;
  let minDistance = Infinity;

  for (const node of graph.nodes.values()) {
    const d = haversineKm(lat, lng, node.lat, node.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = node;
    }
  }

  if (!closest) return null;
  return { node: closest, distanceKm: minDistance };
}

/**
 * Standard Dijkstra shortest path algorithm on the Transit Graph.
 * Uses the strict edge cost function to balance riding, walking, and transfers.
 */
export function findShortestPath(
  graph: Graph,
  startNodeId: string,
  endNodeId: string,
): PathResult | null {
  if (!graph.nodes.has(startNodeId) || !graph.nodes.has(endNodeId)) {
    return null;
  }

  if (startNodeId === endNodeId) {
    const startNode = graph.nodes.get(startNodeId)!;
    return {
      nodes: [startNode],
      edges: [],
      totalDistanceKm: 0,
      totalCost: 0,
    };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, { prevNodeId: string; edge: TransitEdge }>();
  const pq = new MinPriorityQueue<string>();

  distances.set(startNodeId, 0);
  pq.push(startNodeId, 0);

  while (!pq.isEmpty()) {
    const currNodeId = pq.pop()!;
    const currDist = distances.get(currNodeId)!;

    if (currNodeId === endNodeId) {
      break;
    }

    const outgoingEdges = graph.adjacency.get(currNodeId) || [];
    for (const edge of outgoingEdges) {
      const neighborId = edge.toNodeId;
      const edgeCost = calculateEdgeCost(edge);
      const newCost = currDist + edgeCost;

      const existingCost = distances.get(neighborId);
      if (existingCost === undefined || newCost < existingCost) {
        distances.set(neighborId, newCost);
        previous.set(neighborId, { prevNodeId: currNodeId, edge });
        pq.push(neighborId, newCost);
      }
    }
  }

  if (!previous.has(endNodeId)) {
    return null;
  }

  // Reconstruct path in forward order
  const pathEdges: TransitEdge[] = [];
  const pathNodes: TransitNode[] = [];
  let curr = endNodeId;

  while (curr !== startNodeId) {
    const step = previous.get(curr);
    if (!step) break;
    pathEdges.unshift(step.edge);
    pathNodes.unshift(graph.nodes.get(curr)!);
    curr = step.prevNodeId;
  }
  pathNodes.unshift(graph.nodes.get(startNodeId)!);

  const totalDistanceKm = pathEdges.reduce((sum, e) => sum + e.distanceKm, 0);
  const totalCost = pathEdges.reduce((sum, e) => sum + calculateEdgeCost(e), 0);

  return {
    nodes: pathNodes,
    edges: pathEdges,
    totalDistanceKm,
    totalCost,
  };
}

/**
 * Routes a door-to-door trip from origin to destination coordinates using the Transit Graph:
 * 1. Finds the closest TransitNode to origin (must be < 800m).
 * 2. Finds the closest TransitNode to destination.
 * 3. Runs Dijkstra findShortestPath between them.
 * 4. Returns a clean array of steps mapping route names, walk distances, and transfer points.
 */
export function routeTrip(
  originLatLng: CoordinateInput,
  destLatLng: CoordinateInput,
  graph: Graph,
  options?: { maxOriginDistanceKm?: number },
): RouteTripPlan | null {
  const origin = normalizeCoord(originLatLng);
  const dest = normalizeCoord(destLatLng);
  const maxOriginDist = options?.maxOriginDistanceKm ?? MAX_ORIGIN_ACCESS_DISTANCE_KM;

  // Step 1: Find closest node to origin (< maxOriginDist)
  const originClosest = findClosestNode(origin, graph);
  if (!originClosest || originClosest.distanceKm >= maxOriginDist) {
    return null;
  }

  // Step 2: Find closest node to destination
  const destClosest = findClosestNode(dest, graph);
  if (!destClosest) {
    return null;
  }

  // Step 3: Run findShortestPath between start and end nodes
  const path = findShortestPath(graph, originClosest.node.id, destClosest.node.id);
  if (!path) {
    return null;
  }

  // Step 4: Build a clean array of steps
  const steps: RouteStep[] = [];

  // 4a. Initial walk from origin to the boarding stop
  const originWalkDist = originClosest.distanceKm;
  steps.push({
    type: 'walk',
    instruction: `Walk ~${Math.max(10, Math.round(originWalkDist * 1000))}m to ${originClosest.node.routeName} stop`,
    distanceKm: originWalkDist,
    toNodeId: originClosest.node.id,
    toStopName: originClosest.node.routeName,
  });

  // 4b. Transit path segments (merging consecutive sequential ride edges on the same route)
  let i = 0;
  while (i < path.edges.length) {
    const edge = path.edges[i];

    if (edge.type === 'ride') {
      const fromNode = path.nodes[i];
      let rideDistance = edge.distanceKm;
      let stopCount = 1;
      let lastToNode = path.nodes[i + 1];
      const routeName = edge.routeName ?? fromNode.routeName;

      // Group consecutive ride edges on the same route
      let nextIdx = i + 1;
      while (
        nextIdx < path.edges.length &&
        path.edges[nextIdx].type === 'ride' &&
        (path.edges[nextIdx].routeName ?? path.nodes[nextIdx].routeName) === routeName
      ) {
        rideDistance += path.edges[nextIdx].distanceKm;
        stopCount++;
        lastToNode = path.nodes[nextIdx + 1];
        nextIdx++;
      }

      steps.push({
        type: 'ride',
        instruction: `Ride ${routeName} (~${rideDistance.toFixed(1)} km, ${stopCount} stops)`,
        distanceKm: rideDistance,
        routeName,
        fromNodeId: fromNode.id,
        toNodeId: lastToNode.id,
        fromStopName: fromNode.routeName,
        toStopName: lastToNode.routeName,
        stopCount,
      });

      i = nextIdx;
    } else if (edge.type === 'transfer') {
      const fromNode = path.nodes[i];
      const toNode = path.nodes[i + 1];
      const transferWalkMeters = Math.max(5, Math.round(edge.distanceKm * 1000));

      steps.push({
        type: 'transfer',
        instruction: `Transfer: Walk ~${transferWalkMeters}m from ${fromNode.routeName} to ${toNode.routeName}`,
        distanceKm: edge.distanceKm,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        fromRouteName: fromNode.routeName,
        toRouteName: toNode.routeName,
        routeName: toNode.routeName,
      });

      i++;
    } else {
      // Direct walk edge
      steps.push({
        type: 'walk',
        instruction: `Walk ~${Math.max(10, Math.round(edge.distanceKm * 1000))}m`,
        distanceKm: edge.distanceKm,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
      });

      i++;
    }
  }

  // 4c. Final walk from alight stop to the destination
  const destWalkDist = destClosest.distanceKm;
  steps.push({
    type: 'walk',
    instruction: `Walk ~${Math.max(10, Math.round(destWalkDist * 1000))}m to destination`,
    distanceKm: destWalkDist,
    fromNodeId: destClosest.node.id,
    fromStopName: destClosest.node.routeName,
  });

  const totalDistanceKm = steps.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalCost = path.totalCost + originWalkDist * 10.0 + destWalkDist * 10.0;

  // Create an array that also exposes summary properties for full compatibility
  const resultPlan = Object.assign([...steps], {
    steps,
    totalDistanceKm,
    totalCost,
    originWalkKm: originWalkDist,
    destWalkKm: destWalkDist,
    startNode: originClosest.node,
    endNode: destClosest.node,
  }) as RouteTripPlan;

  return resultPlan;
}
