export interface ResolvedOrigin {
  label: string;
  lat: number;
  lng: number;
  kind: 'landmark' | 'street' | 'barangay' | 'coords';
}

interface NamedLandmark {
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
}

const BRGY_STO_NINO = { lat: 13.699, lng: 121.0941, radiusM: 3500 };
const STO_NINO_CHAPEL = { lat: 13.6422, lng: 121.046, radiusM: 800 };

const EXACT_LANDMARKS: NamedLandmark[] = [
  { name: 'Barangay Sto. Niño', lat: BRGY_STO_NINO.lat, lng: BRGY_STO_NINO.lng, radiusM: BRGY_STO_NINO.radiusM },
  { name: 'Ilijan Jeepney Terminal (SM Batangas parking / outskirts)', lat: 13.7578, lng: 121.0708, radiusM: 120 },
  { name: 'SM City Batangas', lat: 13.7594, lng: 121.0722, radiusM: 180 },
  { name: 'Monte Maria', lat: 13.6422, lng: 121.0465, radiusM: 200 },
  { name: 'Sto. Niño Chapel – Monte Maria', lat: 13.6422, lng: 121.046, radiusM: 250 },
  { name: 'San Isidro Labrador Parish Church', lat: 13.7333, lng: 121.0769, radiusM: 120 },
  { name: 'Batangas City Grand Terminal', lat: 13.7818, lng: 121.0543, radiusM: 150 },
  { name: 'BatStateU Pablo Borbon Main Campus (Alangilan)', lat: 13.786, lng: 121.074, radiusM: 250 },
  { name: 'Alangilan', lat: 13.786, lng: 121.074, radiusM: 400 },
  { name: 'Batangas Pier', lat: 13.754, lng: 121.043, radiusM: 150 },
  { name: 'Colegio ng Lungsod ng Batangas (CLB)', lat: 13.7539, lng: 121.05, radiusM: 200 },
  { name: 'Minor Basilica', lat: 13.7565, lng: 121.0583, radiusM: 90 },
];

const NOMINATIM_UA = 'LACVAY-Travel/1.0 (Batangas City commute assistant)';
const cache = new Map<string, ResolvedOrigin>();
const PLACE_SNAP_M = 150;
const GENERIC_ORIGIN = /^(your current location|sm batangas|sm city batangas|near\s+)/i;
const OSM_LANDMARK_TYPES = new Set([
  'mall',
  'department_store',
  'bus_station',
  'ferry_terminal',
  'university',
  'college',
  'hospital',
  'cathedral',
  'chapel',
  'place_of_worship',
  'shrine',
  'theme_park',
  'stadium',
  'airport',
  'townhall',
  'marketplace',
  'park',
]);

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}

function titleCase(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .replace(/\b(N|S|E|W|Ne|Nw|Se|Sw)\b/gi, (m) => m.toUpperCase());
}

function stripBarangayPrefix(value: string): string {
  return value.replace(/^(barangay|brgy\.?|bgy\.?)\s+/i, '').trim();
}

function formatBarangay(value: string): string {
  const core = stripBarangayPrefix(value);
  if (!core) return '';
  if (/^poblacion/i.test(core)) return titleCase(core);
  return `Barangay ${titleCase(core)}`;
}

function pickRoad(address: Record<string, string | undefined>): string | undefined {
  const road =
    address.road ||
    address.pedestrian ||
    address.residential ||
    address.street ||
    address.footway ||
    address.path ||
    address.cycleway;
  if (!road) return undefined;
  if (/unnamed|unknown|track|service/i.test(road)) return undefined;
  return road;
}

function pickBarangay(address: Record<string, string | undefined>): string | undefined {
  const city = address.city || address.municipality;
  const neighbourhood = address.neighbourhood || address.quarter;
  const suburb = address.suburb || address.village || address.hamlet || address.city_district;
  const specific = neighbourhood || suburb;
  if (!specific || isGenericPlaceName(specific)) return undefined;
  if (city && specific.toLowerCase() === city.toLowerCase()) return undefined;

  if (
    neighbourhood &&
    suburb &&
    neighbourhood.toLowerCase() !== suburb.toLowerCase() &&
    /^(barangay|brgy\.?)?\s*\d+/i.test(stripBarangayPrefix(neighbourhood))
  ) {
    return `${formatBarangay(neighbourhood)}, ${titleCase(stripBarangayPrefix(suburb))}`;
  }

  return specific;
}

function isGenericPlaceName(name: string): boolean {
  return /^(philippines|calabarzon|batangas( city)?|luzon)$/i.test(name.trim());
}

async function fetchJson(url: string, headers?: Record<string, string>): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isNamedWorshipSite(name: string): boolean {
  return /chapel|church|shrine|parish|basilica|cathedral/i.test(name);
}

