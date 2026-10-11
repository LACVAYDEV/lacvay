import { describe, it, expect } from 'vitest';
import {
  calculateEdgeCost,
  findShortestPath,
  routeTrip,
  findClosestNode,
} from './pathfinder.js';
import { buildTransitGraph } from './graphBuilder.js';
import type { Graph, TransitEdge, TransitNode, TransitRouteRow } from './types.js';

describe('calculateEdgeCost', () => {
  it('strictly computes cost based on edge type', () => {
    const rideEdge: TransitEdge = {
      fromNodeId: 'n1',
      toNodeId: 'n2',
      distanceKm: 0.5,
      cost: 0.5,
      type: 'ride',
    };
    expect(calculateEdgeCost(rideEdge)).toBe(0.5); // 0.5 * 1.0

    const walkEdge: TransitEdge = {
      fromNodeId: 'n1',
      toNodeId: 'n2',
      distanceKm: 0.5,
      cost: 0.5,
      type: 'walk',
    };
    expect(calculateEdgeCost(walkEdge)).toBe(5.0); // 0.5 * 10.0

    const transferEdge: TransitEdge = {
      fromNodeId: 'n1',
      toNodeId: 'n2',
      distanceKm: 0.05,
      cost: 0.05,
      type: 'transfer',
    };
    expect(calculateEdgeCost(transferEdge)).toBe(2.05); // 0.05 + 2.0 flat penalty
  });
});

