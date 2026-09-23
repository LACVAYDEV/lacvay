/** Batangas City approximate bounds (excludes Isla Verde / far offshore POIs). */
export const BATANGAS_CITY_BOUNDS = {
  minLat: 13.62,
  maxLat: 13.84,
  minLng: 121.02,
  maxLng: 121.12,
};

export interface OdPoint {
  label: string;
  lat: number;
  lng: number;
}

export interface OdTestCase {
  id: string;
  origin: OdPoint;
  destination: OdPoint;
  /** Allowed plan types from analyzeOdPair */
  allowedPlanTypes: Array<'direct' | 'transfer' | 'corridor' | 'tnvs' | 'partial' | 'unknown'>;
  /** Route name substring that must appear in briefing when geometry serves the trip */
  expectRouteMention?: string[];
  /** Route name substring that must NOT appear as recommended direct leg */
  forbidRouteMention?: string[];
  /** Must include this briefing section */
  expectSection?: string[];
  /** Must have zero audit warnings */
  strictWarnings?: boolean;
  notes?: string;
}

/** Transport hubs + well-known landmarks (always inside Batangas City). */
export const HUB_POINTS: OdPoint[] = [
  { label: 'SM City Batangas', lat: 13.7594, lng: 121.0722 },
  { label: 'Batangas City Grand Terminal', lat: 13.7818, lng: 121.0543 },
  { label: 'Batangas Pier', lat: 13.754, lng: 121.043 },
  { label: 'Ilijan Jeepney Terminal (near SM Batangas)', lat: 13.7578, lng: 121.0708 },
  { label: 'Monte Maria', lat: 13.6422, lng: 121.0465 },
  { label: 'Barangay Sto. Niño', lat: 13.699, lng: 121.0941 },
  { label: 'San Isidro Labrador Parish Church', lat: 13.7333, lng: 121.0769 },
  { label: 'Minor Basilica of the Immaculate Conception', lat: 13.7544708430939, lng: 121.059210109643 },
  { label: 'Plaza Mabini', lat: 13.7555009303031, lng: 121.05905733848 },
  { label: 'Alangilan', lat: 13.786, lng: 121.074 },
  { label: 'Batangas City Hall', lat: 13.75578, lng: 121.05833 },
];

