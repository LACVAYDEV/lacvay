#!/usr/bin/env tsx
/**
 * Batangas City OD pair simulator — validates transit briefing for many origin/destination combos.
 *
 * Usage:
 *   npm run simulate:od -w server
 *   npm run simulate:od -w server -- --random 20
 *   npm run simulate:od -w server -- --from "SM City Batangas" --to "Monte Maria"
 */
import 'dotenv/config';
import { HUB_POINTS, PLACE_POIS } from '../src/fixtures/batangasOdCases.js';
import { runOdSimulation, simulateSingleOd } from '../src/services/transitSimulation.js';

function findPoint(label: string) {
  const n = label.toLowerCase();
  return [...HUB_POINTS, ...PLACE_POIS].find(
    (p) => p.label.toLowerCase() === n || p.label.toLowerCase().includes(n) || n.includes(p.label.toLowerCase()),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const randomIdx = args.indexOf('--random');
  const randomCount = randomIdx >= 0 ? Number(args[randomIdx + 1] ?? 15) : 0;
  const verbose = args.includes('--verbose') || args.includes('-v');

  const fromIdx = args.indexOf('--from');
  const toIdx = args.indexOf('--to');
  if (fromIdx >= 0 && toIdx >= 0) {
    const fromLabel = args[fromIdx + 1];
    const toLabel = args[toIdx + 1];
    if (!fromLabel || !toLabel) {
      console.error('Usage: --from "Origin" --to "Destination"');
      process.exit(1);
    }
    const origin = findPoint(fromLabel);
    const dest = findPoint(toLabel);
    if (!origin || !dest) {
      console.error('Could not resolve hub/POI labels. Try SM City Batangas, Monte Maria, Museo Puntong Batangan, etc.');
      process.exit(1);
    }
    const result = await simulateSingleOd(
      origin.label,
      origin.lat,
      origin.lng,
      dest.label,
      dest.lat,
      dest.lng,
    );
    console.log(`\n=== ${origin.label} → ${dest.label} ===`);
    console.log(`Plan type: ${result.planType}`);
    console.log(`Distance: ${result.distanceKm.toFixed(1)} km`);
    console.log(`Direct routes: ${result.directRoutes.join(', ') || 'none'}`);
    console.log(`Near origin: ${result.nearOriginRoutes.join(', ') || 'none'}`);
    console.log(`Near dest: ${result.nearDestRoutes.join(', ') || 'none'}`);
    console.log(`Documented fare: ${result.documentedFare != null ? `₱${result.documentedFare}` : 'n/a'}`);
    if (result.warnings.length) console.log(`Warnings: ${result.warnings.join('; ')}`);
    console.log('\n--- BRIEFING (excerpt) ---\n');
    const lines = result.briefing.split('\n');
    const start = lines.findIndex((l) => l.startsWith('RESOLVED ORIGIN'));
    console.log(lines.slice(Math.max(0, start), start + 80).join('\n'));
    return;
  }

  console.log('Running Batangas City OD simulation…\n');
  const report = await runOdSimulation({ randomCount, verbose });

  console.log(`Total cases: ${report.total}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Duration: ${report.durationMs} ms`);
  console.log('\nPlan type distribution:');
  for (const [type, count] of Object.entries(report.byPlanType)) {
    if (count > 0) console.log(`  ${type}: ${count}`);
  }

  if (report.failures.length) {
    console.log('\nFailures:');
    for (const f of report.failures) {
      console.log(`  - [${f.caseId}] ${f.reason}`);
      if (f.analysis) {
        console.log(`      planType=${f.analysis.planType}, direct=[${f.analysis.directRoutes.join(', ')}]`);
      }
    }
    process.exit(1);
  }

  console.log('\nAll cases passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