describe('findShortestPath', () => {
  it('finds direct route path between two nodes on the same route', () => {
    const mockRoute: TransitRouteRow = {
      id: 'route_1',
      route_name: 'Balagtas - Batangas City',
      vehicle_type: 'jeepney',
      color_code: '#FFCC00',
      created_at: null,
      discounted_fare: 11,
      extended_discounted_fare: null,
      extended_fare: null,
      regular_fare: 13,
      route_code: 'BAL-BAT',
      geojson_path: {
        type: 'LineString',
        coordinates: [
          [121.05, 13.75],
          [121.05, 13.7536],
          [121.05, 13.7572],
        ],
      },
    };

    const graph = buildTransitGraph([mockRoute]);
    const startNodeId = 'route_1_node_0';
    const endNodeId = 'route_1_node_2';

    const path = findShortestPath(graph, startNodeId, endNodeId);
    expect(path).not.toBeNull();
    expect(path!.nodes.length).toBe(3);
    expect(path!.edges.length).toBe(2);
    expect(path!.edges.every((e) => e.type === 'ride')).toBe(true);
    expect(path!.totalCost).toBe(path!.totalDistanceKm);
  });

  it('prefers staying on a direct route over an unnecessary transfer due to the +2.0 transfer penalty', () => {
    // Route 1 goes from Node A -> B -> C -> D (total distance 3.0km, cost 3.0)
    // Route 2 intersects at B and goes to D via a transfer (distance 2.0km, but transfer adds 2.0 penalty -> cost 4.0)
    const nodes = new Map<string, TransitNode>([
      ['r1_a', { id: 'r1_a', lat: 13.75, lng: 121.05, routeId: 'r1', routeName: 'Route 1' }],
      ['r1_b', { id: 'r1_b', lat: 13.76, lng: 121.05, routeId: 'r1', routeName: 'Route 1' }],
      ['r1_c', { id: 'r1_c', lat: 13.77, lng: 121.05, routeId: 'r1', routeName: 'Route 1' }],
      ['r1_d', { id: 'r1_d', lat: 13.78, lng: 121.05, routeId: 'r1', routeName: 'Route 1' }],
      ['r2_b', { id: 'r2_b', lat: 13.7601, lng: 121.05, routeId: 'r2', routeName: 'Route 2' }],
      ['r2_d', { id: 'r2_d', lat: 13.78, lng: 121.05, routeId: 'r2', routeName: 'Route 2' }],
    ]);

    const adjacency = new Map<string, TransitEdge[]>([
      // Route 1 direct sequence
      ['r1_a', [{ fromNodeId: 'r1_a', toNodeId: 'r1_b', distanceKm: 1.0, cost: 1.0, type: 'ride', routeId: 'r1', routeName: 'Route 1' }]],
      ['r1_b', [
        { fromNodeId: 'r1_b', toNodeId: 'r1_c', distanceKm: 1.0, cost: 1.0, type: 'ride', routeId: 'r1', routeName: 'Route 1' },
        // Transfer to Route 2
        { fromNodeId: 'r1_b', toNodeId: 'r2_b', distanceKm: 0.02, cost: 0.02, type: 'transfer' },
      ]],
      ['r1_c', [{ fromNodeId: 'r1_c', toNodeId: 'r1_d', distanceKm: 1.0, cost: 1.0, type: 'ride', routeId: 'r1', routeName: 'Route 1' }]],
      ['r1_d', []],
      // Route 2 ride to D
      ['r2_b', [{ fromNodeId: 'r2_b', toNodeId: 'r2_d', distanceKm: 1.0, cost: 1.0, type: 'ride', routeId: 'r2', routeName: 'Route 2' }]],
      ['r2_d', []],
    ]);

    const graph: Graph = { nodes, adjacency, edges: adjacency };

    // Trip from r1_a to r1_d
    const path = findShortestPath(graph, 'r1_a', 'r1_d');
    expect(path).not.toBeNull();
    // Direct path on Route 1 costs 3.0
    // Transfer path costs 1.0 + (0.02 + 2.0) + 1.0 = 4.02 > 3.0
    // So Dijkstra chooses the direct path!
    expect(path!.edges.every((e) => e.type === 'ride')).toBe(true);
    expect(path!.nodes.map((n) => n.id)).toEqual(['r1_a', 'r1_b', 'r1_c', 'r1_d']);
  });

  it('finds path with transfer when destination is only reachable on route 2', () => {
    const nodes = new Map<string, TransitNode>([
      ['r1_0', { id: 'r1_0', lat: 13.75, lng: 121.05, routeId: 'r1', routeName: 'Route 1' }],
      ['r1_1', { id: 'r1_1', lat: 13.76, lng: 121.05, routeId: 'r1', routeName: 'Route 1' }],
      ['r2_0', { id: 'r2_0', lat: 13.7602, lng: 121.05, routeId: 'r2', routeName: 'Route 2' }],
      ['r2_1', { id: 'r2_1', lat: 13.77, lng: 121.06, routeId: 'r2', routeName: 'Route 2' }],
    ]);

    const adjacency = new Map<string, TransitEdge[]>([
      ['r1_0', [{ fromNodeId: 'r1_0', toNodeId: 'r1_1', distanceKm: 1.0, cost: 1.0, type: 'ride' }]],
      ['r1_1', [{ fromNodeId: 'r1_1', toNodeId: 'r2_0', distanceKm: 0.02, cost: 0.02, type: 'transfer' }]],
      ['r2_0', [{ fromNodeId: 'r2_0', toNodeId: 'r2_1', distanceKm: 1.2, cost: 1.2, type: 'ride' }]],
      ['r2_1', []],
    ]);

    const graph: Graph = { nodes, adjacency, edges: adjacency };
    const path = findShortestPath(graph, 'r1_0', 'r2_1');

    expect(path).not.toBeNull();
    expect(path!.edges.some((e) => e.type === 'transfer')).toBe(true);
    expect(path!.nodes.map((n) => n.id)).toEqual(['r1_0', 'r1_1', 'r2_0', 'r2_1']);
  });

  it('returns null if no path exists', () => {
    const nodes = new Map<string, TransitNode>([
      ['r1_0', { id: 'r1_0', lat: 13.75, lng: 121.05, routeId: 'r1', routeName: 'Route 1' }],
      ['r2_0', { id: 'r2_0', lat: 13.80, lng: 121.10, routeId: 'r2', routeName: 'Route 2' }],
    ]);
    const adjacency = new Map<string, TransitEdge[]>([
      ['r1_0', []],
      ['r2_0', []],
    ]);
    const graph: Graph = { nodes, adjacency, edges: adjacency };

    const path = findShortestPath(graph, 'r1_0', 'r2_0');
    expect(path).toBeNull();
  });
});

