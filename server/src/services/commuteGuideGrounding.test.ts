import { describe, expect, it } from 'vitest';
import { getTransitRoutingContext } from './transitContext.js';
import { buildCommuteGuidePlan } from './commuteGuidePlan.js';

describe('Commute Guide Database Grounding', () => {
  it('generates guide plan strictly grounded in database transit graph with real polylines', async () => {
    // Test trip: Batangas Pier to Grand Terminal (known multi-mile transit corridor)
    const ctx = await getTransitRoutingContext('from Batangas Pier to Grand Terminal', {
      origin: 'Batangas Pier',
      originLat: 13.754,
      originLng: 121.043,
    });

    expect(ctx.origin).toBeDefined();
    expect(ctx.destination).toBeDefined();
    expect(ctx.graphResult).toBeDefined();
    expect(ctx.graphResult?.steps.length).toBeGreaterThan(0);

    const plan = buildCommuteGuidePlan({
      briefing: ctx.briefing,
      reply: 'Sample reply',
      routingContext: ctx,
    });

    expect(plan).not.toBeNull();
    if (!plan) return;

    // Check legs
    const jeepneyLegs = plan.legs.filter((l) => l.mode === 'jeepney');
    expect(jeepneyLegs.length).toBeGreaterThan(0);

    for (const leg of jeepneyLegs) {
      // Must have official route name from database
      expect(leg.routeName).toBeDefined();
      expect(leg.routeName).toMatch(/Batangas|Alangilan|Balagtas|Pier/i);
      // Path must be a real polyline from database, not a 2-point straight line
      expect(leg.path.length).toBeGreaterThan(2);
      // Coordinates must be strictly in Batangas City bounds
      for (const [lat, lng] of leg.path) {
        expect(lat).toBeGreaterThanOrEqual(13.58);
        expect(lat).toBeLessThanOrEqual(13.92);
        expect(lng).toBeGreaterThanOrEqual(120.98);
        expect(lng).toBeLessThanOrEqual(121.22);
      }
    }

    // Check transfer walk if present
    const transferLegs = plan.legs.filter((l) => l.title === 'Transfer Walk');
    for (const transfer of transferLegs) {
      expect(transfer.path.length).toBeGreaterThanOrEqual(2);
      const prevLeg = plan.legs[transfer.order - 2];
      const nextLeg = plan.legs[transfer.order];
      if (prevLeg && nextLeg) {
        // Transfer walk start should match previous leg alight point
        const prevEnd = prevLeg.path[prevLeg.path.length - 1];
        expect(transfer.path[0][0]).toBeCloseTo(prevEnd[0], 4);
        expect(transfer.path[0][1]).toBeCloseTo(prevEnd[1], 4);
        // Transfer walk end should match next leg boarding point
        const nextStart = nextLeg.path[0];
        expect(transfer.path[transfer.path.length - 1][0]).toBeCloseTo(nextStart[0], 4);
        expect(transfer.path[transfer.path.length - 1][1]).toBeCloseTo(nextStart[1], 4);
      }
    }
  });
});
