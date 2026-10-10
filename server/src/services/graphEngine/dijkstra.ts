import type {
  TransitGraph,
  GraphNode,
  GraphEdge,
  CompressedStep,
} from './types.js';
import { haversineKm } from './builder.js';

class MinPriorityQueue<T> {
  private heap: { priority: number; item: T }[] = [];

  push(item: T, priority: number): void {
    this.heap.push({ priority, item });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { item: T; priority: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  size(): number {
    return this.heap.length;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.heap[index].priority < this.heap[parentIdx].priority) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[parentIdx];
        this.heap[parentIdx] = temp;
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest !== index) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = temp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * Standard priority-queue Dijkstra algorithm.
 * Returns the lowest-weight sequence of GraphEdges from startNodeId to endNodeId.
 */
export function findOptimalPath(
  graph: TransitGraph,
  startNodeId: string,
  endNodeId: string,
): GraphEdge[] | null {
  if (!graph.nodes.has(startNodeId) || !graph.nodes.has(endNodeId)) {
    return null;
  }
  if (startNodeId === endNodeId) {
    return [];
  }

  const distances = new Map<string, number>();
  const prevEdge = new Map<string, GraphEdge>();
  const pq = new MinPriorityQueue<string>();

  distances.set(startNodeId, 0);
  pq.push(startNodeId, 0);

  while (pq.size() > 0) {
    const popped = pq.pop();
    if (!popped) break;
    const { item: u, priority: d } = popped;

    if (d > (distances.get(u) ?? Infinity)) {
      continue;
    }

    if (u === endNodeId) {
      break;
    }

    const neighbors = graph.adjacency.get(u) ?? [];
    for (const edge of neighbors) {
      const v = edge.toNode;
      const newDist = d + edge.weight;
      const currentDist = distances.get(v) ?? Infinity;

      if (newDist < currentDist) {
        distances.set(v, newDist);
        prevEdge.set(v, edge);
        pq.push(v, newDist);
      }
    }
  }

  if (!distances.has(endNodeId)) {
    return null;
  }

  const path: GraphEdge[] = [];
  let curr = endNodeId;
  while (curr !== startNodeId) {
    const edge = prevEdge.get(curr);
    if (!edge) {
      return null;
    }
    path.push(edge);
    curr = edge.fromNode;
  }

  path.reverse();
  return path;
}

/**
 * Merges raw sequential ride edges on the same route into a consolidated step.
 * Returns clean steps: [ { action: 'board', route: 'Balagtas', distanceKm: 2.1 }, ... ]
 */
export function compressPath(edges: GraphEdge[]): CompressedStep[] {
  const steps: CompressedStep[] = [];
  if (!edges || edges.length === 0) return steps;

  for (const edge of edges) {
    // Skip zero-length internal bridge connectors between hub containers
    if (edge.distanceKm < 0.001 && edge.type === 'walk') {
      continue;
    }

    const last = steps[steps.length - 1];

    if (edge.type === 'ride') {
      if (last && last.action === 'board' && last.routeId === edge.routeId) {
        last.distanceKm = Number((last.distanceKm + edge.distanceKm).toFixed(2));
        last.toNode = edge.toNode;
      } else {
        steps.push({
          action: 'board',
          route: edge.routeName ?? edge.routeId ?? 'Jeepney',
          routeId: edge.routeId,
          distanceKm: Number(edge.distanceKm.toFixed(2)),
          fromNode: edge.fromNode,
          toNode: edge.toNode,
        });
      }
    } else if (edge.type === 'transfer') {
      if (last && last.action === 'transfer_walk') {
        last.distanceKm = Number((last.distanceKm + edge.distanceKm).toFixed(2));
        last.toNode = edge.toNode;
      } else {
        steps.push({
          action: 'transfer_walk',
          distanceKm: Number(edge.distanceKm.toFixed(2)),
          fromNode: edge.fromNode,
          toNode: edge.toNode,
        });
      }
    } else if (edge.type === 'walk') {
      if (last && last.action === 'walk') {
        last.distanceKm = Number((last.distanceKm + edge.distanceKm).toFixed(2));
        last.toNode = edge.toNode;
      } else {
        steps.push({
          action: 'walk',
          distanceKm: Number(edge.distanceKm.toFixed(2)),
          fromNode: edge.fromNode,
          toNode: edge.toNode,
        });
      }
    }
  }

  for (const step of steps) {
    if (step.action === 'walk') {
      step.estimatedMinutes = Math.max(1, Math.round(step.distanceKm * 15));
    } else if (step.action === 'transfer_walk') {
      step.estimatedMinutes = Math.max(3, Math.round(step.distanceKm * 15) + 3);
    } else if (step.action === 'board') {
      step.estimatedMinutes = Math.max(2, Math.round((step.distanceKm / 18) * 60) + 2);
    }
  }

  return steps;
}

export interface GraphTripResult {
  steps: CompressedStep[];
  rawEdges: GraphEdge[];
  totalDistanceKm: number;
  totalWeight: number;
  originWalkKm: number;
  destWalkKm: number;
}

/**
 * Connects origin and destination to the TransitGraph with heavily penalized
 * access walks (distanceKm * 15), finds the lowest-weight path via Dijkstra,
 * and returns the compressed step sequence.
 */
export function routeTripGraph(
  graph: TransitGraph,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  options: { maxAccessKm?: number } = {},
): GraphTripResult | null {
  const maxAccessKm = options.maxAccessKm ?? 3.5;

  const originCandidates: { node: GraphNode; dist: number }[] = [];
  const destCandidates: { node: GraphNode; dist: number }[] = [];

  for (const node of graph.nodes.values()) {
    const oDist = haversineKm(origin.lat, origin.lng, node.lat, node.lng);
    if (oDist <= maxAccessKm) {
      originCandidates.push({ node, dist: oDist });
    }
    const dDist = haversineKm(destination.lat, destination.lng, node.lat, node.lng);
    if (dDist <= maxAccessKm) {
      destCandidates.push({ node, dist: dDist });
    }
  }

  if (originCandidates.length === 0 || destCandidates.length === 0) {
    return null;
  }

  originCandidates.sort((a, b) => a.dist - b.dist);
  destCandidates.sort((a, b) => a.dist - b.dist);

  const selectDiverse = (candidates: { node: GraphNode; dist: number }[], limit = 50) => {
    const selected: { node: GraphNode; dist: number }[] = [];
    const seen = new Set<string>();
    const routeCounts = new Map<string, number>();

    for (const c of candidates) {
      if (c.node.isHub) {
        if (!seen.has(c.node.id)) {
          selected.push(c);
          seen.add(c.node.id);
        }
      } else {
        const routes = c.node.routeIds;
        const canAdd = routes.some((r) => (routeCounts.get(r) ?? 0) < 5);
        if (canAdd && !seen.has(c.node.id)) {
          selected.push(c);
          seen.add(c.node.id);
          for (const r of routes) {
            routeCounts.set(r, (routeCounts.get(r) ?? 0) + 1);
          }
        }
      }
    }

    for (const c of candidates) {
      if (selected.length >= limit) break;
      if (!seen.has(c.node.id)) {
        selected.push(c);
        seen.add(c.node.id);
      }
    }
    return selected;
  };

  const topOrigin = selectDiverse(originCandidates, 50);
  const topDest = selectDiverse(destCandidates, 50);

  const tempOriginId = 'temp_origin';
  const tempDestId = 'temp_destination';

  graph.nodes.set(tempOriginId, {
    id: tempOriginId,
    lat: origin.lat,
    lng: origin.lng,
    routeIds: [],
    isHub: false,
  });

  graph.nodes.set(tempDestId, {
    id: tempDestId,
    lat: destination.lat,
    lng: destination.lng,
    routeIds: [],
    isHub: false,
  });

  // Access Walk (origin to first node): heavily penalized (dist * 15)
  const originEdges: GraphEdge[] = topOrigin.map(({ node, dist }) => ({
    fromNode: tempOriginId,
    toNode: node.id,
    weight: dist * 15.0,
    type: 'walk',
    distanceKm: dist,
  }));
  graph.adjacency.set(tempOriginId, originEdges);

  // Egress Walk (last node to destination): heavily penalized (dist * 15)
  const destInjectedEdges: { fromNode: string; edge: GraphEdge }[] = [];
  for (const { node, dist } of topDest) {
    const edge: GraphEdge = {
      fromNode: node.id,
      toNode: tempDestId,
      weight: dist * 15.0,
      type: 'walk',
      distanceKm: dist,
    };
    let list = graph.adjacency.get(node.id);
    if (!list) {
      list = [];
      graph.adjacency.set(node.id, list);
    }
    list.push(edge);
    destInjectedEdges.push({ fromNode: node.id, edge });
  }

  const rawEdges = findOptimalPath(graph, tempOriginId, tempDestId);

  // Clean up temporary nodes and edges
  graph.nodes.delete(tempOriginId);
  graph.nodes.delete(tempDestId);
  graph.adjacency.delete(tempOriginId);
  for (const { fromNode, edge } of destInjectedEdges) {
    const list = graph.adjacency.get(fromNode);
    if (list) {
      const idx = list.indexOf(edge);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  if (!rawEdges || rawEdges.length === 0) {
    return null;
  }

  const originWalkKm = rawEdges[0]?.fromNode === tempOriginId ? rawEdges[0].distanceKm : 0;
  const lastEdge = rawEdges[rawEdges.length - 1];
  const destWalkKm = lastEdge?.toNode === tempDestId ? lastEdge.distanceKm : 0;

  const totalDistanceKm = Number(rawEdges.reduce((sum, e) => sum + e.distanceKm, 0).toFixed(2));
  const totalWeight = Number(rawEdges.reduce((sum, e) => sum + e.weight, 0).toFixed(2));
  const compressed = compressPath(rawEdges);

  return {
    steps: compressed,
    rawEdges,
    totalDistanceKm,
    totalWeight,
    originWalkKm,
    destWalkKm,
  };
}
