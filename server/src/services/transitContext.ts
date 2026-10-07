import { supabase } from './supabase.js';
import type { Database, Json } from '../types/database.types.js';
import { resolveGpsOrigin, resolveLocation, isInBatangas } from './reverseGeocode.js';
import { buildOptimizedItinerary, type RouteMatchInput } from './itineraryPlanner.js';

type TransitRoute = Database['public']['Tables']['transit_routes']['Row'];
type JeepneyFare = Database['public']['Tables']['jeepney_fare_matrix']['Row'];
type Place = Database['public']['Tables']['places']['Row'];
type Landmark = Database['public']['Tables']['route_landmarks']['Row'];

export interface ChatLocationContext {
  origin?: string;
  originLat?: number;
  originLng?: number;
}

interface GeoPoint {
  name: string;
  lat: number;
  lng: number;
  aliases: string[];
}

interface KnownCorridor {
  originAliases: string[];
  destinationAliases: string[];
  walkTo: string;
  walkMin: number;
  jeepneySignboard: string;
  jeepneyColor?: string;
  alight: string;
  fareRegular: number;
  fareDiscounted?: number;
  etaMin: number;
  lastMile: string;
  apps: string;
}

const KNOWN_POINTS: GeoPoint[] = [
  { name: 'SM City Batangas', lat: 13.7594, lng: 121.0722, aliases: ['sm batangas', 'sm city', 'sm city batangas', 'sm'] },
  {
    name: 'Ilijan Jeepney Terminal (SM Batangas parking / outskirts)',
    lat: 13.7578,
    lng: 121.0708,
    aliases: [
      'ilijan terminal',
      'ilijan jeepney terminal',
      'sm ilijan terminal',
      'sm parking ilijan',
      'sm batangas jeepney terminal',
      'ilijan terminal sm',
    ],
  },
  {
    name: 'Monte Maria',
    lat: 13.6422,
    lng: 121.0465,
    aliases: ['monte maria', 'montemaria', 'monte maria shrine', 'monte aria', 'monte marai', 'monte mari'],
  },
  {
    name: 'Barangay Sto. Niño',
    lat: 13.699,
    lng: 121.0941,
    aliases: [
      'barangay sto nino',
      'barangay santo nino',
      'brgy sto nino',
      'brgy santo nino',
      'sto nino batangas',
      'santo nino batangas city',
      'sto nino',
      'santo nino',
      'sto. nino',
    ],
  },
  {
    name: 'Sto. Niño Chapel – Monte Maria',
    lat: 13.6422,
    lng: 121.046,
    aliases: [
      'sto nino chapel',
      'sto. nino chapel',
      'santo nino chapel',
      'sto nino chapel monte maria',
      'santo nino chapel monte maria',
    ],
  },
  { name: 'Batangas City Grand Terminal', lat: 13.7818, lng: 121.0543, aliases: ['grand terminal', 'batangas city grand terminal'] },
  { name: 'Batangas Pier', lat: 13.754, lng: 121.043, aliases: ['pier', 'batangas pier', 'batangas port', 'port of batangas', 'ppa'] },
  {
    name: 'Colegio ng Lungsod ng Batangas (CLB)',
    lat: 13.7539,
    lng: 121.05,
    aliases: [
      'clb',
      'colegio ng lungsod ng batangas',
      'colegio ng lungsod',
      'batangas city sports coliseum',
      'sports coliseum',
      'arrieta road',
    ],
  },
  { name: 'Minor Basilica', lat: 13.7565, lng: 121.0583, aliases: ['basilica', 'minor basilica', 'plaza mabini', 'city proper'] },
  { name: 'Alangilan', lat: 13.786, lng: 121.074, aliases: ['alangilan', 'batstateu', 'batangas state university'] },
  {
    name: 'BatStateU Pablo Borbon Main Campus (Alangilan)',
    lat: 13.786,
    lng: 121.074,
    aliases: [
      'pablo borbon',
      'governor pablo borbon',
      'pablo borbon main campus',
      'batstateu main campus',
      'batstateu pablo borbon',
      'batangas state university pablo borbon',
      'main campus pablo borbon',
      'bsu pablo borbon',
      'bsu main campus',
    ],
  },
  { name: 'Ilijan', lat: 13.658, lng: 121.04, aliases: ['ilijan'] },
  { name: 'Pagkilatan', lat: 13.668, lng: 121.045, aliases: ['pagkilatan'] },
  {
    name: 'San Isidro Labrador Parish Church',
    lat: 13.7333,
    lng: 121.0769,
    aliases: ['san isidro', 'san isidro church', 'san isidro labrador', 'barangay san isidro'],
  },
  {
    name: 'Batangas City Hall',
    lat: 13.75578,
    lng: 121.05833,
    aliases: ['city hall', 'batangas city hall', 'bahay pamahalaan'],
  },
  {
    name: 'A. Evangelista Street (Alangilan jeepney corridor)',
    lat: 13.75786,
    lng: 121.05735,
    aliases: ['evangelista', 'evangelista st', 'evangelista street', 'a evangelista'],
  },
  {
    name: 'P. Herrera Street',
    lat: 13.76,
    lng: 121.0565,
    aliases: ['p herrera', 'herrera street', 'herrera st', 'p. herrera'],
  },
  {
    name: 'Rizal Avenue',
    lat: 13.7562,
    lng: 121.0585,
    aliases: ['rizal avenue', 'rizal ave', 'rizal'],
  },
  {
    name: 'P. Burgos Street (City Hall / Plaza Mabini)',
    lat: 13.7558,
    lng: 121.0585,
    aliases: ['p burgos', 'burgos', 'p. burgos'],
  },
  {
    name: 'D. Silang Street',
    lat: 13.7575,
    lng: 121.056,
    aliases: ['d silang', 'silang', 'diego silang'],
  },
];

/**
 * Verified Batangas City streets / roads for walk + board instructions.
 * Prefer these names in every plan; never invent streets (e.g. "Alangilan St").
 */
const REAL_STREET_ATLAS: string[] = [
  'REAL STREETS & ROADS (use these names in Walk / board / alight steps — street names help travelers):',
  '',
  'City proper / Poblacion:',
  '- **A. Evangelista Street** — northbound Alangilan - Batangas jeepneys; transfer from City Hall (~4 min walk)',
  '- **P. Herrera Street** — with Evangelista on Alangilan / Balagtas northbound corridors',
  '- **Rizal Avenue (N437)** — main poblacion east–west; Citimart / Bay Mall / Lawas area',
  '- **P. Burgos Street** — Batangas City Hall / Plaza Mabini / Basilica side',
  '- **D. Silang Street** — Capitolio / Gulod side; kanto Evangelista–D. Silang, Rizal–D. Silang',
  '- **P. Zamora Street** — kanto with Rizal Avenue (Capitolio route landmarks)',
  '- **Hilltop** — Balagtas corridor landmark (not a full street invent)',
  '',
  'Pier / CLB / Santa Clara:',
  '- **Arrieta Road** — beside Colegio ng Lungsod ng Batangas (CLB) / Sports Coliseum; board Balagtas, Alangilan, Sorosoro, or Sta. Clara/Pier here',
  '- **Ferry Road / Pier access road** — Batangas Pier / PPA Sta. Clara jeepney stop',
  '- There is **NO "Alangilan Street"** near CLB — Alangilan is a barangay + route name only',
  '',
  'SM / south coast:',
  '- **Batangas–Tabangao–Lobo Road (N439)** — Tabangao / Dela Paz / Ilijan / Monte Maria / Pagkilatan coastal corridor',
  '- **National Road / Jose P. Laurel Highway** — southbound Alangilan corridor toward Grand Terminal / Alangilan barangay',
  '- **SM City Batangas parking / outskirts (PPA coastal side)** — Ilijan Jeepney Terminal loading bay (not a street invent)',
  '',
  'North / Grand Terminal / Alangilan barangay:',
  '- **Diversion Road (Balagtas)** — Balagtas corridor toward Grand Terminal',
  '- Board Alangilan - Batangas on **Evangelista / P. Herrera** in city, then National Road north — not "Alangilan St"',
  '',
  'Barangay Sto. Niño / San Isidro / Libjo:',
  '- Sto. Niño & Tabangao: board along **Batangas–Tabangao–Lobo Road (N439)** / Dela Paz–Tabangao corridor',
  '- San Isidro Church: jeepney stop on the main road of the Libjo/San Isidro or Dela Paz corridor (ask driver)',
  '',
  'RULE: Every **Walk** and jeepney **boarding/alight** line should name a real street or landmark from this list when possible. If unknown, write "nearest stop on [route signboard]" — never invent a street.',
];

function formatStreetAtlas(): string {
  return REAL_STREET_ATLAS.join('\n');
}

const COMMUTER_DETAIL_RULES: string[] = [
  'COMMUTER DETAIL RULES (optimized plan — expand every step for travelers):',
  '- Jeepneys are **loops**: riders usually walk **200–300 meters** (or less when possible) to the **nearest point where the route line passes**, then **wait at the roadside** and **flag down** the jeepney when the **signboard matches**.',
  '- **First mile:** state approximate **meters**, a **real street/road name** from REAL STREETS, which **route signboard** to look for, and that they should **wait at the curb** (not inside a mall unless the briefing says so).',
  '- **Transfers:** say **where to get off** (street, landmark, or terminal), **walk ~X min / ~Xm** to where the **next route passes**, then **wait and flag** the next jeepney. Prefer the **shortest walk** between route lines (already optimized in SELECTED COMMUTE PLAN).',
  '- **Last mile:** after alighting, give a **short walk** to the exact destination (shrine entrance, campus gate, etc.) with street name when known.',
  '- Use **2 or 3 jeepneys** when that is cheaper/faster than TNVS; only suggest TNVS for long gaps (>1.2 km) or when the traveler asked for it.',
  '- Do NOT invent street names — use REAL STREETS & ROADS below.',
];

function streetHintForLabel(label: string): string | null {
  const n = label.toLowerCase();
  if (/clb|colegio|sports coliseum|arrieta/.test(n)) return 'Arrieta Rd';
  if (/pier|ppa|port of batangas|batangas port/.test(n)) return 'Ferry Road / Pier access';
  if (/city hall|plaza mabini|basilica|burgos/.test(n)) return 'P. Burgos St';
  if (/evangelista/.test(n)) return 'A. Evangelista St';
  if (/grand terminal|alangilan|batstateu|pablo borbon/.test(n)) {
    return /grand terminal/.test(n) ? 'Diversion Rd / National Road (Grand Terminal area)' : 'National Road (Alangilan corridor)';
  }
  if (/sm city|sm batangas|ilijan terminal/.test(n)) return 'SM parking / PPA coastal side (Ilijan terminal)';
  if (/sto\.?\s*nino|santo nino|tabangao|monte maria|pagkilatan|ilijan|san isidro/.test(n)) {
    return 'Batangas–Tabangao–Lobo Road (N439)';
  }
  if (/rizal|citimart|bay mall|lawas/.test(n)) return 'Rizal Avenue';
  return null;
}

interface KnownTransfer {
  originAliases: string[];
  destinationAliases: string[];
  leg1Route: string;
  leg1Board: string;
  alightAt: string;
  walkTransfer: string;
  walkMin: number;
  leg2Route: string;
  leg2Board: string;
  leg2Alight: string;
  note: string;
}

