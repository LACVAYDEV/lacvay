import type { Database } from '../../types/database.types.js';

export type TransitRouteRow = Database['public']['Tables']['transit_routes']['Row'];

/**
 * Represents a coordinate point on a route (id, lat, lng, routeId, routeName).
 */
export interface TransitNode {
  id: string;
  lat: number;
  lng: number;
  routeId: string;
  routeName: string;
  stopSequence?: number;
}

/**
 * Represents a connection between two nodes
 * (fromNodeId, toNodeId, distanceKm, cost, type: 'ride' | 'walk' | 'transfer').
 */
export interface TransitEdge {
  fromNodeId: string;
  toNodeId: string;
  distanceKm: number;
  cost: number;
  type: 'ride' | 'walk' | 'transfer';
  routeId?: string;
  routeName?: string;
}

/**
 * A data structure mapping Node IDs to arrays of connecting Edges.
 */
export interface Graph {
  nodes: Map<string, TransitNode>;
  adjacency: Map<string, TransitEdge[]>;
  edges: Map<string, TransitEdge[]>;
}
