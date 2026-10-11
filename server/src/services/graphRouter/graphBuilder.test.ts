import { describe, it, expect } from 'vitest';
import {
  buildTransitGraph,
  haversineKm,
  samplePolylineAtInterval,
} from './graphBuilder.js';
import type { TransitRouteRow } from './types.js';

describe('haversineKm', () => {
  it('calculates distance between known points', () => {
    // Batangas Pier (~13.7538, 121.0450) to Plaza Mabini (~13.7565, 121.0583)
    const dist = haversineKm(13.7538, 121.045, 13.7565, 121.0583);
    expect(dist).toBeGreaterThan(1.3);
    expect(dist).toBeLessThan(1.6);
  });
});

describe('samplePolylineAtInterval', () => {
  it('samples coordinates at approximately 200m intervals along a straight segment', () => {
    // A 1km segment northwards: 1 degree latitude ~ 111 km, so ~0.009 deg is ~1km
    const start: [number, number] = [13.75, 121.05];
    const end: [number, number] = [13.759, 121.05]; // ~1.0 km away
    const totalDist = haversineKm(start[0], start[1], end[0], end[1]);
    expect(totalDist).toBeCloseTo(1.0, 1);

    const sampled = samplePolylineAtInterval([start, end], 0.2);
    // At 200m (0.2km) intervals for ~1.0km, we expect around 5-6 points: 0m, 200m, 400m, 600m, 800m, 1000m
    expect(sampled.length).toBeGreaterThanOrEqual(5);

    // Each consecutive pair should be approx 200m apart
    for (let i = 0; i < sampled.length - 1; i++) {
      const stepDist = haversineKm(sampled[i][0], sampled[i][1], sampled[i + 1][0], sampled[i + 1][1]);
      expect(stepDist).toBeCloseTo(0.2, 1);
    }
  });
});

describe('buildTransitGraph', () => {
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
        [121.05, 13.75], // start (node 0)
        [121.05, 13.7545], // ~500m north
        [121.05, 13.759], // ~1km north
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
        [121.0504, 13.7536], // ~43m east of route_1's 400m stop (well within 100m)
        [121.055, 13.7536],
        [121.06, 13.7536],
      ],
    },
  };

  it('builds nodes for routes at 200m intervals', () => {
    const graph = buildTransitGraph([mockRoute1]);

    expect(graph.nodes.size).toBeGreaterThan(4);
    for (const [id, node] of graph.nodes.entries()) {
      expect(node.id).toBe(id);
      expect(node.routeId).toBe('route_1');
      expect(node.routeName).toBe('Balagtas - Batangas City');
      expect(typeof node.lat).toBe('number');
      expect(typeof node.lng).toBe('number');
    }
  });

  it('connects sequential stops on the same route with ride edges', () => {
    const graph = buildTransitGraph([mockRoute1]);

    let rideEdgeCount = 0;
    for (const edges of graph.adjacency.values()) {
      for (const edge of edges) {
        if (edge.type === 'ride') {
          rideEdgeCount++;
          expect(edge.cost).toBe(edge.distanceKm);
          expect(edge.distanceKm).toBeGreaterThan(0);
          expect(edge.routeId).toBe('route_1');
        }
      }
    }

    // Number of sequential ride edges should be nodes.size - 1
    expect(rideEdgeCount).toBe(graph.nodes.size - 1);
  });

  it('connects nodes from different routes within 100m with transfer edges', () => {
    const graph = buildTransitGraph([mockRoute1, mockRoute2]);

    const transferEdges: Array<{ from: string; to: string; dist: number }> = [];

    for (const [nodeId, edges] of graph.adjacency.entries()) {
      for (const edge of edges) {
        if (edge.type === 'transfer') {
          const fromNode = graph.nodes.get(edge.fromNodeId)!;
          const toNode = graph.nodes.get(edge.toNodeId)!;

          // Must be from DIFFERENT routes
          expect(fromNode.routeId).not.toBe(toNode.routeId);
          // Must be within 100m (0.1km)
          expect(edge.distanceKm).toBeLessThanOrEqual(0.1);

          transferEdges.push({
            from: edge.fromNodeId,
            to: edge.toNodeId,
            dist: edge.distanceKm,
          });
        }
      }
    }

    // There should be transfer edges between route_1 and route_2 where they are ~45m apart
    expect(transferEdges.length).toBeGreaterThanOrEqual(2); // At least 1 in each direction
  });

  it('does not create transfer edges for nodes on the same route', () => {
    const graph = buildTransitGraph([mockRoute1]);

    for (const edges of graph.adjacency.values()) {
      for (const edge of edges) {
        expect(edge.type).not.toBe('transfer');
      }
    }
  });
});