/** Documented walk transfers locals use — overrides geometric path overlap guesses. */
const KNOWN_TRANSFERS: KnownTransfer[] = [
  {
    originAliases: ['san isidro', 'san isidro church', 'san isidro labrador', 'barangay san isidro', 'libjo'],
    destinationAliases: [
      'alangilan',
      'batstateu',
      'batangas state university',
      'grand terminal',
      'batangas city grand terminal',
      'city terminal',
    ],
    leg1Route: 'Libjo/San Isidro - Batangas',
    leg1Board: 'San Isidro stop outside the church (Libjo/San Isidro – Batangas signboard)',
    alightAt:
      'Batangas City Hall (P. Burgos / Plaza Mabini area) — the nearest point on this route to walk to Evangelista St',
    walkTransfer:
      'Walk to A. Evangelista Street where Alangilan - Batangas jeepneys pass (northbound corridor via Evangelista / P. Herrera)',
    walkMin: 4,
    leg2Route: 'Alangilan - Batangas',
    leg2Board: 'Evangelista Street — wait for Alangilan - Batangas signboard',
    leg2Alight:
      'Alangilan / BatStateU if going to Alangilan, or stay on toward Batangas City Grand Terminal if that is the destination',
    note:
      'Do NOT alight at Alangilan junction or Alangilan Bridge for this transfer. Local commuters get off at City Hall and walk to Evangelista St.',
  },
  {
    originAliases: ['pier', 'batangas pier', 'batangas port', 'port of batangas', 'ppa'],
    destinationAliases: [
      'monte maria',
      'montemaria',
      'pagkilatan',
      'pagkilatan shrine',
      'sto nino chapel',
      'playa montana',
      'playa montaña',
      'kay butas',
      'brizamar',
      'kamantigue',
      'isola vista',
      'seablaze',
      'felicia',
    ],
    leg1Route: 'Sta. Clara/Pier - Batangas',
    leg1Board: 'Batangas Pier / PPA jeepney stop (Sta. Clara/Pier signboard)',
    alightAt:
      'SM City Batangas / Ilijan Jeepney Terminal on the coastal road — Dela Paz/Ilijan passes here (~0.1 km), NOT at the pier (~2.5 km away)',
    walkTransfer:
      'If not dropped exactly at the terminal, a short walk along the coastal road toward SM / Ilijan terminal to board Dela Paz/Ilijan',
    walkMin: 3,
    leg2Route: 'Dela Paz/Ilijan - Batangas',
    leg2Board:
      'Ilijan Jeepney Terminal near SM (signboard: Dela Paz, Ilijan, Pagkilatan, Monte Maria)',
    leg2Alight: 'Monte Maria / Pagkilatan stop on the coastal route',
    note:
      'Dela Paz/Ilijan is NOT within walking distance of Batangas Pier. Do NOT tell travelers to walk from the pier to catch Dela Paz/Ilijan. Do NOT use Libjo/San Isidro or Alangilan junction transfer.',
  },
  {
    originAliases: ['pier', 'batangas pier', 'batangas port', 'port of batangas', 'ppa'],
    destinationAliases: [
      'grand terminal',
      'batangas city grand terminal',
      'city terminal',
      'alangilan',
      'batstateu',
      'batangas state university',
    ],
    leg1Route: 'Sta. Clara/Pier - Batangas',
    leg1Board:
      'Batangas Pier / Sta. Clara/Pier jeepney stop — the only route that passes beside the pier (~0.2 km)',
    alightAt:
      'Batangas City Hall / city-proper area (Plaza Mabini side) — Sta. Clara/Pier does NOT pass near Grand Terminal (~2.6 km away on the route line)',
    walkTransfer:
      'Walk to A. Evangelista Street where Alangilan - Batangas jeepneys pass (same hub locals use from San Isidro/Libjo)',
    walkMin: 4,
    leg2Route: 'Alangilan - Batangas',
    leg2Board: 'Evangelista Street — wait for Alangilan - Batangas signboard (Yellow)',
    leg2Alight:
      'Batangas City Grand Terminal if that is the destination, or Alangilan / BatStateU farther north',
    note:
      'Optimized two-jeepney route — do NOT use Sta. Clara/Pier alone + Grab/TNVS to Grand Terminal. Alangilan - Batangas from Evangelista serves Grand Terminal (~1.2 km from route line). Do NOT alight at Alangilan junction/bridge for this transfer.',
  },
  {
    originAliases: [
      'clb',
      'colegio ng lungsod ng batangas',
      'colegio ng lungsod',
      'sports coliseum',
      'arrieta road',
      'plaza mabini',
      'basilica',
      'city hall',
      'minor basilica',
      'city proper',
    ],
    destinationAliases: [
      'monte maria',
      'montemaria',
      'pagkilatan',
      'pagkilatan shrine',
      'sto nino chapel',
      'playa montana',
      'playa montaña',
      'kay butas',
      'brizamar',
      'kamantigue',
      'isola vista',
      'seablaze',
      'felicia',
      'ilijan',
    ],
    leg1Route: 'Libjo/San Isidro - Batangas or Tabangao - Batangas (or Capitolio toward SM)',
    leg1Board:
      'Nearest stop to origin on Libjo/San Isidro, Tabangao, or Capitolio corridor (from CLB: Arrieta Rd ~0.2 km)',
    alightAt:
      'Ilijan Jeepney Terminal at SM City Batangas parking / outskirts (PPA coastal side) — this is where Dela Paz/Ilijan jeepneys load for Monte Maria / Pagkilatan / Ilijan',
    walkTransfer:
      'If dropped at SM mall entrance, walk to the Ilijan jeepney terminal on the parking / outskirts side (usually a few minutes)',
    walkMin: 5,
    leg2Route: 'Dela Paz/Ilijan - Batangas',
    leg2Board:
      'Ilijan Jeepney Terminal — SM Batangas parking/outskirts (signboard: Dela Paz, Ilijan, Pagkilatan, Monte Maria)',
    leg2Alight: 'Monte Maria / Pagkilatan / beach stop on the Dela Paz/Ilijan coastal route',
    note:
      'Local hub: Ilijan jeepneys leave from the SM Batangas parking/outskirts terminal — NOT from a random Tabangao–Dela Paz road intersection. Do NOT board Alangilan (north). Do NOT walk 20+ min from CLB expecting to catch Dela Paz on the coastal road.',
  },
];

const SOUTH_COAST_ALIASES = [
  'monte maria',
  'montemaria',
  'pagkilatan',
  'pagkilatan shrine',
  'ilijan',
  'sto nino chapel',
  'playa montana',
  'playa montaña',
  'kay butas',
  'brizamar',
  'kamantigue',
  'isola vista',
  'maris coral',
  'seablaze',
  'felicia',
];
const MONTE_MARIA_AREA_ALIASES = [
  'monte maria',
  'montemaria',
  'pagkilatan',
  'sto nino chapel',
  'santo nino chapel',
  'sto nino chapel monte maria',
];

function isSouthCoastalDestination(label: string): boolean {
  return includesAlias(label, SOUTH_COAST_ALIASES);
}

function isBarangayStoNino(label: string, lat?: number, lng?: number): boolean {
  if (includesAlias(label, ['barangay sto nino', 'barangay santo nino', 'brgy sto nino'])) return true;
  if (lat == null || lng == null) return false;
  const brgy = findPoint('barangay sto nino');
  return brgy != null && haversineKm(lat, lng, brgy.lat, brgy.lng) <= 3.5;
}

export type TnvsAppPreference = 'angkas' | 'grab' | 'idol' | 'tnvs';

/** Traveler explicitly asked for Angkas/Grab/TNVS instead of jeepney. */
export function wantsTnvsPreference(message: string): { requested: boolean; app: TnvsAppPreference } {
  const n = normalize(message);
  if (
    /\b(?:use|via|book|take|prefer|want|gusto|gamit)\s+(?:angkas|grab|idol|tnvs)\b/.test(n) ||
    /\b(?:angkas|grab|idol)\s+only\b/.test(n) ||
    /\bdoor to door\s+(?:angkas|grab|tnvs)\b/.test(n)
  ) {
    if (n.includes('grab')) return { requested: true, app: 'grab' };
    if (n.includes('idol')) return { requested: true, app: 'idol' };
    if (n.includes('angkas')) return { requested: true, app: 'angkas' };
    return { requested: true, app: 'tnvs' };
  }
  return { requested: false, app: 'tnvs' };
}

function isNorthTerminalDestination(label: string, lat?: number, lng?: number): boolean {
  if (
    includesAlias(label, [
      'grand terminal',
      'batangas city grand terminal',
      'city terminal',
      'alangilan',
      'batstateu',
      'batangas state university',
      'pablo borbon',
      'governor pablo borbon',
      'pablo borbon main campus',
      'batstateu main campus',
      'bsu pablo borbon',
      'bsu main campus',
    ])
  ) {
    return true;
  }
  if (lat == null || lng == null) return false;
  const terminal = findPoint('batangas city grand terminal');
  const alangilan = findPoint('alangilan');
  if (terminal && haversineKm(lat, lng, terminal.lat, terminal.lng) <= 1.5) return true;
  if (alangilan && haversineKm(lat, lng, alangilan.lat, alangilan.lng) <= 2) return true;
  return false;
}

function isCityProperDestination(label: string, lat?: number, lng?: number): boolean {
  if (
    includesAlias(label, [
      'plaza mabini',
      'basilica',
      'city hall',
      'museo',
      'ancestral house',
      'city proper',
      'top restaurant',
      'kape',
    ])
  ) {
    return true;
  }
  if (lat == null || lng == null) return false;
  const plaza = findPoint('plaza mabini');
  const hall = findPoint('batangas city hall');
  if (plaza && haversineKm(lat, lng, plaza.lat, plaza.lng) <= 1.2) return true;
  if (hall && haversineKm(lat, lng, hall.lat, hall.lng) <= 1.2) return true;
  return false;
}

function isPierOrigin(label: string, lat?: number, lng?: number): boolean {
  if (includesAlias(label, ['clb', 'colegio ng lungsod', 'sports coliseum', 'arrieta'])) return false;
  if (includesAlias(label, ['pier', 'batangas pier', 'batangas port', 'port of batangas', 'ppa'])) return true;
  if (lat == null || lng == null) return false;
  const pier = findPoint('batangas pier');
  // Strict: only the pier grounds / Sta. Clara stop — not CLB (~0.8 km) or city proper
  return pier != null && haversineKm(lat, lng, pier.lat, pier.lng) <= 0.4;
}

function isStaClaraPierRoute(routeName: string): boolean {
  const n = normalize(routeName);
  return n.includes('sta clara') || (n.includes('pier') && n.includes('batangas'));
}

function isMonteMariaArea(label: string, lat?: number, lng?: number): boolean {
  if (isBarangayStoNino(label, lat, lng)) return false;
  if (includesAlias(label, MONTE_MARIA_AREA_ALIASES)) return true;
  if (lat == null || lng == null) return false;
  const chapel = findPoint('sto nino chapel monte maria');
  const shrine = findPoint('monte maria');
  if (chapel && haversineKm(lat, lng, chapel.lat, chapel.lng) <= 2.5) return true;
  if (shrine && haversineKm(lat, lng, shrine.lat, shrine.lng) <= 2.5) return true;
  return false;
}

/** South-coast jeepney corridors that serve Monte Maria / Pagkilatan / Ilijan. */
function isSouthCoastalRoute(routeName: string): boolean {
  const n = normalize(routeName);
  return n.includes('dela paz') || n.includes('ilijan') || n.includes('tabangao') || n.includes('pagkilatan');
}

/** Near origin but heads toward Batangas City — wrong when destination is Monte Maria / south coast. */
function routeWrongForSouthCoastalTrip(
  routeName: string,
  destinationLabel: string,
  originLabel?: string,
  originLat?: number,
  originLng?: number,
): boolean {
  if (!isSouthCoastalDestination(destinationLabel)) return false;
  if (isSouthCoastalRoute(routeName)) return false;
  const n = normalize(routeName);
  if (n.includes('libjo') && n.includes('san isidro')) return true;
  if (n.includes('alangilan')) return true;
  if (n.includes('balagtas')) return true;
  if (n.includes('capitolio')) return true;
  if (n.includes('sorosoro')) return true;
  if (isStaClaraPierRoute(routeName)) {
    // Valid first leg from Batangas Pier toward SM/Ilijan — not a direct Monte Maria route
    if (originLabel && isPierOrigin(originLabel, originLat, originLng)) return false;
    return true;
  }
  return false;
}