/** Curated gold cases — special corridors + generic city trips. */
export const CURATED_OD_CASES: OdTestCase[] = [
  {
    id: 'pier-monte-maria',
    origin: HUB_POINTS[2],
    destination: HUB_POINTS[4],
    allowedPlanTypes: ['transfer', 'corridor', 'partial'],
    expectSection: ['KNOWN COMMUTER TRANSFER', 'FROM BATANGAS PIER'],
    forbidRouteMention: ['Libjo/San Isidro'],
    strictWarnings: true,
    notes: 'Two jeepneys via SM/Ilijan — not walk-to-Dela-Paz at pier',
  },
  {
    id: 'san-isidro-monte-maria',
    origin: HUB_POINTS[6],
    destination: HUB_POINTS[4],
    allowedPlanTypes: ['direct', 'corridor', 'partial'],
    expectRouteMention: ['Dela Paz/Ilijan'],
    forbidRouteMention: ['Libjo/San Isidro'],
    strictWarnings: true,
  },
  {
    id: 'san-isidro-grand-terminal',
    origin: HUB_POINTS[6],
    destination: HUB_POINTS[1],
    allowedPlanTypes: ['transfer', 'partial'],
    expectSection: ['KNOWN COMMUTER TRANSFER'],
    expectRouteMention: ['Libjo/San Isidro', 'Alangilan'],
    strictWarnings: true,
  },
  {
    id: 'grand-terminal-sm',
    origin: HUB_POINTS[1],
    destination: HUB_POINTS[0],
    allowedPlanTypes: ['direct', 'transfer', 'partial'],
    strictWarnings: true,
  },
  {
    id: 'sm-monte-maria',
    origin: HUB_POINTS[0],
    destination: HUB_POINTS[4],
    allowedPlanTypes: ['direct', 'corridor', 'partial'],
    expectRouteMention: ['Dela Paz/Ilijan'],
    strictWarnings: true,
  },
  {
    id: 'barangay-sto-nino-monte-maria',
    origin: HUB_POINTS[5],
    destination: HUB_POINTS[4],
    allowedPlanTypes: ['direct', 'corridor', 'partial'],
    expectRouteMention: ['Dela Paz/Ilijan'],
    forbidRouteMention: ['Libjo/San Isidro'],
    strictWarnings: true,
  },
  {
    id: 'pier-sm',
    origin: HUB_POINTS[2],
    destination: HUB_POINTS[0],
    allowedPlanTypes: ['direct', 'transfer', 'partial'],
    expectRouteMention: ['Sta. Clara/Pier'],
    strictWarnings: true,
  },
  {
    id: 'pier-grand-terminal',
    origin: HUB_POINTS[2],
    destination: HUB_POINTS[1],
    allowedPlanTypes: ['transfer', 'partial', 'corridor'],
    expectSection: ['KNOWN COMMUTER TRANSFER', 'PIER → GRAND TERMINAL', 'Alangilan'],
    forbidRouteMention: [],
    strictWarnings: true,
    notes: 'Sta Clara + Alangilan via Evangelista — not Sta Clara + Grab',
  },
  {
    id: 'grand-terminal-basilica',
    origin: HUB_POINTS[1],
    destination: HUB_POINTS[7],
    allowedPlanTypes: ['direct', 'transfer', 'partial', 'unknown'],
    strictWarnings: true,
    notes: 'Generic city-proper trip — should still produce a plan',
  },
  {
    id: 'sm-museo',
    origin: HUB_POINTS[0],
    destination: {
      label: 'Museo Puntong Batangan',
      lat: 13.755115632917,
      lng: 121.058347600853,
    },
    allowedPlanTypes: ['direct', 'transfer', 'partial', 'unknown'],
    strictWarnings: true,
    notes: 'Random cultural POI from places table',
  },
  {
    id: 'sm-lolos-place',
    origin: HUB_POINTS[0],
    destination: {
      label: "Lolo's Place",
      lat: 13.7454117260803,
      lng: 121.051704123134,
    },
    allowedPlanTypes: ['direct', 'transfer', 'partial', 'tnvs', 'unknown'],
    strictWarnings: true,
    notes: 'Restaurant off main corridor — partial + TNVS acceptable',
  },
  {
    id: 'alangilan-kwatogs',
    origin: HUB_POINTS[9],
    destination: {
      label: 'Kwatogs - Alangilan',
      lat: 13.7847935218409,
      lng: 121.068636207789,
    },
    allowedPlanTypes: ['direct', 'transfer', 'partial', 'tnvs', 'unknown'],
    expectRouteMention: ['Alangilan'],
    strictWarnings: true,
  },
  {
    id: 'basilica-plaza-mabini',
    origin: HUB_POINTS[7],
    destination: HUB_POINTS[8],
    allowedPlanTypes: ['direct', 'transfer', 'partial', 'unknown'],
    strictWarnings: true,
    notes: 'Short city-proper walk or single jeepney',
  },
  {
    id: 'sm-playa-montana',
    origin: HUB_POINTS[0],
    destination: {
      label: 'Playa Montaña',
      lat: 13.6364076356374,
      lng: 121.047812907787,
    },
    allowedPlanTypes: ['direct', 'transfer', 'partial', 'corridor'],
    expectRouteMention: ['Dela Paz/Ilijan'],
    strictWarnings: true,
  },
  {
    id: 'pier-playa-montana',
    origin: HUB_POINTS[2],
    destination: {
      label: 'Playa Montaña',
      lat: 13.6364076356374,
      lng: 121.047812907787,
    },
    allowedPlanTypes: ['transfer', 'partial'],
    expectSection: ['KNOWN COMMUTER TRANSFER', 'BEACH / ADVENTURE POI'],
    expectRouteMention: ['Sta. Clara/Pier', 'Dela Paz/Ilijan'],
    strictWarnings: true,
    notes: 'Pier to beach — same hub as Monte Maria, not Libjo at pier',
  },
  {
    id: 'pier-kape',
    origin: HUB_POINTS[2],
    destination: {
      label: 'Kape',
      lat: 13.7606433746569,
      lng: 121.058986567316,
    },
    allowedPlanTypes: ['direct', 'transfer', 'partial'],
    expectSection: ['RESTAURANT POI', 'PIER → CITY PROPER'],
    expectRouteMention: ['Sta. Clara/Pier'],
    strictWarnings: true,
  },
  {
    id: 'clb-grand-terminal',
    origin: {
      label: 'Colegio ng Lungsod ng Batangas (CLB)',
      lat: 13.7539,
      lng: 121.05,
    },
    destination: HUB_POINTS[1],
    allowedPlanTypes: ['direct', 'corridor'],
    expectRouteMention: ['Balagtas'],
    expectSection: ['DIRECT MATCH', 'KNOWN LOCAL ITINERARY'],
    strictWarnings: true,
    notes: 'One Balagtas/Alangilan jeepney — no City Hall transfer',
  },
];

