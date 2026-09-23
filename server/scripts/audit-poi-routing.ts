import 'dotenv/config';
import { supabase } from '../src/services/supabase.js';
import { analyzeOdPair } from '../src/services/transitContext.js';
import { HUB_POINTS, isInsideBatangasCity } from '../src/fixtures/batangasOdCases.js';

const POI_CATEGORIES = ['restaurant', 'Beach', 'Cultural', 'Historical', 'Nature', 'Adventure', 'Establishment'];

const { data: places, error } = await supabase
  .from('places')
  .select('name, category, latitude, longitude')
  .in('category', POI_CATEGORIES);
if (error) throw error;

const origins = [
  HUB_POINTS.find((p) => p.label.includes('SM'))!,
  HUB_POINTS.find((p) => p.label.includes('Pier'))!,
];

const inCity = (places ?? []).filter(
  (p) => isInsideBatangasCity(p.latitude, p.longitude),
);

type Row = {
  category: string;
  name: string;
  origin: string;
  planType: string;
  direct: string;
  hasTransfer: boolean;
  hasGeneric: boolean;
  resolved: boolean;
  warnings: number;
};

const rows: Row[] = [];

for (const origin of origins) {
  for (const place of inCity) {
    const r = await analyzeOdPair(
      { label: origin.label, lat: origin.lat, lng: origin.lng },
      { label: place.name, lat: place.latitude, lng: place.longitude },
    );
    rows.push({
      category: place.category,
      name: place.name,
      origin: origin.label.replace('Batangas ', '').replace('City ', ''),
      planType: r.planType,
      direct: r.directRoutes[0]?.split(' - ')[0] ?? '—',
      hasTransfer: r.hasKnownTransfer,
      hasGeneric: r.briefing.includes('GENERIC BATANGAS CITY ROUTING'),
      resolved: /RESOLVED DESTINATION: .+\(\d+\.\d+, \d+\.\d+\)/.test(r.briefing),
      warnings: r.warnings.length,
    });
  }
}

const byCat = new Map<string, Row[]>();
for (const row of rows) {
  const list = byCat.get(row.category) ?? [];
  list.push(row);
  byCat.set(row.category, list);
}

console.log(`Audited ${rows.length} OD pairs (${inCity.length} POIs × ${origins.length} origins)\n`);

for (const [cat, list] of [...byCat.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const direct = list.filter((r) => r.planType === 'direct').length;
  const transfer = list.filter((r) => r.planType === 'transfer' || r.hasTransfer).length;
  const partial = list.filter((r) => r.planType === 'partial' || r.planType === 'tnvs').length;
  const unresolved = list.filter((r) => !r.resolved).length;
  const warned = list.filter((r) => r.warnings > 0).length;
  console.log(
    `${cat.padEnd(14)} | total ${String(list.length).padStart(3)} | direct ${String(direct).padStart(3)} | transfer ${String(transfer).padStart(3)} | partial/tnvs ${String(partial).padStart(3)} | unresolved ${unresolved} | warnings ${warned}`,
  );
}

const weak = rows.filter((r) => r.planType === 'unknown' || r.planType === 'tnvs' || !r.resolved);
if (weak.length) {
  console.log('\nWeakest POI trips (may need TNVS last mile or better corridor data):');
  for (const w of weak.slice(0, 15)) {
    console.log(`  - ${w.origin} → ${w.name} (${w.category}): ${w.planType}`);
  }
}

console.log('\nSample restaurant from Pier:');
const sample = rows.find((r) => r.name === "Lolo's Place" && r.origin.includes('Pier'));
console.log(sample);