const KNOWN_CORRIDORS: KnownCorridor[] = [
  {
    originAliases: ['sto nino chapel', 'santo nino chapel', 'sto nino chapel monte maria'],
    destinationAliases: ['monte maria', 'montemaria', 'monte maria shrine'],
    walkTo: 'You are already at the Monte Maria / Sto. Niño Chapel area on the coastal road',
    walkMin: 0,
    jeepneySignboard:
      'Optional: Dela Paz/Ilijan - Batangas if you need to move along the road — otherwise a short walk or TNVS up to the shrine gate',
    jeepneyColor: undefined,
    alight: 'Monte Maria shrine entrance',
    fareRegular: 13,
    fareDiscounted: 11,
    etaMin: 5,
    lastMile:
      'From Sto. Niño Chapel, walk or take a short TNVS ride up to the Monte Maria shrine — you are already in the complex.',
    apps: 'TNVS optional for the uphill last few meters.',
  },
  {
    originAliases: [
      'barangay sto nino',
      'barangay santo nino',
      'brgy sto nino',
      'sto nino batangas',
      'sto nino',
      'santo nino',
    ],
    destinationAliases: ['monte maria', 'montemaria', 'pagkilatan', 'pagkilatan shrine'],
    walkTo: 'Main road / jeepney stop along the Dela Paz–Tabangao corridor in Barangay Sto. Niño',
    walkMin: 5,
    jeepneySignboard:
      'Dela Paz/Ilijan - Batangas or Tabangao - Batangas (coastal corridor toward Pagkilatan / Monte Maria). NOT Libjo/San Isidro — that goes to Batangas City.',
    jeepneyColor: undefined,
    alight: 'Monte Maria / Pagkilatan stop on the coastal route',
    fareRegular: 23,
    fareDiscounted: 19,
    etaMin: 35,
    lastMile:
      'Alight at Monte Maria. A short walk to the shrine is usually enough — tricycle or TNVS is optional.',
    apps: 'TNVS optional for the last few meters.',
  },
  {
    originAliases: [
      'clb',
      'colegio ng lungsod ng batangas',
      'colegio ng lungsod',
      'sports coliseum',
      'arrieta road',
      'sm batangas',
      'sm city',
      'pier',
      'batangas pier',
      'plaza mabini',
      'basilica',
    ],
    destinationAliases: [
      'barangay sto nino',
      'barangay santo nino',
      'brgy sto nino',
      'sto nino batangas',
      'sto nino',
      'santo nino',
    ],
    walkTo:
      'Nearest Tabangao / Libjo / Dela Paz corridor stop near origin (from CLB: Arrieta Rd ~0–2 min). Do NOT board Alangilan - Batangas — that goes NORTH to Alangilan/BatStateU, not Barangay Sto. Niño. There is NO "Alangilan Street" near CLB.',
    walkMin: 2,
    jeepneySignboard:
      'Tabangao - Batangas or Libjo/San Isidro - Batangas or Dela Paz/Ilijan - Batangas toward the Sto. Niño / Tabangao side. NEVER Alangilan - Batangas for this destination.',
    jeepneyColor: undefined,
    alight: 'Stop nearest Barangay Sto. Niño on the Tabangao / Dela Paz corridor (ask driver for Sto. Niño / Tabangao)',
    fareRegular: 13,
    fareDiscounted: 11,
    etaMin: 35,
    lastMile:
      'From the jeepney stop, walk or book Angkas/Grab into the barangay interior if your pin is off the main road.',
    apps: 'TNVS useful for the barangay interior last mile.',
  },
  {
    originAliases: [
      'barangay sto nino',
      'barangay santo nino',
      'brgy sto nino',
      'sto nino batangas',
      'sto nino',
      'santo nino',
    ],
    destinationAliases: [
      'clb',
      'colegio ng lungsod',
      'sports coliseum',
      'sm batangas',
      'sm city',
      'pier',
      'batangas pier',
      'plaza mabini',
      'grand terminal',
      'basilica',
    ],
    walkTo: 'Main road jeepney stop in Barangay Sto. Niño on the Tabangao / Dela Paz / Libjo corridor',
    walkMin: 5,
    jeepneySignboard:
      'Tabangao - Batangas, Dela Paz/Ilijan - Batangas, or Libjo/San Isidro - Batangas toward Batangas City / SM / pier side. Do NOT board Alangilan - Batangas from Sto. Niño for city/CLB trips.',
    jeepneyColor: undefined,
    alight: 'Nearest stop to destination (CLB: Arrieta Rd; SM; pier; Plaza Mabini — ask driver)',
    fareRegular: 13,
    fareDiscounted: 11,
    etaMin: 35,
    lastMile: 'Short walk from the jeepney stop to your destination landmark.',
    apps: 'TNVS optional for last meters.',
  },
  {
    originAliases: ['san isidro', 'san isidro church', 'san isidro labrador', 'barangay san isidro'],
    destinationAliases: ['monte maria', 'montemaria', 'pagkilatan', 'pagkilatan shrine', 'sto nino chapel'],
    walkTo: 'Dela Paz/Ilijan jeepney stop along the road at San Isidro (the route passes the church area)',
    walkMin: 2,
    jeepneySignboard:
      'Dela Paz/Ilijan - Batangas (signboard may show Dela Paz, Ilijan, or Pagkilatan). Passes through San Isidro and serves Monte Maria. Do NOT board Libjo/San Isidro — that route goes to Batangas City, not Monte Maria.',
    jeepneyColor: undefined,
    alight: 'Monte Maria / Pagkilatan stop on the coastal route — jeepneys serve the shrine area',
    fareRegular: 23,
    fareDiscounted: 19,
    etaMin: 30,
    lastMile:
      'Alight at the Monte Maria stop. A short walk to the shrine entrance is usually enough — tricycle or TNVS is optional, not required.',
    apps: 'TNVS optional only if you prefer not to walk the last few meters.',
  },
  {
    originAliases: ['clb', 'colegio ng lungsod ng batangas', 'colegio ng lungsod', 'sports coliseum', 'arrieta road'],
    destinationAliases: [
      'grand terminal',
      'batangas city grand terminal',
      'city terminal',
      'alangilan',
      'batstateu',
      'batangas state university',
      'pablo borbon',
      'governor pablo borbon',
      'pablo borbon main campus',
      'batstateu main campus',
      'batstateu pablo borbon',
      'bsu pablo borbon',
      'bsu main campus',
    ],
    walkTo: 'Balagtas or Alangilan - Batangas jeepney stop on **Arrieta Rd** near CLB (~0–2 min) — both routes pass near Grand Terminal / BatStateU Pablo Borbon. Do NOT say "Alangilan St".',
    walkMin: 2,
    jeepneySignboard:
      'Balagtas - Batangas OR Alangilan - Batangas OR Sorosoro - Batangas — ONE jeepney from CLB toward Grand Terminal / Alangilan / BatStateU Pablo Borbon. Do NOT transfer at City Hall → Evangelista; that hub is for Pier/Libjo trips when no direct route exists.',
    jeepneyColor: undefined,
    alight: 'BatStateU Pablo Borbon / Alangilan stop, or Batangas City Grand Terminal if that is the destination',
    fareRegular: 13,
    fareDiscounted: 11,
    etaMin: 20,
    lastMile: 'Short walk from the jeepney stop to the campus gate / terminal entrance.',
    apps: 'TNVS optional; not required.',
  },
  {
    originAliases: ['clb', 'colegio ng lungsod ng batangas', 'colegio ng lungsod', 'sports coliseum', 'arrieta road'],
    destinationAliases: ['pier', 'batangas pier', 'batangas port', 'port of batangas', 'ppa'],
    walkTo: 'Batangas Pier along Arrieta / pier road (CLB is only ~0.8 km away — no need to go to SM)',
    walkMin: 10,
    jeepneySignboard:
      'Optional only: Sta. Clara/Pier - Batangas boarded NEAR CLB / Arrieta Rd (~0.1 km). Do NOT board at SM — SM is ~2.5 km the wrong direction from CLB.',
    jeepneyColor: undefined,
    alight: 'Batangas Pier entrance',
    fareRegular: 13,
    fareDiscounted: 11,
    etaMin: 12,
    lastMile:
      'Best plan is walk-only ~10–12 min. Skip jeepney unless raining or carrying heavy bags — then board Sta. Clara near CLB, never via SM.',
    apps: 'TNVS optional; not needed for this short trip.',
  },
  {
    originAliases: ['sm batangas', 'sm city', 'sm', 'ilijan terminal', 'sm parking ilijan', 'sm ilijan terminal'],
    destinationAliases: ['monte maria', 'montemaria', 'pagkilatan', 'ilijan', 'playa montana', 'kay butas'],
    walkTo:
      'Ilijan Jeepney Terminal at SM City Batangas parking / outskirts (coastal / PPA side — where Ilijan & Dela Paz jeepneys wait)',
    walkMin: 5,
    jeepneySignboard:
      'Dela Paz/Ilijan - Batangas (Ilijan / Pagkilatan / Monte Maria). Board at the SM parking/outskirts Ilijan terminal. Do not board Alangilan–Batangas Yellow — that goes north.',
    jeepneyColor: undefined,
    alight: 'Monte Maria / Pagkilatan stop on the Dela Paz/Ilijan route',
    fareRegular: 23,
    fareDiscounted: 19,
    etaMin: 45,
    lastMile:
      'Alight at Monte Maria on the Dela Paz/Ilijan route. A short walk to the shrine is usually enough — TNVS is optional, not required.',
    apps: 'TNVS optional for the last few meters; Angkas, Grab, or iDOL Taxi if preferred.',
  },
];

