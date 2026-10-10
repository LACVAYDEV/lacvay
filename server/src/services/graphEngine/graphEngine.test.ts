import { describe, it, expect } from 'vitest';
import { buildTransitGraph } from './builder.js';
import { findOptimalPath, compressPath, routeTripGraph } from './dijkstra.js';
import type { TransitRouteRow, HubPoint, GraphEdge } from './types.js';

describe('Graph Engine: Builder & Dijkstra', () => {
  const dummyHubs: HubPoint[] = [
    { label: 'Grand Terminal', lat: 13.78, lng: 121.05 },
    { label: 'SM City Batangas', lat: 13.76, lng: 121.07 },
  ];

  const dummyRoutes: TransitRouteRow[] = [
    {
      id: 'route-balagtas',
      route_name: 'Balagtas - Batangas',
      vehicle_type: 'jeepney',
      color_code: '#FF0000',
      created_at: new Date().toISOString(),
      discounted_fare: 12,
      extended_discounted_fare: 15,
      extended_fare: 20,
      regular_fare: 15,
      geojson_path: {
        type: 'LineString',
        coordinates: [
          [121.050, 13.780], // At Grand Terminal
          [121.055, 13.775],
          [121.060, 13.770], // Transfer area with Route 2
        ],
      },
    },
    {
      id: 'route-libjo',
      route_name: 'Libjo - Batangas',
      vehicle_type: 'jeepney',
      color_code: '#0000FF',
      created_at: new Date().toISOString(),
      discounted_fare: 12,
      extended_discounted_fare: 15,
      extended_fare: 20,
      regular_fare: 15,
      geojson_path: {
        type: 'LineString',
        coordinates: [
          [121.0605, 13.7705], // ~70m from route-balagtas transfer point
          [121.065, 13.765],
          [121.070, 13.760], // At SM City Batangas
        ],
      },
    },
  ];

  it('builds graph with ride edges, transfer edges, and hub injection', () => {
    const graph = buildTransitGraph(dummyRoutes, dummyHubs);

    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.nodes.has('hub_grand_terminal')).toBe(true);
    expect(graph.nodes.has('hub_sm_city_batangas')).toBe(true);

    const edges = Array.from(graph.adjacency.values()).flat();
    const rideEdges = edges.filter((e) => e.type === 'ride');
    const transferEdges = edges.filter((e) => e.type === 'transfer');

    expect(rideEdges.length).toBeGreaterThan(0);
    expect(transferEdges.length).toBeGreaterThan(0);
  });

  it('finds path and compresses sequential rides on same route', () => {
    const graph = buildTransitGraph(dummyRoutes, dummyHubs);
    const startNode = 'hub_grand_terminal';
    const endNode = 'hub_sm_city_batangas';

    const path = findOptimalPath(graph, startNode, endNode);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);

    const compressed = compressPath(path!);
    expect(compressed.length).toBeGreaterThan(0);

    // Should contain a board for Balagtas and a board for Libjo
    const routeNames = compressed.filter((c) => c.action === 'board').map((c) => c.route);
    expect(routeNames).toContain('Balagtas - Batangas');
    expect(routeNames).toContain('Libjo - Batangas');
  });

  it('compressPath merges continuous ride edges into a single step', () => {
    const mockEdges: GraphEdge[] = [
      { fromNode: 'n1', toNode: 'n2', weight: 1.0, type: 'ride', routeId: 'r1', routeName: 'Balagtas', distanceKm: 1.0 },
      { fromNode: 'n2', toNode: 'n3', weight: 1.1, type: 'ride', routeId: 'r1', routeName: 'Balagtas', distanceKm: 1.1 },
      { fromNode: 'n3', toNode: 'n4', weight: 3.75, type: 'transfer', distanceKm: 0.05 },
      { fromNode: 'n4', toNode: 'n5', weight: 1.5, type: 'ride', routeId: 'r2', routeName: 'Libjo', distanceKm: 1.5 },
    ];

    const compressed = compressPath(mockEdges);
    expect(compressed).toEqual([
      { action: 'board', route: 'Balagtas', routeId: 'r1', distanceKm: 2.1, fromNode: 'n1', toNode: 'n3' },
      { action: 'transfer_walk', distanceKm: 0.05, fromNode: 'n3', toNode: 'n4' },
      { action: 'board', route: 'Libjo', routeId: 'r2', distanceKm: 1.5, fromNode: 'n4', toNode: 'n5' },
    ]);
  });

  it('routes trip from origin coordinates to destination coordinates', () => {
    const graph = buildTransitGraph(dummyRoutes, dummyHubs);
    const result = routeTripGraph(
      graph,
      { lat: 13.7801, lng: 121.0501 }, // Near Grand Terminal
      { lat: 13.7599, lng: 121.0701 }, // Near SM
    );

    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThan(0);
    expect(result!.totalDistanceKm).toBeGreaterThan(0);
  });
});
