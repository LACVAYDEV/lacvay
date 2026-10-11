import { describe, expect, it } from 'vitest';
import {
  resolveLocation,
  isInBatangas,
  BATANGAS_BOUNDS,
  HUB_POINTS,
  type PlacePoi,
} from './reverseGeocode.js';
import { buildTransitBriefing } from './transitContext.js';

describe('3-Step Location Rule: Step 1 (Exact GPS Priority)', () => {
  it('preserves exact GPS coordinates within Batangas City without overriding them', async () => {
    // Exact GPS at a custom coordinate in Batangas City
    const exactLat = 13.758812;
    const exactLng = 121.065534;
    const result = await resolveLocation('Near SM Batangas', {
      rawLat: exactLat,
      rawLng: exactLng,
    });

    expect(result.outOfBounds).toBe(false);
    expect(result.lat).toBe(exactLat);
    expect(result.lng).toBe(exactLng);
  });

  it('rejects raw GPS coordinates outside Batangas City with outOfBounds: true', async () => {
    // Makati coordinates
    const outLat = 14.5547;
    const outLng = 121.0244;
    const result = await resolveLocation('My location', {
      rawLat: outLat,
      rawLng: outLng,
    });

    expect(result.outOfBounds).toBe(true);
    expect(result.lat).toBe(outLat);
    expect(result.lng).toBe(outLng);
  });
});

describe('3-Step Location Rule: Step 2 (Database POI Matching)', () => {
  const mockPlaces: PlacePoi[] = [
    {
      name: 'Cafe de Lipa Batangas City Branch',
      latitude: 13.758,
      longitude: 121.069,
      category: 'restaurant',
    },
    {
      name: 'Acosta Pastor Ancestral House',
      latitude: 13.7547,
      longitude: 121.0573,
      category: 'tourist-spot',
    },
  ];

  it('matches database POI and uses exact DB coordinates', async () => {
    const result = await resolveLocation('Acosta Pastor Ancestral House', {
      places: mockPlaces,
    });

    expect(result.outOfBounds).toBe(false);
    expect(result.kind).toBe('poi');
    expect(result.lat).toBe(13.7547);
    expect(result.lng).toBe(121.0573);
  });

  it('matches known HUB_POINTS aliases and uses exact hub coordinates', async () => {
    const clbResult = await resolveLocation('CLB');
    expect(clbResult.outOfBounds).toBe(false);
    expect(clbResult.kind).toBe('hub');
    expect(clbResult.lat).toBe(13.7539);
    expect(clbResult.lng).toBe(121.05);

    const smResult = await resolveLocation('sm');
    expect(smResult.outOfBounds).toBe(false);
    expect(smResult.kind).toBe('hub');
    expect(smResult.lat).toBe(13.7594);
    expect(smResult.lng).toBe(121.0722);
  });
});

describe('3-Step Location Rule: Step 3 (Strict Batangas Geofencing)', () => {
  it('rejects known non-Batangas cities with outOfBounds: true', async () => {
    const manilaResult = await resolveLocation('Manila');
    expect(manilaResult.outOfBounds).toBe(true);

    const lipaResult = await resolveLocation('SM Lipa');
    expect(lipaResult.outOfBounds).toBe(true);

    const bauanResult = await resolveLocation('Bauan Public Market');
    expect(bauanResult.outOfBounds).toBe(true);
  });

  it('returns LOCATION WARNING in transit briefing when destination is out of bounds', async () => {
    const briefing = await buildTransitBriefing('how to get to Manila', {
      origin: 'Batangas Pier',
      originLat: 13.754,
      originLng: 121.043,
    });

    expect(briefing).toContain('OUT OF BOUNDS — outside Batangas City');
    expect(briefing).toContain('LOCATION WARNING:');
    expect(briefing).not.toContain('SELECTED COMMUTE PLAN:');
  });

  it('returns LOCATION WARNING in transit briefing when origin is out of bounds', async () => {
    const briefing = await buildTransitBriefing('how to get to SM City Batangas', {
      origin: 'Manila',
      originLat: 14.5995,
      originLng: 120.9842,
    });

    expect(briefing).toContain('OUT OF BOUNDS — outside Batangas City');
    expect(briefing).toContain('LOCATION WARNING:');
    expect(briefing).not.toContain('SELECTED COMMUTE PLAN:');
  });
});
