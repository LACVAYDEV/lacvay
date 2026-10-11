import type { Database } from '../../types/database.types.js';

export type TransitRouteRow = Database['public']['Tables']['transit_routes']['Row'];

export interface HubPoint {
  id?: string;
  label: string;
  name?: string;
  lat: number;
  lng: number;
}

export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  routeIds: string[];
  isHub: boolean;
  hubName?: string;
  stopSequence?: number;
}

export interface GraphEdge {
  fromNode: string;
  toNode: string;
  weight: number;
  type: 'ride' | 'walk' | 'transfer';
  routeId?: string;
  routeName?: string;
  distanceKm: number;
}

export interface TransitGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
}

export interface CompressedStep {
  action: 'board' | 'transfer_walk' | 'walk' | 'alight';
  route?: string;
  routeId?: string;
  distanceKm: number;
  fromNode?: string;
  toNode?: string;
  fareNote?: string;
  fareRegular?: number;
  fareDiscounted?: number;
  estimatedMinutes?: number;
  instruction?: string;
  pathCoords?: [number, number][];
}