describe('routeTrip', () => {
  const mockRoute1: TransitRouteRow = {
    id: 'route_1',
    route_name: 'Balagtas - Batangas City',
    vehicle_type: 'jeepney',
    color_code: '#FFCC00',
    created_at: null,
    discounted_fare: 11,
    extended_discounted_fare: null,
    extended_fare: null,
    regular_fare: 13,
    route_code: 'BAL-BAT',
    geojson_path: {
      type: 'LineString',
      coordinates: [
        [121.05, 13.75],
        [121.05, 13.7536],
        [121.05, 13.7572],
      ],
    },
  };

  const mockRoute2: TransitRouteRow = {
    id: 'route_2',
    route_name: 'Alangilan - Capitolio',
    vehicle_type: 'jeepney',
    color_code: '#00CCFF',
    created_at: null,
    discounted_fare: 11,
    extended_discounted_fare: null,
    extended_fare: null,
    regular_fare: 13,
    route_code: 'ALA-CAP',
    geojson_path: {
      type: 'LineString',
      coordinates: [
        [121.0503, 13.7536], // ~32m east of route_1's middle node (transfer within 100m)
        [121.055, 13.7536],
        [121.06, 13.7536],
      ],
    },
  };

  it('rejects origin that is >= 800m away from any transit node', () => {
    const graph = buildTransitGraph([mockRoute1]);

    // 13.73, 121.05 is ~2.2 km south of mockRoute1 start (13.75, 121.05)
    const farOrigin = { lat: 13.73, lng: 121.05 };
    const dest = { lat: 13.757, lng: 121.05 };

    const plan = routeTrip(farOrigin, dest, graph);
    expect(plan).toBeNull();
  });

  it('routes direct trip when origin is within 800m', () => {
    const graph = buildTransitGraph([mockRoute1]);

    // Origin is ~150m from start node (13.75, 121.05)
    const origin = { lat: 13.751, lng: 121.05 };
    // Dest is ~100m from end node (13.7572, 121.05)
    const dest = { lat: 13.758, lng: 121.05 };

    const plan = routeTrip(origin, dest, graph);
    expect(plan).not.toBeNull();
    expect(Array.isArray(plan)).toBe(true);

    // Should have:
    // 1. Initial walk to start stop
    // 2. Ride on Balagtas - Batangas City
    // 3. Final walk to destination
    expect(plan!.length).toBe(3);
    expect(plan![0].type).toBe('walk');
    expect(plan![1].type).toBe('ride');
    expect(plan![1].routeName).toBe('Balagtas - Batangas City');
    expect(plan![2].type).toBe('walk');
  });

  it('routes multi-leg trip with transfer points when traveling between different routes', () => {
    const graph = buildTransitGraph([mockRoute1, mockRoute2]);

    // Origin near route 1 start (13.7505, 121.05)
    const origin = { lat: 13.7505, lng: 121.05 };
    // Destination near route 2 end (13.7536, 121.0595)
    const dest = { lat: 13.7536, lng: 121.0595 };

    const plan = routeTrip(origin, dest, graph);
    expect(plan).not.toBeNull();

    // Verify presence of transfer step
    const transferStep = plan!.find((s) => s.type === 'transfer');
    expect(transferStep).toBeDefined();
    expect(transferStep?.fromRouteName).toBe('Balagtas - Batangas City');
    expect(transferStep?.toRouteName).toBe('Alangilan - Capitolio');
    expect(transferStep?.distanceKm).toBeLessThanOrEqual(0.1);

    // Verify ride steps have correct route names
    const rideSteps = plan!.filter((s) => s.type === 'ride');
    expect(rideSteps.length).toBe(2);
    expect(rideSteps[0].routeName).toBe('Balagtas - Batangas City');
    expect(rideSteps[1].routeName).toBe('Alangilan - Capitolio');
  });
});
