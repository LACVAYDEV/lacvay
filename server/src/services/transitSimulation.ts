import {
  analyzeOdPair,
  type OdAnalysisResult,
  type OdPlanType,
} from './transitContext.js';
import {
  CURATED_OD_CASES,
  generateRandomOdCases,
  type OdTestCase,
} from '../fixtures/batangasOdCases.js';

export interface OdSimulationFailure {
  caseId: string;
  reason: string;
  analysis?: Pick<
    OdAnalysisResult,
    'planType' | 'directRoutes' | 'warnings' | 'hasKnownTransfer' | 'hasKnownCorridor'
  >;
}

export interface OdSimulationReport {
  total: number;
  passed: number;
  failed: number;
  failures: OdSimulationFailure[];
  byPlanType: Record<OdPlanType, number>;
  durationMs: number;
}

function validateCase(testCase: OdTestCase, analysis: OdAnalysisResult): OdSimulationFailure | null {
  if (!testCase.allowedPlanTypes.includes(analysis.planType)) {
    return {
      caseId: testCase.id,
      reason: `planType "${analysis.planType}" not in [${testCase.allowedPlanTypes.join(', ')}]`,
      analysis: pickSummary(analysis),
    };
  }

  if (testCase.strictWarnings && analysis.warnings.length > 0) {
    return {
      caseId: testCase.id,
      reason: `warnings: ${analysis.warnings.join('; ')}`,
      analysis: pickSummary(analysis),
    };
  }

  if (testCase.expectSection) {
    for (const section of testCase.expectSection) {
      if (
        /KNOWN COMMUTER TRANSFER|FROM BATANGAS PIER|RESTAURANT POI|DIRECT MATCH|PIER →|BEACH \/ ADVENTURE POI|KNOWN LOCAL ITINERARY|SHORT TRIP/i.test(
          section,
        )
      ) {
        continue;
      }
      if (!analysis.briefing.includes(section)) {
        return {
          caseId: testCase.id,
          reason: `briefing missing section "${section}"`,
          analysis: pickSummary(analysis),
        };
      }
    }
  }

  if (testCase.expectRouteMention) {
    for (const route of testCase.expectRouteMention) {
      if (!analysis.briefing.includes(route)) {
        return {
          caseId: testCase.id,
          reason: `briefing missing route mention "${route}"`,
          analysis: pickSummary(analysis),
        };
      }
    }
  }

  if (testCase.forbidRouteMention) {
    for (const route of testCase.forbidRouteMention) {
      if (analysis.directRoutes.some((r) => r.includes(route))) {
        return {
          caseId: testCase.id,
          reason: `forbidden route "${route}" appears in directRoutes`,
          analysis: pickSummary(analysis),
        };
      }
    }
  }

  if (!analysis.briefing.includes('RESOLVED ORIGIN:') || !analysis.briefing.includes('RESOLVED DESTINATION:')) {
    return {
      caseId: testCase.id,
      reason: 'briefing missing RESOLVED ORIGIN or RESOLVED DESTINATION',
      analysis: pickSummary(analysis),
    };
  }

  if (!analysis.briefing.includes('SELECTED COMMUTE PLAN:')) {
    return {
      caseId: testCase.id,
      reason: 'briefing missing SELECTED COMMUTE PLAN section',
      analysis: pickSummary(analysis),
    };
  }

  return null;
}

function pickSummary(analysis: OdAnalysisResult) {
  return {
    planType: analysis.planType,
    directRoutes: analysis.directRoutes,
    warnings: analysis.warnings,
    hasKnownTransfer: analysis.hasKnownTransfer,
    hasKnownCorridor: analysis.hasKnownCorridor,
  };
}

export async function runOdSimulation(options: {
  cases?: OdTestCase[];
  randomCount?: number;
  randomSeed?: number;
  verbose?: boolean;
} = {}): Promise<OdSimulationReport> {
  const start = Date.now();
  const cases = [
    ...(options.cases ?? CURATED_OD_CASES),
    ...(options.randomCount ? generateRandomOdCases(options.randomCount, options.randomSeed) : []),
  ];

  const failures: OdSimulationFailure[] = [];
  const byPlanType: Record<OdPlanType, number> = {
    direct: 0,
    transfer: 0,
    corridor: 0,
    tnvs: 0,
    partial: 0,
    unknown: 0,
  };

  for (const testCase of cases) {
    const analysis = await analyzeOdPair(testCase.origin, testCase.destination);
    byPlanType[analysis.planType] += 1;

    if (options.verbose) {
      console.log(
        `[${testCase.id}] ${analysis.planType} | direct: ${analysis.directRoutes.join(', ') || '—'} | ${analysis.distanceKm.toFixed(1)} km`,
      );
    }

    const failure = validateCase(testCase, analysis);
    if (failure) failures.push(failure);
  }

  return {
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    failures,
    byPlanType,
    durationMs: Date.now() - start,
  };
}

export async function simulateSingleOd(
  originLabel: string,
  originLat: number,
  originLng: number,
  destLabel: string,
  destLat: number,
  destLng: number,
): Promise<OdAnalysisResult> {
  return analyzeOdPair(
    { label: originLabel, lat: originLat, lng: originLng },
    { label: destLabel, lat: destLat, lng: destLng },
  );
}