/** POIs from LACVAY places table inside Batangas City bounds. */
export const PLACE_POIS: OdPoint[] = [
  { label: 'Museo Puntong Batangan', lat: 13.755115632917, lng: 121.058347600853 },
  { label: 'Acosta Pastor Ancestral House', lat: 13.758966822164, lng: 121.059363209643 },
  { label: "Lolo's Place", lat: 13.7454117260803, lng: 121.051704123134 },
  { label: 'Batangas City Mangrove Eco Park', lat: 13.7421181559057, lng: 121.060545698007 },
  { label: 'Kape', lat: 13.7606433746569, lng: 121.058986567316 },
  { label: 'Top Restaurant', lat: 13.7575971704243, lng: 121.058281824989 },
  { label: 'Milani\'s Seafood Restaurant', lat: 13.753265062538, lng: 121.072457753825 },
  { label: 'Playa Montaña', lat: 13.6364076356374, lng: 121.047812907787 },
  { label: 'Kay Butas Rock Formation', lat: 13.6304343400517, lng: 121.055910679808 },
  { label: 'Kwatogs - Alangilan', lat: 13.7847935218409, lng: 121.068636207789 },
  { label: 'Pronto', lat: 13.7689371507935, lng: 121.068530109643 },
  { label: 'Wanam sa Bukid', lat: 13.758751406271, lng: 121.071230682661 },
  { label: 'Bukatots', lat: 13.749359293235, lng: 121.067905124989 },
  { label: 'Felicia\'s Cafe', lat: 13.6338305698513, lng: 121.069230116059 },
  { label: 'Montemaria International Pilgrimage and Conference Center', lat: 13.6424582095287, lng: 121.043314482659 },
];

export function isInsideBatangasCity(lat: number, lng: number): boolean {
  return (
    lat >= BATANGAS_CITY_BOUNDS.minLat &&
    lat <= BATANGAS_CITY_BOUNDS.maxLat &&
    lng >= BATANGAS_CITY_BOUNDS.minLng &&
    lng <= BATANGAS_CITY_BOUNDS.maxLng
  );
}

/** Seeded pseudo-random OD pairs from hubs × POIs (deterministic for CI). */
export function generateRandomOdCases(count: number, seed = 42): OdTestCase[] {
  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };

  const pool = [...HUB_POINTS, ...PLACE_POIS].filter((p) => isInsideBatangasCity(p.lat, p.lng));
  const cases: OdTestCase[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count * 3 && cases.length < count; i++) {
    const o = pool[Math.floor(rand() * pool.length)];
    const d = pool[Math.floor(rand() * pool.length)];
    if (o.label === d.label) continue;
    const key = `${o.label}→${d.label}`;
    if (used.has(key)) continue;
    used.add(key);

    cases.push({
      id: `random-${cases.length + 1}-${normalizeId(o.label)}-to-${normalizeId(d.label)}`,
      origin: o,
      destination: d,
      allowedPlanTypes: ['direct', 'transfer', 'corridor', 'partial', 'tnvs', 'unknown'],
      strictWarnings: true,
      notes: 'Auto-generated random Batangas City OD pair',
    });
  }

  return cases;
}

function normalizeId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
}