function normalizePlaceToken(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

function isStoNinoBarangayName(name: string): boolean {
  const n = normalizePlaceToken(name);
  return (
    n === 'sto nino' ||
    n === 'santo nino' ||
    n === 'barangay sto nino' ||
    n === 'barangay santo nino' ||
    n === 'brgy sto nino' ||
    n === 'brgy santo nino'
  );
}

function resolveStoNinoLabel(name: string, lat: number, lng: number): string {
  if (/chapel|shrine|monte maria/i.test(name)) {
    return 'Sto. Niño Chapel – Monte Maria';
  }
  const nearChapel = haversineM(lat, lng, STO_NINO_CHAPEL.lat, STO_NINO_CHAPEL.lng) <= STO_NINO_CHAPEL.radiusM;
  const nearBrgy = haversineM(lat, lng, BRGY_STO_NINO.lat, BRGY_STO_NINO.lng) <= BRGY_STO_NINO.radiusM;
  if (nearChapel && !nearBrgy) return 'Sto. Niño Chapel – Monte Maria';
  if (nearBrgy && !nearChapel) return 'Barangay Sto. Niño';
  if (nearChapel && nearBrgy) {
    return haversineM(lat, lng, STO_NINO_CHAPEL.lat, STO_NINO_CHAPEL.lng) <
      haversineM(lat, lng, BRGY_STO_NINO.lat, BRGY_STO_NINO.lng)
      ? 'Sto. Niño Chapel – Monte Maria'
      : 'Barangay Sto. Niño';
  }
  if (isStoNinoBarangayName(name) || /barangay|brgy/i.test(name)) {
    return 'Barangay Sto. Niño';
  }
  return name;
}

function normalizeLandmarkLabel(name: string, lat: number, lng: number): string {
  if (/santo nino|sto\.?\s*nino/i.test(name)) {
    return resolveStoNinoLabel(name, lat, lng);
  }
  return name;
}

function fromNominatim(data: Record<string, unknown>, lat: number, lng: number): ResolvedOrigin | null {
  const address = (data.address ?? {}) as Record<string, string | undefined>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const osmType = typeof data.type === 'string' ? data.type : '';
  const addresstype = typeof data.addresstype === 'string' ? data.addresstype : '';

  const village = address.village || address.suburb || address.neighbourhood || address.hamlet;
  if (village && isStoNinoBarangayName(village)) {
    return { label: 'Barangay Sto. Niño', lat, lng, kind: 'barangay' };
  }

  if (name && !isGenericPlaceName(name) && isNamedWorshipSite(name)) {
    return { label: normalizeLandmarkLabel(name, lat, lng), lat, lng, kind: 'landmark' };
  }

  const road = pickRoad(address) || (addresstype === 'road' && name ? name : undefined);
  const house = address.house_number?.trim();
  const barangay = pickBarangay(address);
  const barangayLabel = barangay ? formatBarangay(barangay) : '';

  if (name && !isGenericPlaceName(name) && OSM_LANDMARK_TYPES.has(osmType) && !road) {
    return { label: name, lat, lng, kind: 'landmark' };
  }

  if (name && !isGenericPlaceName(name) && OSM_LANDMARK_TYPES.has(osmType) && road) {
    const atNamedMall = /mall|terminal|basilica|university|pier|port|shrine|chapel|church|parish/i.test(name);
    if (atNamedMall) {
      return { label: name, lat, lng, kind: 'landmark' };
    }
  }

  if (road) {
    const street = house ? `${house} ${titleCase(road)}` : titleCase(road);
    const brgy = barangayLabel && isStoNinoBarangayName(barangayLabel) ? 'Barangay Sto. Niño' : barangayLabel;
    return {
      label: brgy ? `${street}, ${brgy}` : street,
      lat,
      lng,
      kind: 'street',
    };
  }

  if (barangayLabel) {
    const label = isStoNinoBarangayName(barangayLabel) ? 'Barangay Sto. Niño' : barangayLabel;
    return { label, lat, lng, kind: 'barangay' };
  }

  if (name && !isGenericPlaceName(name) && OSM_LANDMARK_TYPES.has(osmType)) {
    return { label: name, lat, lng, kind: 'landmark' };
  }

  return null;
}

function fromPhoton(data: Record<string, unknown>, lat: number, lng: number): ResolvedOrigin | null {
  const features = data.features as
    | { properties?: Record<string, string | undefined> }[]
    | undefined;
  const props = features?.[0]?.properties;
  if (!props) return null;

  const osmValue = props.osm_value ?? '';
  const name = props.name?.trim() ?? '';
  const road = props.street || (props.osm_key === 'highway' && name ? name : undefined);
  const house = props.housenumber;
  const barangayRaw = props.district || props.neighbourhood || props.locality;
  const barangayLabel =
    barangayRaw && !isGenericPlaceName(barangayRaw) ? formatBarangay(barangayRaw) : '';

  if (name && !isGenericPlaceName(name) && OSM_LANDMARK_TYPES.has(osmValue) && !road) {
    return { label: name, lat, lng, kind: 'landmark' };
  }

  if (road && !isGenericPlaceName(road)) {
    const street = house ? `${house} ${titleCase(road)}` : titleCase(road);
    return {
      label: barangayLabel ? `${street}, ${barangayLabel}` : street,
      lat,
      lng,
      kind: 'street',
    };
  }

  if (barangayLabel) {
    return { label: barangayLabel, lat, lng, kind: 'barangay' };
  }

  return null;
}

function exactLandmark(lat: number, lng: number): ResolvedOrigin | null {
  let best: NamedLandmark | null = null;
  let bestM = Infinity;
  for (const place of EXACT_LANDMARKS) {
    const meters = haversineM(lat, lng, place.lat, place.lng);
    if (meters <= place.radiusM && meters < bestM) {
      best = place;
      bestM = meters;
    }
  }
  return best
    ? { label: normalizeLandmarkLabel(best.name, lat, lng), lat, lng, kind: 'landmark' }
    : null;
}

function exactPlace(
  lat: number,
  lng: number,
  places: { name: string; latitude: number; longitude: number }[],
): ResolvedOrigin | null {
  let best: { name: string } | null = null;
  let bestM = PLACE_SNAP_M;
  for (const place of places) {
    const meters = haversineM(lat, lng, place.latitude, place.longitude);
    if (meters <= PLACE_SNAP_M && meters < bestM) {
      best = place;
      bestM = meters;
    }
  }
  return best
    ? { label: normalizeLandmarkLabel(best.name, lat, lng), lat, lng, kind: 'landmark' }
    : null;
}

function clientLabelMatchesCoords(
  label: string,
  lat: number,
  lng: number,
  places: { name: string; latitude: number; longitude: number }[],
): boolean {
  const trimmed = label.trim();
  if (!trimmed || GENERIC_ORIGIN.test(trimmed)) return true;

  if (/san isidro/i.test(trimmed) && haversineM(lat, lng, BRGY_STO_NINO.lat, BRGY_STO_NINO.lng) <= BRGY_STO_NINO.radiusM) {
    return false;
  }
  if (/sto\.?\s*nino|santo nino/i.test(trimmed) && haversineM(lat, lng, BRGY_STO_NINO.lat, BRGY_STO_NINO.lng) <= BRGY_STO_NINO.radiusM) {
    return !/san isidro/i.test(trimmed);
  }

  for (const place of places) {
    const n = trimmed.toLowerCase();
    const pn = place.name.toLowerCase();
    if (n.includes(pn) || pn.includes(n)) {
      return haversineM(lat, lng, place.latitude, place.longitude) <= PLACE_SNAP_M;
    }
  }

  for (const place of EXACT_LANDMARKS) {
    const n = trimmed.toLowerCase();
    const pn = place.name.toLowerCase();
    if (n.includes(pn) || pn.includes(n)) {
      return haversineM(lat, lng, place.lat, place.lng) <= place.radiusM;
    }
  }

  return true;
}

export async function resolveGpsOrigin(
  lat: number,
  lng: number,
  places: { name: string; latitude: number; longitude: number }[] = [],
  clientLabel?: string,
): Promise<ResolvedOrigin> {
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached) return { ...cached, lat, lng };

  const atLandmark = exactLandmark(lat, lng) ?? exactPlace(lat, lng, places);
  if (atLandmark) {
    cache.set(key, atLandmark);
    return atLandmark;
  }

  const nominatim = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&zoom=18`,
    { 'User-Agent': NOMINATIM_UA, Accept: 'application/json' },
  );
  const fromOsm =
    nominatim && typeof nominatim === 'object'
      ? fromNominatim(nominatim as Record<string, unknown>, lat, lng)
      : null;
  if (fromOsm) {
    cache.set(key, fromOsm);
    return fromOsm;
  }

  const photon = await fetchJson(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
  const fromPhotonResult =
    photon && typeof photon === 'object'
      ? fromPhoton(photon as Record<string, unknown>, lat, lng)
      : null;
  if (fromPhotonResult) {
    cache.set(key, fromPhotonResult);
    return fromPhotonResult;
  }

  const trimmed = clientLabel?.trim() ?? '';
  if (
    trimmed &&
    !GENERIC_ORIGIN.test(trimmed) &&
    clientLabelMatchesCoords(trimmed, lat, lng, places)
  ) {
    const fallback = { label: normalizeLandmarkLabel(trimmed, lat, lng), lat, lng, kind: 'coords' as const };
    cache.set(key, fallback);
    return fallback;
  }

  const coords = { label: 'Your current location', lat, lng, kind: 'coords' as const };
  cache.set(key, coords);
  return coords;
}
