import { describe, expect, it } from 'vitest';
import { CURATED_OD_CASES, generateRandomOdCases, isInsideBatangasCity } from '../fixtures/batangasOdCases.js';
import { buildTransitBriefing, wantsTnvsPreference } from './transitContext.js';
import { runOdSimulation } from './transitSimulation.js';

describe('TNVS preference detection', () => {
  it('detects Angkas-only request', () => {
    expect(wantsTnvsPreference('Acosta Pastor Ancestral House, i want to use angkas')).toEqual({
      requested: true,
      app: 'angkas',
    });
  });
});

describe('Pier → Grand Terminal', () => {
  it('briefing uses Alangilan hub transfer not Sta Clara + TNVS', async () => {
    const briefing = await buildTransitBriefing('from Batangas Pier to Grand Terminal', {
      origin: 'pier',
      originLat: 13.754,
      originLng: 121.043,
    });
    expect(briefing).toContain('KNOWN COMMUTER TRANSFER');
    expect(briefing).toContain('Alangilan - Batangas');
    expect(briefing).toContain('Evangelista');
    expect(briefing).toMatch(/PIER → GRAND TERMINAL|BATANGAS PIER → GRAND TERMINAL/);
    expect(briefing).toContain('Do NOT plan Sta. Clara');
  });
});

describe('Pier → Acosta with Angkas', () => {
  it('briefing honors TNVS preference and city-proper routing', async () => {
    const briefing = await buildTransitBriefing(
      'Acosta Pastor Ancestral House, i want to use angkas',
      { origin: 'pier', originLat: 13.754, originLng: 121.043 },
    );
    expect(briefing).toContain('TRAVELER REQUESTED TNVS (Angkas)');
    expect(briefing).toContain('Acosta Pastor Ancestral House');
    expect(briefing).toMatch(/PIER → CITY PROPER|Batangas Pier|RESOLVED ORIGIN:.*Pier/i);
    expect(briefing).toContain('ALL-ROUTES AUDIT');
    expect(briefing).toContain('BEST PLAN VERDICT');
  });
});

describe('Batangas City bounds', () => {
  it('excludes offshore Isla Verde POI', () => {
    expect(isInsideBatangasCity(13.5276, 121.079)).toBe(false);
  });

  it('includes SM City Batangas', () => {
    expect(isInsideBatangasCity(13.7594, 121.0722)).toBe(true);
  });
});

describe('random OD generator', () => {
  it('produces deterministic pairs for a seed', () => {
    const a = generateRandomOdCases(5, 99);
    const b = generateRandomOdCases(5, 99);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });
});

describe('OD simulation (live Supabase routes)', () => {
  it('passes all curated gold cases', async () => {
    const report = await runOdSimulation({ cases: CURATED_OD_CASES });
    if (report.failures.length) {
      const detail = report.failures.map((f) => `${f.caseId}: ${f.reason}`).join('\n');
      expect(report.failures, detail).toHaveLength(0);
    }
    expect(report.passed).toBe(CURATED_OD_CASES.length);
  }, 120_000);

  it('passes 12 random Batangas City OD pairs', async () => {
    const report = await runOdSimulation({ cases: [], randomCount: 12, randomSeed: 7 });
    expect(report.total).toBe(12);
    expect(report.failed).toBeLessThanOrEqual(2);
  }, 180_000);
});