const DOCUMENTED_PAIR_FARES: { a: string[]; b: string[]; regular: number }[] = [
  { a: ['grand terminal'], b: ['sm batangas', 'sm city'], regular: 32 },
  { a: ['pier', 'batangas port', 'ppa'], b: ['sm batangas', 'sm city'], regular: 14 },
  { a: ['sm batangas', 'sm city'], b: ['monte maria', 'montemaria'], regular: 23 },
  { a: ['san isidro', 'san isidro church', 'barangay san isidro'], b: ['monte maria', 'montemaria'], regular: 23 },
  { a: ['barangay sto nino', 'barangay santo nino', 'brgy sto nino'], b: ['monte maria', 'montemaria'], regular: 23 },
  { a: ['pier', 'batangas port', 'ppa', 'batangas pier'], b: ['monte maria', 'montemaria'], regular: 37 },
  { a: ['sm batangas', 'sm city'], b: ['playa montana', 'kay butas'], regular: 60 },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesAlias(haystack: string, aliases: string[]): boolean {
  const n = normalize(haystack);
  return aliases.some((alias) => n.includes(normalize(alias)) || normalize(alias).includes(n));
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function etaMin(distanceKm: number, kmh: number, floor = 5): number {
  return Math.max(floor, Math.round((distanceKm / kmh) * 60));
}

function extractPolylineCoords(geojson: unknown): [number, number][] {
  if (!geojson) return [];

  const convertPoint = (pt: unknown): [number, number] | null => {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const a = Number(pt[0]);
    const b = Number(pt[1]);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    let lat = a;
    let lng = b;
    if (a > 50 && b < 50) {
      lat = b;
      lng = a;
    }
    if (lat < 13.58 || lat > 13.92 || lng < 120.98 || lng > 121.22) return null;
    return [lat, lng];
  };

  if (Array.isArray(geojson)) {
    return geojson.map(convertPoint).filter((p): p is [number, number] => p !== null);
  }

  const obj = geojson as Record<string, unknown>;
  if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
    return obj.features.flatMap((f) => extractPolylineCoords((f as { geometry?: unknown }).geometry ?? f));
  }
  if (obj.type === 'Feature' && obj.geometry) return extractPolylineCoords(obj.geometry);
  if (obj.type === 'LineString' && Array.isArray(obj.coordinates)) {
    return obj.coordinates.map(convertPoint).filter((p): p is [number, number] => p !== null);
  }
  if (obj.type === 'MultiLineString' && Array.isArray(obj.coordinates)) {
    return obj.coordinates.flatMap((line) =>
      Array.isArray(line)
        ? line.map(convertPoint).filter((p): p is [number, number] => p !== null)
        : [],
    );
  }
  return [];
}

const PATH_SERVE_KM = 1.8;
/** Max walk to actually board a jeepney at the origin (stricter at Batangas Pier). */
const BOARD_WALK_KM = 0.5;
const PIER_BOARD_KM = 0.35;

function boardWalkThresholdKm(origin: { label: string; lat?: number; lng?: number } | null): number {
  if (origin && isPierOrigin(origin.label, origin.lat, origin.lng)) return PIER_BOARD_KM;
  return BOARD_WALK_KM;
}

function minDistanceToPathKm(lat: number, lng: number, path: [number, number][]): number | null {
  if (path.length === 0) return null;
  let min = Infinity;
  for (const [pLat, pLng] of path) {
    min = Math.min(min, haversineKm(lat, lng, pLat, pLng));
  }
  return min;
}

/** Downsample long polylines for pairwise transfer search (still checks every uploaded route). */
function downsamplePath(path: [number, number][], maxPoints = 80): [number, number][] {
  if (path.length <= maxPoints) return path;
  const step = Math.ceil(path.length / maxPoints);
  const out: [number, number][] = [];
  for (let i = 0; i < path.length; i += step) out.push(path[i]);
  const last = path[path.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

interface TripRouteMatch {
  route: TransitRoute;
  ends: { from: string; to: string; color?: string };
  path: [number, number][];
  originKm: number | null;
  destKm: number | null;
  servesOrigin: boolean;
  servesDest: boolean;
  boardableAtOrigin: boolean;
  direct: boolean;
  fareNote: string;
  landmarkNames: string[];
}

/** Lower score = better. Used to pick the primary direct jeepney. */
function routeDirectScore(m: TripRouteMatch): number {
  const board = m.originKm ?? 99;
  const alight = m.destKm ?? 99;
  return board * 2 + alight;
}

type BestPlanKind = 'walk' | 'direct' | 'transfer' | 'jeepney_tnvs' | 'tnvs';

interface BestPlanVerdict {
  kind: BestPlanKind;
  summary: string;
  primaryRoutes: string[];
  lines: string[];
}

function buildBestPlanVerdict(
  matches: TripRouteMatch[],
  origin: { lat: number; lng: number; label: string },
  destination: { lat: number; lng: number; label: string },
  transferHint: string | null,
): BestPlanVerdict {
  const straightKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const direct = [...matches.filter((m) => m.direct)].sort((a, b) => routeDirectScore(a) - routeDirectScore(b));

  if (straightKm <= 1.2) {
    const walkMin = Math.max(8, Math.round(straightKm * 14));
    return {
      kind: 'walk',
      summary: `Walk ~${walkMin} min (${straightKm.toFixed(1)} km) — shorter than any jeepney detour`,
      primaryRoutes: direct.slice(0, 2).map((m) => m.route.route_name),
      lines: [
        'BEST PLAN VERDICT (after checking ALL uploaded jeepney routes):',
        `1. Prefer WALK ~${walkMin} min from ${origin.label} to ${destination.label} (${straightKm.toFixed(1)} km).`,
        direct.length
          ? `2. Optional jeepney if needed: ${direct[0].route.route_name} (board ${direct[0].originKm!.toFixed(1)} km from origin). Do NOT detour via SM or Grand Terminal to board.`
          : '2. No useful jeepney for this short hop — walk or TNVS if preferred.',
        'MANDATORY: Do NOT invent a multi-jeepney transfer or SM boarding stop for this short trip.',
      ],
    };
  }

  if (direct.length) {
    const best = direct[0];
    const boardMin = Math.max(2, Math.round((best.originKm ?? 0.1) * 12));
    const alightWalk = Math.max(2, Math.round((best.destKm ?? 0.1) * 12));
    const others = direct.slice(1, 4).map((m) => m.route.route_name);
    return {
      kind: 'direct',
      summary: `ONE jeepney: ${best.route.route_name}`,
      primaryRoutes: direct.map((m) => m.route.route_name),
      lines: [
        'BEST PLAN VERDICT (after checking ALL uploaded jeepney routes):',
        `Winner: DIRECT — ${best.route.route_name} (board ${best.originKm!.toFixed(1)} km from origin, alight ${best.destKm!.toFixed(1)} km from destination).`,
        `Plan: Walk ~${boardMin} min to board → Jeepney ${best.route.route_name} → Walk ~${alightWalk} min to destination.`,
        others.length ? `Also direct (acceptable): ${others.join('; ')}.` : '',
        'MANDATORY: Use ONE jeepney only. Do NOT insert City Hall / Evangelista / Alangilan transfers, Grab last-mile, or SM detours when DIRECT MATCH exists.',
      ].filter(Boolean),
    };
  }

  if (transferHint) {
    return {
      kind: 'transfer',
      summary: 'Two-jeepney transfer (no single route boards at origin AND serves destination)',
      primaryRoutes: [],
      lines: [
        'BEST PLAN VERDICT (after checking ALL uploaded jeepney routes):',
        'No DIRECT MATCH — every route was scored for board-at-origin + serve-destination.',
        'Winner: TWO-JEEPNEY TRANSFER (details below). Prefer that over TNVS unless the traveler asked for Angkas/Grab.',
        'MANDATORY: Follow the transfer steps exactly. Do not invent a fake direct jeepney.',
      ],
    };
  }

  const nearOrigin = matches
    .filter((m) => m.boardableAtOrigin || m.servesOrigin)
    .sort((a, b) => (a.originKm ?? 99) - (b.originKm ?? 99));
  if (nearOrigin.length) {
    return {
      kind: 'jeepney_tnvs',
      summary: `Jeepney ${nearOrigin[0].route.route_name} + walk/TNVS last mile`,
      primaryRoutes: [nearOrigin[0].route.route_name],
      lines: [
        'BEST PLAN VERDICT (after checking ALL uploaded jeepney routes):',
        `No route serves both ends. Best: board ${nearOrigin[0].route.route_name} near origin, ride toward destination side, then walk or TNVS for last mile.`,
      ],
    };
  }

  return {
    kind: 'tnvs',
    summary: 'TNVS door-to-door (no nearby jeepney corridors)',
    primaryRoutes: [],
    lines: [
      'BEST PLAN VERDICT (after checking ALL uploaded jeepney routes):',
      'No jeepney corridor near origin or destination — recommend Angkas / Grab / iDOL Taxi door-to-door.',
    ],
  };
}

function formatAllRoutesAudit(matches: TripRouteMatch[]): string[] {
  const sorted = [...matches].sort((a, b) => {
    if (a.direct !== b.direct) return a.direct ? -1 : 1;
    if (a.boardableAtOrigin !== b.boardableAtOrigin) return a.boardableAtOrigin ? -1 : 1;
    return routeDirectScore(a) - routeDirectScore(b);
  });

  const lines = [
    `ALL-ROUTES AUDIT (${sorted.length} jeepney routes checked against origin AND destination — do not skip any):`,
  ];
  for (const m of sorted) {
    const o = m.originKm != null ? `${m.originKm.toFixed(2)} km` : 'n/a';
    const d = m.destKm != null ? `${m.destKm.toFixed(2)} km` : 'n/a';
    const status = m.direct
      ? 'DIRECT'
      : m.boardableAtOrigin && m.servesDest
        ? 'NEAR-BOTH (not boardable threshold)'
        : m.boardableAtOrigin
          ? 'BOARD-ORIGIN only'
          : m.servesDest
            ? 'SERVES-DEST only'
            : m.servesOrigin
              ? 'NEAR-ORIGIN only'
              : 'OFF-TRIP';
    lines.push(`- ${m.route.route_name}: origin ${o}, dest ${d} → ${status}`);
  }
  lines.push(
    'Decision rule: if ANY route is DIRECT, recommend that one-jeepney plan. Transfers/hubs only when ZERO routes are DIRECT.',
  );
  return lines;
}

function analyzeTripRoutes(
  routes: TransitRoute[],
  fares: JeepneyFare[],
  landmarks: Landmark[],
  origin: { lat?: number; lng?: number; label: string } | null,
  destination: { lat?: number; lng?: number; label: string } | null,
): TripRouteMatch[] {
  return routes.map((route) => {
    const path = extractPolylineCoords(route.geojson_path);
    const ends = parseRouteEnds(route.route_name);
    const originKm =
      origin?.lat != null && origin.lng != null ? minDistanceToPathKm(origin.lat, origin.lng, path) : null;
    const destKm =
      destination?.lat != null && destination.lng != null
        ? minDistanceToPathKm(destination.lat, destination.lng, path)
        : null;
    const boardThreshold = boardWalkThresholdKm(origin);
    const boardableAtOrigin =
      originKm != null ? originKm <= boardThreshold : includesAlias(route.route_name, origin ? [origin.label] : []);
    const servesOrigin =
      originKm != null
        ? originKm < PATH_SERVE_KM
        : includesAlias(route.route_name, origin ? [origin.label] : []);
    const servesDest =
      destKm != null
        ? destKm < PATH_SERVE_KM
        : includesAlias(route.route_name, destination ? [destination.label] : []);
    const landmarkNames = landmarks
      .filter((l) => l.route_id === route.id)
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((l) => l.landmark_name);

    return {
      route,
      ends,
      path,
      originKm,
      destKm,
      servesOrigin,
      servesDest,
      boardableAtOrigin,
      direct: boardableAtOrigin && servesDest,
      fareNote: routeFaresFor(route, fares),
      landmarkNames,
    };
  });
}

/** Shortest walk between two route polylines (routes rarely share the same road). */
function nearestPointsBetweenPaths(
  a: [number, number][],
  b: [number, number][],
): { walkKm: number; onA: [number, number]; onB: [number, number] } | null {
  if (a.length === 0 || b.length === 0) return null;
  let walkKm = Infinity;
  let onA: [number, number] = a[0];
  let onB: [number, number] = b[0];
  for (const [aLat, aLng] of a) {
    for (const [bLat, bLng] of b) {
      const d = haversineKm(aLat, aLng, bLat, bLng);
      if (d < walkKm) {
        walkKm = d;
        onA = [aLat, aLng];
        onB = [bLat, bLng];
      }
    }
  }
  return { walkKm, onA, onB };
}

const MAX_TRANSFER_WALK_KM = 3.5;

function findKnownTransfer(
  origin: { label: string; lat?: number; lng?: number },
  destination: { label: string },
): KnownTransfer | null {
  // CLB is near the pier geographically but is NOT the pier — Balagtas/Alangilan board there directly.
  if (includesAlias(origin.label, ['clb', 'colegio ng lungsod', 'sports coliseum', 'arrieta'])) {
    const pierOnly = KNOWN_TRANSFERS.filter((t) =>
      t.originAliases.some((a) => normalize(a).includes('pier') || normalize(a) === 'ppa'),
    );
    // Skip pier-origin transfers for CLB; continue to match non-pier transfers if any
    for (const transfer of KNOWN_TRANSFERS) {
      if (pierOnly.includes(transfer)) continue;
      if (!includesAlias(destination.label, transfer.destinationAliases)) continue;
      if (includesAlias(origin.label, transfer.originAliases)) return transfer;
    }
    return null;
  }

  for (const transfer of KNOWN_TRANSFERS) {
    if (!includesAlias(destination.label, transfer.destinationAliases)) continue;
    if (includesAlias(origin.label, transfer.originAliases)) return transfer;
    if (origin.lat != null && origin.lng != null) {
      const isPierTransfer = transfer.originAliases.some(
        (a) => normalize(a).includes('pier') || normalize(a) === 'ppa',
      );
      // Pier transfers: only match when origin is actually at the pier (~0.4 km), not CLB (~0.8 km)
      const radiusKm = isPierTransfer ? 0.4 : 1.2;
      const nearOrigin = transfer.originAliases.some((alias) => {
        const point = findPoint(alias);
        return point != null && haversineKm(origin.lat!, origin.lng!, point.lat, point.lng) <= radiusKm;
      });
      if (nearOrigin) return transfer;
    }
  }
  return null;
}

function formatKnownTransfer(
  origin: { label: string; lat?: number; lng?: number },
  destination: { label: string },
): string | null {
  const transfer = findKnownTransfer(origin, destination);
  if (!transfer) return null;
  return [
    'KNOWN COMMUTER TRANSFER (local practice — prefer this over geometric overlap guesses):',
    `- Leg A — Jeepney: ${transfer.leg1Route}. Board at ${transfer.leg1Board}.`,
    `- Alight at ${transfer.alightAt}.`,
    `- Transfer — Walk ~${transfer.walkMin} min: ${transfer.walkTransfer}.`,
    `- Leg B — Jeepney: ${transfer.leg2Route}. Board at ${transfer.leg2Board}.`,
    `- Alight at ${transfer.leg2Alight}.`,
    `- ${transfer.note}`,
  ].join('\n');
}

/** Prefer SM Ilijan parking terminal hub for south-coast trips when origin cannot board Dela Paz directly. */
function inferSmIlijanHubTransfer(
  origin: { label: string; lat?: number; lng?: number },
  destination: { label: string; lat?: number; lng?: number },
  matches: TripRouteMatch[],
): string | null {
  if (!destination?.lat || !isSouthCoastalDestination(destination.label)) return null;
  if (matches.some((m) => m.direct)) return null;
  if (isPierOrigin(origin.label, origin.lat, origin.lng)) return null; // pier has its own known transfer
  if (findKnownTransfer(origin, destination)) return null;

  const delaPaz = matches.find((m) => isSouthCoastalRoute(m.route.route_name) && m.servesDest);
  if (!delaPaz) return null;

  // Origin can board a city route that reaches SM / Ilijan terminal
  const leg1 = matches.find(
    (m) =>
      m.boardableAtOrigin &&
      (normalize(m.route.route_name).includes('libjo') ||
        normalize(m.route.route_name).includes('tabangao') ||
        normalize(m.route.route_name).includes('capitolio') ||
        normalize(m.route.route_name).includes('sta clara') ||
        normalize(m.route.route_name).includes('sorosoro') ||
        normalize(m.route.route_name).includes('balagtas')),
  );
  if (!leg1) return null;

  // Don't invent this hub if Dela Paz is already boardable at origin within ~0.6 km
  if (delaPaz.originKm != null && delaPaz.originKm <= 0.6) return null;

  return [
    'INFERRED SM ILIJAN TERMINAL HUB (local practice — Ilijan/Dela Paz jeepneys load at SM parking/outskirts):',
    `- Leg A — Jeepney: ${leg1.route.route_name}. Board near origin. Ride toward SM City Batangas.`,
    `- Alight at Ilijan Jeepney Terminal — SM City Batangas parking / outskirts (coastal/PPA side).`,
    `- Transfer — Walk ~3–5 min inside SM parking area to the Ilijan jeepney loading bay if needed.`,
    `- Leg B — Jeepney: Dela Paz/Ilijan - Batangas (signboard: Dela Paz, Ilijan, Pagkilatan, Monte Maria). Board at the SM Ilijan terminal.`,
    `- Alight at ${destination.label} / Monte Maria–Pagkilatan coastal stop.`,
    `- Do NOT describe a random Tabangao–Dela Paz roadside transfer when the SM Ilijan terminal hub applies. Do NOT board Alangilan (goes north).`,
  ].join('\n');
}

/** When route data shows no direct boardable match but City Hall → Evangelista → Alangilan fits. */
function inferCityHallHubTransfer(
  origin: { label: string; lat?: number; lng?: number },
  destination: { label: string; lat?: number; lng?: number },
  matches: TripRouteMatch[],
): string | null {
  if (!destination?.lat || !isNorthTerminalDestination(destination.label, destination.lat, destination.lng)) {
    return null;
  }
  if (matches.some((m) => m.direct)) return null;

  const alangilan = matches.find(
    (m) => normalize(m.route.route_name).includes('alangilan') && m.servesDest,
  );
  if (!alangilan) return null;

  const leg1 = isPierOrigin(origin.label, origin.lat, origin.lng)
    ? matches.find((m) => isStaClaraPierRoute(m.route.route_name) && m.boardableAtOrigin)
    : matches.find(
        (m) =>
          m.boardableAtOrigin &&
          (normalize(m.route.route_name).includes('libjo') ||
            normalize(m.route.route_name).includes('san isidro') ||
            normalize(m.route.route_name).includes('sorosoro') ||
            normalize(m.route.route_name).includes('balagtas')),
      );

  if (!leg1) return null;

  const known = findKnownTransfer(origin, { label: destination.label });
  if (known) return null;

  return [
    'INFERRED COMMUTER HUB TRANSFER (from route geometry — City Hall → Evangelista → Alangilan pattern):',
    `- Leg A — Jeepney: ${leg1.route.route_name}. Board at the nearest stop to origin on this corridor.`,
    `- Alight at Batangas City Hall / city-proper (Plaza Mabini area).`,
    `- Transfer — Walk ~4 min to A. Evangelista Street.`,
    `- Leg B — Jeepney: Alangilan - Batangas (Yellow). Board on Evangelista — this corridor serves Grand Terminal and Alangilan/BatStateU.`,
    `- Alight at ${includesAlias(destination.label, ['grand terminal', 'city terminal']) ? 'Batangas City Grand Terminal' : destination.label}.`,
    `- Do NOT use Sta. Clara/Pier alone + TNVS/Grab to Grand Terminal. Do NOT alight at Alangilan junction unless going to BatStateU via a different path.`,
  ].join('\n');
}

function suggestTwoJeepneyTransfer(
  nearOrigin: TripRouteMatch[],
  nearDest: TripRouteMatch[],
  destination: { label: string } | null,
  origin: { label: string; lat?: number; lng?: number } | null,
  allMatches?: TripRouteMatch[],
): string | null {
  const southDest = destination ? isSouthCoastalDestination(destination.label) : false;
  // Check ALL boardable-at-origin routes and ALL dest-serving routes (not just top 5)
  const originPoolRaw = (allMatches ?? nearOrigin).filter((m) => m.boardableAtOrigin || m.servesOrigin);
  const destPoolRaw = (allMatches ?? nearDest).filter((m) => m.servesDest);
  const originPool = southDest
    ? originPoolRaw.filter(
        (m) =>
          !routeWrongForSouthCoastalTrip(
            m.route.route_name,
            destination!.label,
            origin?.label,
            origin?.lat,
            origin?.lng,
          ),
      )
    : originPoolRaw;
  const destPool = southDest
    ? destPoolRaw.filter((m) => isSouthCoastalRoute(m.route.route_name))
    : destPoolRaw;

  if (southDest && destPool.length === 0) return null;
  if (!originPool.length || !destPool.length) return null;

  let best: {
    leg1: TripRouteMatch;
    leg2: TripRouteMatch;
    walkKm: number;
    alightHint: string;
    boardHint: string;
  } | null = null;

  for (const leg1 of originPool) {
    for (const leg2 of destPool) {
      if (leg1.route.id === leg2.route.id) continue;
      if (southDest && origin && isPierOrigin(origin.label, origin.lat, origin.lng) && !leg1.boardableAtOrigin) {
        continue;
      }
      if (
        southDest &&
        routeWrongForSouthCoastalTrip(
          leg1.route.route_name,
          destination!.label,
          origin?.label,
          origin?.lat,
          origin?.lng,
        )
      ) {
        continue;
      }
      const gap = nearestPointsBetweenPaths(downsamplePath(leg1.path), downsamplePath(leg2.path));
      if (gap == null) continue;
      if (!best || gap.walkKm < best.walkKm) {
        best = {
          leg1,
          leg2,
          walkKm: gap.walkKm,
          alightHint: `alight where this route is closest to the second route (~${gap.walkKm.toFixed(1)} km walk to the transfer)`,
          boardHint: `walk to the nearest stop on this route corridor and wait for passing jeepneys`,
        };
      }
    }
  }

  if (!best || best.walkKm > MAX_TRANSFER_WALK_KM) return null;

  const walkTransfer = Math.max(3, Math.round(best.walkKm * 12));
  return [
    `TWO-JEEPNEY TRANSFER (checked all ${originPool.length}×${destPool.length} route pairs — routes do NOT need to overlap):`,
    `- Leg A — Jeepney: ${best.leg1.route.route_name}. Board near origin. Ride toward the transfer side of the corridor, then ${best.alightHint}. Fares: ${best.leg1.fareNote}.`,
    `- Transfer — Walk: ~${walkTransfer} min (~${best.walkKm.toFixed(1)} km) from Leg A alighting point to the nearest stop on Leg B's route line. Routes usually run on different roads; commuters walk to where the second jeepney passes.`,
    `- Leg B — Jeepney: ${best.leg2.route.route_name}. ${best.boardHint}. Ride toward the destination side. Fares: ${best.leg2.fareNote}.`,
    '- Finish with a short walk and/or TNVS if the destination is still off the route.',
  ].join('\n');
}

function formatJeepneyRecommendations(
  matches: TripRouteMatch[],
  origin: { lat?: number; lng?: number; label: string } | null,
  destination: { lat?: number; lng?: number; label: string } | null,
): string[] {
  if (
    origin?.lat == null ||
    origin.lng == null ||
    destination?.lat == null ||
    destination.lng == null
  ) {
    return [];
  }

  const originPoint = { label: origin.label, lat: origin.lat, lng: origin.lng };
  const destinationPoint = {
    label: destination.label,
    lat: destination.lat,
    lng: destination.lng,
  };

  const direct = matches
    .filter((m) => m.direct)
    .sort((a, b) => routeDirectScore(a) - routeDirectScore(b));
  const southDest = destination ? isSouthCoastalDestination(destination.label) : false;
  const fromPier = origin ? isPierOrigin(origin.label, origin.lat, origin.lng) : false;
  const southCoastalWrong = (routeName: string) =>
    routeWrongForSouthCoastalTrip(
      routeName,
      destination!.label,
      origin?.label,
      origin?.lat,
      origin?.lng,
    );
  const nearOrigin = matches
    .filter((m) => m.servesOrigin && !m.servesDest)
    .filter((m) => !southDest || !southCoastalWrong(m.route.route_name))
    .sort((a, b) => (a.originKm ?? 99) - (b.originKm ?? 99));
  const nearDest = matches
    .filter((m) => !m.servesOrigin && m.servesDest)
    .sort((a, b) => (a.destKm ?? 99) - (b.destKm ?? 99));
  const delaPazForSouth = southDest
    ? matches.find((m) => isSouthCoastalRoute(m.route.route_name) && m.servesDest)
    : undefined;

  // Precompute transfer only when no direct — still scans ALL route pairs
  // Prefer documented / SM Ilijan hub over pure geometric overlap for south coast
  let transferBlock: string | null = null;
  if (!direct.length) {
    transferBlock =
      formatKnownTransfer(origin, destination) ||
      inferSmIlijanHubTransfer(origin, destination, matches) ||
      inferCityHallHubTransfer(origin, destination, matches) ||
      suggestTwoJeepneyTransfer(nearOrigin, nearDest, destination, origin, matches);
  }

  const verdict = buildBestPlanVerdict(matches, originPoint, destinationPoint, transferBlock);

  const lines: string[] = [
    'JEEPNEY ROUTING FOR THIS TRIP (from ALL live routes — routes are LOOPS; board at the nearest stop on the route line, NOT necessarily Grand Terminal):',
    ...formatAllRoutesAudit(matches),
    '',
    ...verdict.lines,
    '',
  ];

  const loopNearBoth = matches.filter((m) => m.servesOrigin && m.servesDest && !m.direct);

  if (direct.length) {
    lines.push(
      `DIRECT MATCH: ${direct.length} route(s) you can BOARD at the origin (within ${fromPier ? PIER_BOARD_KM : BOARD_WALK_KM} km walk) AND that pass within ${PATH_SERVE_KM} km of the destination. Ranked best→worst (board walk + alight distance). Use #1 unless traveler prefers another listed direct route:`,
    );
    for (const m of direct) {
      const walkMin = m.originKm != null ? Math.max(2, Math.round(m.originKm * 12)) : null;
      const boardNote =
        fromPier && (m.originKm ?? 99) <= PIER_BOARD_KM
          ? ' Passes beside Batangas Pier — board here.'
          : walkMin != null
            ? ` Walk ~${walkMin} min to board near origin.`
            : '';
      lines.push(
        `- ${m.route.route_name}${m.ends.color ? ` (${m.ends.color})` : ''}: signboard corridor "${m.ends.from}" ↔ "${m.ends.to}". ${m.originKm!.toFixed(1)} km from origin, ${m.destKm!.toFixed(1)} km from destination.${boardNote} Fares: ${m.fareNote}.${m.landmarkNames.length ? ` Stops: ${m.landmarkNames.slice(0, 8).join(', ')}.` : ''}`,
      );
    }
    if (fromPier && loopNearBoth.length) {
      lines.push(
        'NOT BOARDABLE AT PIER (route loop passes near both points on the map, but the jeepney line is NOT beside the pier — do NOT say "board Sorosoro/Balagtas/Libjo at the pier"):',
      );
      for (const m of loopNearBoth.slice(0, 6)) {
        const walkMin = m.originKm != null ? Math.max(5, Math.round(m.originKm * 12)) : null;
        lines.push(
          `- ${m.route.route_name}: ${m.originKm!.toFixed(1)} km from pier (≈${walkMin} min walk inland to corridor) but ${m.destKm!.toFixed(1)} km from destination — good for ALIGHTING downtown, not for boarding at pier.`,
        );
      }
    }
    lines.push(
      'Use the DIRECT MATCH route above. Do NOT send the traveler to Batangas City Grand Terminal, "city terminal", or Plaza Mabini unless the chosen route name explicitly includes that corridor.',
    );

    const misleading = matches.filter(
      (m) => m.servesOrigin && !m.direct && southCoastalWrong(m.route.route_name),
    );
    if (misleading.length && isSouthCoastalDestination(destination.label)) {
      lines.push(
        'WRONG ROUTE for Monte Maria / south coast — do NOT board these even if they are closer to origin (they go toward Batangas City, not Monte Maria):',
      );
      for (const m of misleading.slice(0, 4)) {
        lines.push(
          `- ${m.route.route_name}: ${m.originKm!.toFixed(1)} km from origin but ${m.destKm!.toFixed(1)} km from destination — wrong corridor.`,
        );
      }
    }

    if (isSouthCoastalDestination(destination.label)) {
      lines.push(
        'MONTE MARIA / SOUTH COAST: Dela Paz/Ilijan - Batangas passes San Isidro and serves Monte Maria. Alight at the shrine stop — a short walk is usually enough. Do NOT say jeepneys do not connect when DIRECT MATCH lists Dela Paz/Ilijan. Do NOT recommend TNVS-only unless the traveler asks.',
      );
    }

    lines.push(
      'MANDATORY when DIRECT MATCH / BEST PLAN VERDICT says DIRECT: recommend ONE jeepney only. Never invent City Hall transfers or TNVS last-mile when a DIRECT route is listed.',
    );
  } else {
    lines.push(
      `NO single uploaded route is boardable at origin AND within ${PATH_SERVE_KM} km of destination (after checking all ${matches.length} routes).`,
    );
    if (southDest && fromPier) {
      lines.push(
        'FROM BATANGAS PIER: Dela Paz/Ilijan does NOT pass beside the pier (~2.5 km from the route line). Two jeepney legs: (1) Sta. Clara/Pier - Batangas from the pier (~₱14) to SM City Batangas / Ilijan Jeepney Terminal (parking/outskirts), (2) Dela Paz/Ilijan - Batangas to Monte Maria (~₱23). Do NOT walk from the pier expecting Dela Paz/Ilijan. Do NOT use Libjo/San Isidro or Alangilan junction.',
      );
    } else if (southDest && transferBlock && /SM ILIJAN|Ilijan Jeepney Terminal|KNOWN COMMUTER TRANSFER/i.test(transferBlock)) {
      lines.push(
        'SOUTH COAST / MONTE MARIA via SM: Board Dela Paz/Ilijan at the Ilijan Jeepney Terminal on SM City Batangas parking / outskirts — that is the local loading bay for Ilijan/Dela Paz jeepneys. Get to SM first on a city jeepney (Libjo/Tabangao/Capitolio/Sta. Clara), then transfer there. Do NOT invent a random roadside Tabangao→Dela Paz transfer when the SM terminal applies.',
      );
    } else if (southDest && delaPazForSouth && (delaPazForSouth.originKm ?? 99) <= 0.8) {
      const walkMin = delaPazForSouth.originKm != null ? Math.max(5, Math.round(delaPazForSouth.originKm * 12)) : 8;
      lines.push(
        `SOUTH COAST / MONTE MARIA — Dela Paz/Ilijan is boardable near origin. Walk ~${walkMin} min to that coastal stop, then ONE jeepney to Monte Maria. Do NOT use Libjo/San Isidro or Alangilan for a direct Monte Maria trip.`,
      );
      lines.push(
        `- ${delaPazForSouth.route.route_name}: ${delaPazForSouth.originKm?.toFixed(1) ?? '?'} km from origin, ${delaPazForSouth.destKm!.toFixed(1)} km from destination. Fares: ${delaPazForSouth.fareNote}.`,
      );
    } else if (southDest && delaPazForSouth) {
      lines.push(
        `SOUTH COAST / MONTE MARIA — Dela Paz/Ilijan serves the destination (${delaPazForSouth.destKm!.toFixed(1)} km) but is ${delaPazForSouth.originKm?.toFixed(1) ?? '?'} km from origin (not a short walk to board). Prefer transfer via SM Batangas Ilijan Jeepney Terminal (parking/outskirts) — see transfer steps below.`,
      );
    }
    if (nearOrigin.length) {
      lines.push('NEAR ORIGIN — board one of these, ride toward the destination side, then TNVS/walk for last mile:');
      for (const m of nearOrigin) {
        lines.push(
          `- ${m.route.route_name}${m.ends.color ? ` (${m.ends.color})` : ''}: ${m.originKm!.toFixed(1)} km from origin. Corridor "${m.ends.from}" ↔ "${m.ends.to}". Fares: ${m.fareNote}.`,
        );
      }
    }
    if (southDest) {
      const wrongAtOrigin = matches.filter(
        (m) => m.servesOrigin && southCoastalWrong(m.route.route_name),
      );
      if (wrongAtOrigin.length) {
        lines.push('WRONG FROM ORIGIN for Monte Maria — do NOT board these even if they are closest to the pier/city:');
        for (const m of wrongAtOrigin) {
          lines.push(`- ${m.route.route_name}: goes toward Batangas City, NOT Monte Maria.`);
        }
      }
    }
    if (nearDest.length) {
      lines.push('NEAR DESTINATION — useful for knowing where to alight or for a second leg:');
      for (const m of nearDest) {
        lines.push(
          `- ${m.route.route_name}: ${m.destKm!.toFixed(1)} km from destination. Corridor "${m.ends.from}" ↔ "${m.ends.to}".`,
        );
      }
    }
    if (fromPier && destination && isNorthTerminalDestination(destination.label, destination.lat, destination.lng)) {
      lines.push(
        'PIER → GRAND TERMINAL / ALANGILAN: Sta. Clara/Pier is the only jeepney beside the pier but its route line is ~2.6 km from Grand Terminal — one leg + Grab is NOT optimal. Use KNOWN COMMUTER TRANSFER: Sta. Clara/Pier → City Hall → walk Evangelista St → Alangilan - Batangas → Grand Terminal. Do NOT recommend Grab/TNVS from City Hall unless the traveler requested TNVS.',
      );
    }
    if (!nearOrigin.length && !nearDest.length) {
      lines.push(
        'No uploaded route path is near origin or destination — recommend TNVS (Angkas / Grab / iDOL Taxi) door-to-door from origin.',
      );
    } else if (transferBlock) {
      lines.push(transferBlock);
    } else if (
      destination &&
      isNorthTerminalDestination(destination.label, destination.lat, destination.lng)
    ) {
      lines.push(
        'GRAND TERMINAL / ALANGILAN — try City Hall → Evangelista St → Alangilan - Batangas (Yellow). Many city routes alight near City Hall; Alangilan jeepneys from Evangelista serve Grand Terminal. Do NOT default to TNVS/Grab when this two-jeepney hub pattern applies.',
      );
    } else {
      lines.push(
        'NO WALKABLE TWO-JEEPNEY PAIR within ~3.5 km between route lines — use SINGLE JEEPNEY + TNVS: walk to nearest NEAR ORIGIN stop → ride toward destination → TNVS or walk for last mile.',
      );
    }
  }

  lines.push(
    'MULTI-MODAL: Itineraries may mix Walk + Jeepney + Walk + Jeepney + TNVS + Walk. Two-jeepney trips usually mean: alight from the first jeep → walk to the nearest point on the second route → wait for passing jeepneys (routes rarely share the same road). Use as many numbered legs as needed. Always follow BEST PLAN VERDICT above.',
  );

  return lines;
}

function parseRouteEnds(routeName: string): { from: string; to: string; color?: string } {
  const colorMatch = routeName.match(/\(([^)]+)\)\s*$/);
  const color = colorMatch?.[1]?.trim();
  const core = routeName.replace(/\([^)]*\)\s*$/, '').trim();
  const parts = core.split(/\s*[-–—]\s*/).map((p) => p.trim()).filter(Boolean);
  return { from: parts[0] ?? core, to: parts[1] ?? parts[0] ?? core, color };
}

function extractEmbeddedFares(geojson: Json | null): {
  regular?: number | null;
  discounted?: number | null;
  extraDistance?: number | null;
  extraDistanceDiscounted?: number | null;
} | null {
  if (!geojson || typeof geojson !== 'object' || Array.isArray(geojson)) return null;
  const path = geojson as Record<string, unknown>;
  const fares = (path.fares ?? (path.properties as { fares?: unknown } | undefined)?.fares) as
    | Record<string, number | null>
    | undefined;
  if (!fares || typeof fares !== 'object') return null;
  return {
    regular: fares.regular ?? null,
    discounted: fares.discounted ?? null,
    extraDistance: fares.extraDistance ?? null,
    extraDistanceDiscounted: fares.extraDistanceDiscounted ?? null,
  };
}

function fixCommuteTypos(text: string): string {
  return text
    .replace(/\bmonte\s+aria\b/gi, 'monte maria')
    .replace(/\bmonte\s+marai\b/gi, 'monte maria')
    .replace(/\bmonte\s+mari\b/gi, 'monte maria')
    .replace(/\bpablo\s+borbon\b/gi, 'pablo borbon')
    .replace(/\bbatstate\s*u\b/gi, 'batstateu');
}

function isMonteMariaQuery(text: string): boolean {
  const n = normalize(fixCommuteTypos(text));
  return (
    n === 'monte maria' ||
    n === 'montemaria' ||
    includesAlias(n, ['monte maria', 'montemaria', 'monte maria shrine', 'monte aria', 'monte marai'])
  );
}

function findPoint(query?: string): GeoPoint | null {
  if (!query) return null;
  const n = normalize(fixCommuteTypos(query));
  return (
    KNOWN_POINTS.find((p) => p.aliases.some((a) => n.includes(normalize(a)) || normalize(a).includes(n))) ??
    null
  );
}

function parseTrip(message: string, originHint?: string): { origin?: string; destination?: string; originExplicit: boolean } {
  const text = fixCommuteTypos(message.trim().replace(/[,.?!]+$/g, '').trim());
  const fromTo =
    text.match(/\bfrom\s+(.+?)\s+to\s+(.+?)(?:[?.!]|$)/i) ||
    text.match(/\bfrom\s+(.+?)\s+papunta\s+(?:sa\s+)?(.+?)(?:[?.!]|$)/i);
  if (fromTo) return { origin: fromTo[1].trim(), destination: fromTo[2].trim(), originExplicit: true };

  const toFrom = text.match(
    /\b(?:how (?:do i |to )?get to|how to go to|going to|papunta sa|paano pumunta sa|directions? to)\s+(.+?)\s+from\s+(.+?)(?:[?.!]|$)/i,
  );
  if (toFrom) return { origin: toFrom[2].trim(), destination: toFrom[1].trim(), originExplicit: true };

  // Clarifications: "main campus is in pablo borbon", "it's at Alangilan", "nasa pablo borbon"
  const isInPlace = text.match(
    /\b(?:main\s+campus|campus|destination|it|yun|iyon)\s+(?:is\s+)?(?:in|at|nasa)\s+(.+?)(?:[?.!]|$)/i,
  ) || text.match(/\b(?:nasa|sa)\s+(.+?)(?:\s+campus)?(?:[?.!]|$)/i);
  if (isInPlace) {
    const place = isInPlace[1].trim();
    if (findPoint(place) || place.length >= 4) {
      return { origin: originHint, destination: place, originExplicit: false };
    }
  }

  // Bare place name that is a known landmark (e.g. "pablo borbon", "monte maria")
  const bareKnown = findPoint(text);
  if (bareKnown && text.length <= 60) {
    // If they only typed their current barangay/landmark, they are naming ORIGIN not destination
    const hintN = originHint ? normalize(originHint) : '';
    const placeN = normalize(bareKnown.name);
    const alreadyThere =
      Boolean(hintN) &&
      (hintN.includes(placeN) ||
        placeN.includes(hintN) ||
        bareKnown.aliases.some((a) => hintN.includes(normalize(a)) || normalize(a).includes(hintN)));
    if (alreadyThere) {
      return { origin: originHint, destination: undefined, originExplicit: false };
    }
    return { origin: originHint, destination: bareKnown.name, originExplicit: false };
  }

  // "CLB to pier", "CLB i want to go to Batangas Pier", "CLB papunta sa pier"
  // Do NOT match "how to get to …" or "… i want to use angkas/grab".
  if (!/^\s*(?:how|paano|directions?|going)\b/i.test(text) && !/\bi want to use\b/i.test(text)) {
    const wantTo = text.match(
      /^(.+?)\s+(?:i want(?: to)?(?: go)?(?: to)?|papunta\s+(?:sa\s+)?|to)\s+(.+?)(?:[?.!]|$)/i,
    );
    if (wantTo) {
      const maybeOrigin = wantTo[1].trim().replace(/,\s*$/, '');
      const maybeDest = wantTo[2].trim();
      const destLooksLikeMode = /^(?:use\s+)?(?:angkas|grab|idol|tnvs)\b/i.test(maybeDest);
      const originKnown = findPoint(maybeOrigin) != null || normalize(maybeOrigin).length <= 48;
      if (originKnown && maybeDest.length >= 3 && !destLooksLikeMode) {
        return { origin: maybeOrigin, destination: maybeDest, originExplicit: true };
      }
    }
  }

  const currentLoc = text.match(/\b(?:current location|i(?:'?m| am) (?:at|in)|starting from)\s*[:\-]?\s*(.+?)(?:[,\n]|to\b|$)/i);
  const destOnly =
    text.match(/\b(?:how (?:do i |to )?get to|how to go to|going to|papunta sa|paano pumunta sa|directions? to)\s+(.+?)(?:[?.!]|$)/i) ||
    text.match(/\bto\s+(monte maria|montemaria|sm batangas|grand terminal|ilijan|alangilan|batangas pier|pier)\b/i);

  const knownDest = KNOWN_POINTS.find((p) => {
    const n = normalize(text);
    const name = normalize(p.name);
    if (n === name || n.includes(name)) return true;
    return p.aliases
      .filter((alias) => alias.replace(/\s+/g, '').length >= 5 || alias === 'clb' || alias === 'pier')
      .some((alias) => n === normalize(alias) || n.includes(normalize(alias)));
  });

  const destination =
    destOnly?.[1]?.trim() ||
    knownDest?.name ||
    (isMonteMariaQuery(text) ? 'Monte Maria' : undefined);

  // Origin named at start: "CLB Batangas Pier" or bare origin + known dest elsewhere
  let origin = currentLoc?.[1]?.trim();
  let originExplicit = Boolean(origin);
  if (!origin && destination) {
    const n = normalize(text);
    const destN = normalize(destination);
    for (const p of KNOWN_POINTS) {
      if (p.aliases.some((a) => normalize(a) === destN || normalize(p.name) === destN)) continue;
      if (p.aliases.some((a) => n.startsWith(normalize(a)) || n.includes(normalize(a)))) {
        if (normalize(p.name) !== destN) {
          origin = p.name;
          originExplicit = true;
          break;
        }
      }
    }
  }

  // Hint (From field / GPS label) is a fallback only — not an explicit message origin
  if (!origin && originHint?.trim()) {
    origin = originHint.trim();
  }

  return { origin, destination, originExplicit };
}

function documentedFare(origin: string, destination: string): number | null {
  for (const row of DOCUMENTED_PAIR_FARES) {
    const match =
      (includesAlias(origin, row.a) && includesAlias(destination, row.b)) ||
      (includesAlias(origin, row.b) && includesAlias(destination, row.a));
    if (match) return row.regular;
  }
  return null;
}

function routeFaresFor(route: TransitRoute, fares: JeepneyFare[]): string {
  const embedded = extractEmbeddedFares(route.geojson_path);
  const specific = fares.filter(
    (f) =>
      f.origin_landmark === route.id ||
      normalize(f.origin_landmark) === normalize(route.route_name),
  );
  const standard = specific.find((f) => /standard trip|base fare/i.test(f.destination_landmark));
  const extended = specific.find((f) => /extended trip|extra distance/i.test(f.destination_landmark));
  const regular = embedded?.regular ?? standard?.regular_fare;
  const discounted = embedded?.discounted ?? standard?.discounted_fare;
  const extra = embedded?.extraDistance ?? extended?.regular_fare;
  const extraDisc = embedded?.extraDistanceDiscounted ?? extended?.discounted_fare;
  const bits: string[] = [];
  if (regular != null) bits.push(`standard ₱${regular}${discounted != null ? ` (discounted ₱${discounted})` : ''}`);
  if (extra != null) bits.push(`extended ₱${extra}${extraDisc != null ? ` (discounted ₱${extraDisc})` : ''}`);
  return bits.length ? bits.join('; ') : 'fare not set in admin';
}

async function loadLiveData() {
  const [routesRes, faresRes, placesRes, landmarksRes] = await Promise.allSettled([
    supabase.from('transit_routes').select('*').order('route_name'),
    supabase.from('jeepney_fare_matrix').select('*'),
    supabase.from('places').select('id, name, category, latitude, longitude, description'),
    supabase.from('route_landmarks').select('*'),
  ]);

  const unwrap = <T,>(result: PromiseSettledResult<{ data: T[] | null; error: { message: string } | null }>, label: string): T[] => {
    if (result.status === 'rejected') {
      console.warn(`[transitContext] ${label} failed:`, result.reason);
      return [];
    }
    if (result.value.error) {
      console.warn(`[transitContext] ${label}:`, result.value.error.message);
      return [];
    }
    return result.value.data ?? [];
  };

  return {
    routes: unwrap(routesRes, 'transit_routes') as TransitRoute[],
    fares: unwrap(faresRes, 'jeepney_fare_matrix') as JeepneyFare[],
    places: unwrap(placesRes, 'places') as Pick<Place, 'id' | 'name' | 'category' | 'latitude' | 'longitude' | 'description'>[],
    landmarks: unwrap(landmarksRes, 'route_landmarks') as Landmark[],
  };
}

function resolveNamedPlace(
  query: string | undefined,
  places: { name: string; latitude: number; longitude: number }[],
): { label: string; lat?: number; lng?: number } | null {
  const known = findPoint(query);
  if (known) return { label: known.name, lat: known.lat, lng: known.lng };
  if (!query) return null;
  const n = normalize(query);
  let best: { name: string; latitude: number; longitude: number } | null = null;
  let bestLen = 0;
  for (const p of places) {
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') continue;
    const pn = normalize(p.name);
    if (pn.includes(n) || n.includes(pn)) {
      if (pn.length > bestLen) {
        best = p;
        bestLen = pn.length;
      }
    }
  }
  if (best) return { label: best.name, lat: best.latitude, lng: best.longitude };
  return { label: query };
}

function findPlaceInText(
  text: string,
  places: { name: string; latitude: number; longitude: number }[],
): string | undefined {
  const n = normalize(fixCommuteTypos(text));
  if (n.length < 5) return undefined;

  let bestName: string | undefined;
  let bestLen = 0;
  for (const p of places) {
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') continue;
    const pn = normalize(p.name);
    if (pn.length < 5) continue;
    if (n === pn || n.includes(pn) || pn.includes(n)) {
      if (pn.length > bestLen) {
        bestLen = pn.length;
        bestName = p.name;
      }
    }
  }
  return bestName;
}

function resolveDestination(
  message: string,
  parsedDestination: string | undefined,
  places: { name: string; latitude: number; longitude: number }[],
): { label: string; lat?: number; lng?: number } | null {
  const fixedMessage = fixCommuteTypos(message);
  const fromParse = resolveNamedPlace(parsedDestination, places);
  if (fromParse?.lat != null) return fromParse;

  const fromMessage = findPlaceInText(fixedMessage, places);
  if (fromMessage) {
    const matched = resolveNamedPlace(fromMessage, places);
    if (matched?.lat != null) return matched;
  }

  if (isMonteMariaQuery(fixedMessage)) {
    return resolveNamedPlace('Monte Maria', places);
  }

  if (parsedDestination) return fromParse;
  return null;
}

export async function buildTransitBriefing(
  message: string,
  location: ChatLocationContext = {},
): Promise<string> {
  const live = await loadLiveData().catch((err) => {
    console.error('Failed to load transit data for AI:', err);
    return { routes: [], fares: [], places: [], landmarks: [] };
  });

  const hasGps =
    typeof location.originLat === 'number' &&
    Number.isFinite(location.originLat) &&
    typeof location.originLng === 'number' &&
    Number.isFinite(location.originLng);

  const tnvsPreference = wantsTnvsPreference(message);
  const parsed = parseTrip(message, location.origin);

  // 1. Resolve Destination using 3-step rule (DB POI -> geocode -> isInBatangas)
  let destination: { label: string; lat?: number; lng?: number; outOfBounds?: boolean } | null = null;
  const legacyDest = resolveDestination(message, parsed.destination, live.places);
  if (legacyDest?.lat != null && legacyDest?.lng != null) {
    destination = { label: legacyDest.label, lat: legacyDest.lat, lng: legacyDest.lng, outOfBounds: false };
  } else if (parsed.destination?.trim() || legacyDest?.label) {
    const rawDestQuery = parsed.destination?.trim() || legacyDest?.label || '';
    const res = await resolveLocation(rawDestQuery, { places: live.places });
    destination = {
      label: res.label,
      lat: res.lat ?? undefined,
      lng: res.lng ?? undefined,
      outOfBounds: res.outOfBounds,
    };
  }

  // 2. Resolve Origin using 3-step rule (Exact GPS -> DB POI -> geocode -> isInBatangas)
  let origin: { label: string; lat?: number; lng?: number; outOfBounds?: boolean } | null = null;
  let originAssumed = false;

  const originQuery = parsed.originExplicit
    ? parsed.origin
    : (location.origin?.trim() || parsed.origin);

  if (hasGps && (!parsed.originExplicit || /^(my location|your current location|current location|here)$/i.test(originQuery || ''))) {
    if (!isInBatangas(location.originLat!, location.originLng!)) {
      origin = {
        label: location.origin || 'Your location',
        lat: location.originLat,
        lng: location.originLng,
        outOfBounds: true,
      };
    } else {
      const gps = await resolveGpsOrigin(
        location.originLat!,
        location.originLng!,
        live.places,
        location.origin,
      );
      // Exact GPS priority: raw coordinates preserved
      origin = { label: gps.label, lat: location.originLat, lng: location.originLng, outOfBounds: false };
    }
  } else if (originQuery) {
    const res = await resolveLocation(originQuery, {
      rawLat: hasGps ? location.originLat : undefined,
      rawLng: hasGps ? location.originLng : undefined,
      places: live.places,
    });
    origin = {
      label: res.label,
      lat: res.lat ?? undefined,
      lng: res.lng ?? undefined,
      outOfBounds: res.outOfBounds,
    };
  } else if (hasGps) {
    if (!isInBatangas(location.originLat!, location.originLng!)) {
      origin = { label: 'Your location', lat: location.originLat, lng: location.originLng, outOfBounds: true };
    } else {
      const gps = await resolveGpsOrigin(
        location.originLat!,
        location.originLng!,
        live.places,
        location.origin,
      );
      origin = { label: gps.label, lat: location.originLat, lng: location.originLng, outOfBounds: false };
    }
  }

  if (destination?.lat != null && !origin && !destination.outOfBounds) {
    origin = { label: 'SM City Batangas', lat: 13.7594, lng: 121.0722, outOfBounds: false };
    originAssumed = true;
  }

  // 3. Strict Out of Bounds Rejection
  if (origin?.outOfBounds) {
    return [
      `RESOLVED ORIGIN: ${origin.label} (OUT OF BOUNDS — outside Batangas City)`,
      destination ? `RESOLVED DESTINATION: ${destination.label}` : 'RESOLVED DESTINATION: unknown',
      '',
      `LOCATION WARNING: Starting point "${origin.label}" is outside Batangas City. LACVAY only provides public transit guides within Batangas City. Please specify a location inside Batangas City.`,
    ].join('\n');
  }

  if (destination?.outOfBounds) {
    return [
      origin ? `RESOLVED ORIGIN: ${origin.label}` : 'RESOLVED ORIGIN: unknown',
      `RESOLVED DESTINATION: ${destination.label} (OUT OF BOUNDS — outside Batangas City)`,
      '',
      `LOCATION WARNING: Destination "${destination.label}" is outside Batangas City. LACVAY only provides public transit guides within Batangas City. Please specify a destination inside Batangas City.`,
    ].join('\n');
  }

  if (!destination || destination.lat == null || destination.lng == null) {
    return [
      origin ? `RESOLVED ORIGIN: ${origin.label}${origin.lat != null ? ` (${origin.lat.toFixed(4)}, ${origin.lng?.toFixed(4)})` : ''}` : 'RESOLVED ORIGIN: unknown',
      destination ? `RESOLVED DESTINATION: ${destination.label} (no coordinates on file)` : 'RESOLVED DESTINATION: unknown — ask where they want to go.',
    ].join('\n');
  }

  if (!origin || origin.lat == null || origin.lng == null) {
    return [
      'RESOLVED ORIGIN: unknown — ask where they are starting from.',
      `RESOLVED DESTINATION: ${destination.label} (${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)})`,
    ].join('\n');
  }

  const originPt = { label: origin.label, lat: origin.lat, lng: origin.lng };
  const destPt = { label: destination.label, lat: destination.lat, lng: destination.lng };

  if (tnvsPreference.requested) {
    const app =
      tnvsPreference.app === 'angkas'
        ? 'Angkas'
        : tnvsPreference.app === 'grab'
          ? 'Grab'
          : tnvsPreference.app === 'idol'
            ? 'iDOL Taxi'
            : 'TNVS';
    return [
      `RESOLVED ORIGIN: ${origin.label} (${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)})`,
      `RESOLVED DESTINATION: ${destination.label} (${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)})`,
      '',
      `TRAVELER REQUESTED TNVS (${app}):`,
      'SELECTED COMMUTE PLAN:',
      `1. **Walk / Tricycle** — Walk to the pickup location at ${origin.label}.`,
      `2. **TNVS** — Book ${app} door-to-door from ${origin.label} to ${destination.label}. Fare shown in app.`,
      `3. **Walk** — Walk to the entrance of ${destination.label}.`,
    ].join('\n');
  }

  const tripRoutes = analyzeTripRoutes(live.routes, live.fares, live.landmarks, origin, destination);
  const matchesInput: RouteMatchInput[] = tripRoutes.map((m) => ({
    route: { id: m.route.id, route_name: m.route.route_name, vehicle_type: m.route.vehicle_type },
    ends: m.ends,
    path: m.path,
    originKm: m.originKm,
    destKm: m.destKm,
    servesOrigin: m.servesOrigin,
    servesDest: m.servesDest,
    direct: m.direct,
    fareNote: m.fareNote,
    landmarkNames: m.landmarkNames,
    fares: parseFareNoteNumbers(m.fareNote),
  }));

  const itinerary = buildOptimizedItinerary(originPt, destPt, matchesInput);

  const steps: string[] = [];
  const originStreet = streetHintForLabel(origin.label);
  const destStreet = streetHintForLabel(destination.label);
  if (itinerary && itinerary.legs.length) {
    const isTransfer = itinerary.planType === 'transfer';
    itinerary.legs.forEach((leg, index) => {
      const stepNum = index + 1;
      const nextJeepney = itinerary.legs.slice(index + 1).find((l) => l.mode === 'jeepney');

      if (leg.mode === 'walk') {
        const title =
          index === 0
            ? 'Walk / Tricycle'
            : leg.title === 'Transfer Walk' || (isTransfer && nextJeepney)
              ? 'Transfer Walk'
              : 'Walk';
        let detail = leg.summary.replace(/\*\*/g, '');
        if (index === 0 && originStreet && !detail.includes(originStreet)) {
          detail += ` Head toward **${originStreet}** where jeepneys pass.`;
        }
        if (index === itinerary.legs.length - 1 && destStreet && !detail.includes(destStreet)) {
          detail += ` Continue on **${destStreet}** to reach ${destination.label}.`;
        }
        steps.push(`${stepNum}. **${title}** — ${detail.endsWith('.') ? detail : `${detail}.`}`);
      } else if (leg.mode === 'tnvs') {
        steps.push(`${stepNum}. **Tricycle / TNVS** — ${leg.summary.replace(/\*\*/g, '')}.`);
      } else if (leg.mode === 'jeepney') {
        const matched = tripRoutes.find(
          (r) => r.route.route_name.toLowerCase() === leg.routeName?.toLowerCase(),
        );
        const color = matched?.ends.color ? ` (${matched.ends.color})` : '';
        const fare = leg.fareRegular != null ? ` Fare: ₱${leg.fareRegular}.` : '';
        const corridor = matched
          ? ` Corridor: ${matched.ends.from} ↔ ${matched.ends.to}.`
          : '';
        const boardHint =
          index === 0 && originStreet
            ? ` From **${originStreet}**, walk to where this route passes (often 200–300 m), wait roadside, flag signboard **${leg.routeName}**.`
            : ` Wait roadside and flag signboard **${leg.routeName}**.`;
        if (nextJeepney) {
          const alightHint = ` Get off at the nearest safe stop where you can reach the **${nextJeepney.routeName}** line (see **Transfer Walk** next).`;
          steps.push(
            `${stepNum}. **Jeepney** — Board **${leg.routeName ?? 'jeepney'}**${color}.${boardHint}${corridor}${alightHint}${fare}`,
          );
        } else {
          const alightHint = destStreet
            ? ` Alight on **${destStreet}** or the nearest stop to ${destination.label}, then finish on foot if needed.`
            : ` Alight at the nearest stop to ${destination.label}.`;
          steps.push(
            `${stepNum}. **Jeepney** — Board **${leg.routeName ?? 'jeepney'}**${color}.${boardHint}${corridor}${alightHint}${fare}`,
          );
        }
      }
    });
  }

  const winningJeepneys = itinerary?.legs.filter((l) => l.mode === 'jeepney') ?? [];
  const winningDetails = winningJeepneys.map((j) => {
    const matched = tripRoutes.find(
      (r) => r.route.route_name.toLowerCase() === j.routeName?.toLowerCase(),
    );
    return matched
      ? `- Winning Route: ${matched.route.route_name}${matched.ends.color ? ` (${matched.ends.color})` : ''}\n  Board Corridor: ${matched.ends.from} ↔ ${matched.ends.to}\n  Fares: ${matched.fareNote}`
      : `- Winning Route: ${j.routeName}`;
  });

  const otherDirect = tripRoutes
    .filter(
      (m) =>
        m.direct &&
        !winningJeepneys.some((w) => w.routeName?.toLowerCase() === m.route.route_name.toLowerCase()),
    )
    .map((m) => m.route.route_name);

  const sections = [
    `RESOLVED ORIGIN: ${origin.label} (${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)})`,
    `RESOLVED DESTINATION: ${destination.label} (${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)})`,
    '',
    ...COMMUTER_DETAIL_RULES,
    '',
    formatStreetAtlas(),
    '',
    'SELECTED ROUTE DETAILS:',
    winningDetails.length ? winningDetails.join('\n') : `- Mode: ${itinerary?.planType ?? 'direct'}`,
    otherDirect.length ? `- Alternative Direct Routes: ${otherDirect.join(', ')}` : '',
    '',
    'SELECTED COMMUTE PLAN:',
    ...steps,
    '',
    'COMMUTE STEPS:',
    ...steps,
  ];

  return sections.filter(Boolean).join('\n');
}

export type OdPlanType = 'direct' | 'transfer' | 'corridor' | 'tnvs' | 'partial' | 'unknown';

export interface OdAnalysisResult {
  origin: { label: string; lat: number; lng: number };
  destination: { label: string; lat: number; lng: number };
  planType: OdPlanType;
  directRoutes: string[];
  nearOriginRoutes: string[];
  nearDestRoutes: string[];
  hasKnownTransfer: boolean;
  hasKnownCorridor: boolean;
  documentedFare: number | null;
  distanceKm: number;
  briefing: string;
  warnings: string[];
}

function classifyOdPlan(
  matches: TripRouteMatch[],
  briefing: string,
  hasKnownTransfer: boolean,
  hasKnownCorridor: boolean,
): OdPlanType {
  if (hasKnownCorridor) return 'corridor';
  if (matches.some((m) => m.direct)) return 'direct';
  if (
    hasKnownTransfer ||
    briefing.includes('TWO-JEEPNEY TRANSFER') ||
    briefing.includes('Transfer Walk')
  ) return 'transfer';
  const servesAny = matches.some((m) => m.servesOrigin || m.servesDest);
  if (!servesAny && briefing.includes('TNVS')) return 'tnvs';
  if (servesAny) return 'partial';
  return 'unknown';
}

function auditBriefingWarnings(
  briefing: string,
  origin: { label: string; lat: number; lng: number },
  destination: { label: string; lat: number; lng: number },
): string[] {
  const warnings: string[] = [];
  if (!briefing.includes('RESOLVED ORIGIN:')) warnings.push('missing RESOLVED ORIGIN');
  if (!briefing.includes('RESOLVED DESTINATION:')) warnings.push('missing RESOLVED DESTINATION');
  if (!briefing.match(/RESOLVED DESTINATION: .+\(\d+\.\d+, \d+\.\d+\)/)) {
    warnings.push('destination coordinates not resolved');
  }
  if (isPierOrigin(origin.label, origin.lat, origin.lng) && isSouthCoastalDestination(destination.label)) {
    const positiveGuidance = briefing
      .split('\n')
      .filter((line) => !/\bdo not\b|\bdon't\b/i.test(line))
      .join('\n');
    if (
      /walk\s+to\s+(?:the\s+)?dela\s+paz\/ilijan\s+(?:jeepney\s+)?stop\s+(?:on\s+the\s+coastal\s+road\s+)?near\s+(?:batangas\s+)?pier|walk\s+from\s+(?:the\s+)?(?:batangas\s+)?pier\s+(?:area\s+)?(?:to\s+)?(?:catch\s+)?dela\s+paz/i.test(
        positiveGuidance,
      )
    ) {
      warnings.push('incorrect pier → walk to Dela Paz/Ilijan near pier');
    }
  }
  if (briefing.includes('|') && briefing.includes('---')) {
    warnings.push('briefing contains markdown table syntax');
  }
  return warnings;
}

/** Route matches for an already-resolved OD pair (used to build map guide plans). */
export async function getRouteMatchesForPoints(
  origin: { label: string; lat: number; lng: number },
  destination: { label: string; lat: number; lng: number },
): Promise<
  Array<{
    route: { id: string; route_name: string; vehicle_type: string };
    ends: { from: string; to: string; color?: string };
    path: [number, number][];
    originKm: number | null;
    destKm: number | null;
    servesOrigin: boolean;
    servesDest: boolean;
    direct: boolean;
    fareNote: string;
    landmarkNames: string[];
    fares: {
      regular?: number | null;
      discounted?: number | null;
      extended?: number | null;
      extendedDiscounted?: number | null;
    };
  }>
> {
  const live = await loadLiveData().catch(() => ({
    routes: [] as TransitRoute[],
    fares: [] as JeepneyFare[],
    places: [] as Pick<Place, 'id' | 'name' | 'category' | 'latitude' | 'longitude' | 'description'>[],
    landmarks: [] as Landmark[],
  }));

  const matches = analyzeTripRoutes(live.routes, live.fares, live.landmarks, origin, destination);
  return matches.map((m) => ({
    route: {
      id: m.route.id,
      route_name: m.route.route_name,
      vehicle_type: m.route.vehicle_type,
    },
    ends: m.ends,
    path: m.path,
    originKm: m.originKm,
    destKm: m.destKm,
    servesOrigin: m.servesOrigin,
    servesDest: m.servesDest,
    direct: m.direct,
    fareNote: m.fareNote,
    landmarkNames: m.landmarkNames,
    fares: parseFareNoteNumbers(m.fareNote),
  }));
}

function parseFareNoteNumbers(fareNote: string): {
  regular?: number | null;
  discounted?: number | null;
  extended?: number | null;
  extendedDiscounted?: number | null;
} {
  const standard = fareNote.match(/(?:standard|regular)\s*₱\s*(\d+)/i);
  const discounted = fareNote.match(/discounted\s*₱\s*(\d+)/i);
  const extended = fareNote.match(/extended\s*₱\s*(\d+)/i);
  const extendedDisc = fareNote.match(/extended[^;]*discounted\s*₱\s*(\d+)/i);
  return {
    regular: standard ? Number(standard[1]) : null,
    discounted: discounted ? Number(discounted[1]) : null,
    extended: extended ? Number(extended[1]) : null,
    extendedDiscounted: extendedDisc ? Number(extendedDisc[1]) : null,
  };
}

/** Simulate / analyze any Batangas City origin–destination pair for routing QA. */
export async function analyzeOdPair(
  origin: { label: string; lat: number; lng: number },
  destination: { label: string; lat: number; lng: number },
): Promise<OdAnalysisResult> {
  const message = `from ${origin.label} to ${destination.label}`;
  const live = await loadLiveData().catch(() => ({
    routes: [] as TransitRoute[],
    fares: [] as JeepneyFare[],
    places: [] as Pick<Place, 'id' | 'name' | 'category' | 'latitude' | 'longitude' | 'description'>[],
    landmarks: [] as Landmark[],
  }));

  const originPt = { label: origin.label, lat: origin.lat, lng: origin.lng };
  const destPt = { label: destination.label, lat: destination.lat, lng: destination.lng };
  const matches = analyzeTripRoutes(live.routes, live.fares, live.landmarks, originPt, destPt);
  const briefing = await buildTransitBriefing(message);
  const hasKnownTransfer = briefing.includes('KNOWN COMMUTER TRANSFER');
  const hasKnownCorridor = briefing.includes('KNOWN LOCAL ITINERARY');

  const directRoutes = matches.filter((m) => m.direct).map((m) => m.route.route_name);
  const nearOriginRoutes = matches.filter((m) => m.servesOrigin && !m.direct).map((m) => m.route.route_name);
  const nearDestRoutes = matches.filter((m) => m.servesDest && !m.direct).map((m) => m.route.route_name);

  return {
    origin: originPt,
    destination: destPt,
    planType: classifyOdPlan(matches, briefing, hasKnownTransfer, hasKnownCorridor),
    directRoutes,
    nearOriginRoutes,
    nearDestRoutes,
    hasKnownTransfer,
    hasKnownCorridor,
    documentedFare: documentedFare(origin.label, destination.label),
    distanceKm: haversineKm(origin.lat, origin.lng, destination.lat, destination.lng),
    briefing,
    warnings: auditBriefingWarnings(briefing, originPt, destPt),
  };
}
