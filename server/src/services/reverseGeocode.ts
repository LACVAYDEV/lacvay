export interface ResolvedOrigin {
  label: string;
  lat: number;
  lng: number;
  kind: 'landmark' | 'street' | 'barangay' | 'coords' | 'hub' | 'poi' | 'geocoded' | 'unknown';
  outOfBounds?: boolean;
}

/** Batangas City bounding box — reject points that land in the bay or off-map. */
export const BATANGAS_BOUNDS = {
  minLat: 13.58,
  maxLat: 13.92,
  minLng: 120.98,
  maxLng: 121.22,
};

export function isInBatangas(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= BATANGAS_BOUNDS.minLat &&
    lat <= BATANGAS_BOUNDS.maxLat &&
    lng >= BATANGAS_BOUNDS.minLng &&
    lng <= BATANGAS_BOUNDS.maxLng
  );
}

export interface HubPoint {
  label: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export const HUB_POINTS: HubPoint[] = [
  { label: 'SM City Batangas', lat: 13.7594, lng: 121.0722, aliases: ['sm batangas', 'sm city', 'sm city batangas', 'sm'] },
  { label: 'Batangas City Grand Terminal', lat: 13.7818, lng: 121.0543, aliases: ['grand terminal', 'city terminal', 'batangas terminal', 'batangas grand terminal'] },
  { label: 'Batangas Pier', lat: 13.754, lng: 121.043, aliases: ['pier', 'batangas pier', 'ppa', 'port of batangas', 'port'] },
  { label: 'Ilijan Jeepney Terminal (near SM Batangas)', lat: 13.7578, lng: 121.0708, aliases: ['ilijan terminal', 'ilijan jeepney', 'sm parking', 'ilijan jeepney terminal', 'ilijan'] },
  { label: 'Monte Maria', lat: 13.6422, lng: 121.0465, aliases: ['monte maria', 'montemaria', 'montemaria shrine', 'shrine'] },
  { label: 'Barangay Sto. Niño', lat: 13.699, lng: 121.0941, aliases: ['sto nino', 'santo nino', 'barangay sto', 'brgy sto', 'barangay sto nino'] },
  { label: 'San Isidro Labrador Parish Church', lat: 13.7333, lng: 121.0769, aliases: ['san isidro', 'san isidro church', 'san isidro parish', 'san isidro labrador'] },
  { label: 'Minor Basilica of the Immaculate Conception', lat: 13.7544708430939, lng: 121.059210109643, aliases: ['basilica', 'minor basilica', 'immaculate conception'] },
  { label: 'Plaza Mabini', lat: 13.7555009303031, lng: 121.05905733848, aliases: ['plaza mabini', 'mabini plaza', 'plaza'] },
  { label: 'BatStateU Pablo Borbon Main Campus (Alangilan)', lat: 13.786, lng: 121.074, aliases: ['alangilan', 'pablo borbon', 'batstateu', 'main campus', 'bsu alangilan'] },
  { label: 'Batangas City Hall', lat: 13.75578, lng: 121.05833, aliases: ['city hall', 'batangas city hall'] },
  { label: 'Colegio ng Lungsod ng Batangas (CLB)', lat: 13.7539, lng: 121.05, aliases: ['clb', 'colegio', 'sports coliseum', 'arrieta'] },
  { label: 'A. Evangelista Street', lat: 13.75786, lng: 121.05735, aliases: ['evangelista', 'a evangelista', 'evangelista street'] },
];

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
  // Step 1: Exact GPS Priority & Batangas bounds check
  if (!isInBatangas(lat, lng)) {
    return {
      label: clientLabel?.trim() || 'Your location (Outside Batangas City)',
      lat,
      lng,
      kind: 'coords',
      outOfBounds: true,
    };
  }

  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached) return { ...cached, lat, lng, outOfBounds: false };

  const atLandmark = exactLandmark(lat, lng) ?? exactPlace(lat, lng, places);
  if (atLandmark) {
    const res: ResolvedOrigin = { ...atLandmark, lat, lng, outOfBounds: false };
    cache.set(key, res);
    return res;
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
    const res: ResolvedOrigin = { ...fromOsm, lat, lng, outOfBounds: false };
    cache.set(key, res);
    return res;
  }

  const photon = await fetchJson(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
  const fromPhotonResult =
    photon && typeof photon === 'object'
      ? fromPhoton(photon as Record<string, unknown>, lat, lng)
      : null;
  if (fromPhotonResult) {
    const res: ResolvedOrigin = { ...fromPhotonResult, lat, lng, outOfBounds: false };
    cache.set(key, res);
    return res;
  }

  const trimmed = clientLabel?.trim() ?? '';

  if (trimmed && trimmed.length > 3 && !GENERIC_ORIGIN.test(trimmed)) {
    const explicitLandmark = EXACT_LANDMARKS.find(l => 
      l.name.toLowerCase() === trimmed.toLowerCase() || 
      l.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (explicitLandmark) {
      const res: ResolvedOrigin = { label: explicitLandmark.name, lat: explicitLandmark.lat, lng: explicitLandmark.lng, kind: 'landmark', outOfBounds: false };
      cache.set(key, res);
      return res;
    }
    
    const explicitPlace = places.find(p => 
      p.name.toLowerCase() === trimmed.toLowerCase() || 
      p.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (explicitPlace) {
      const res: ResolvedOrigin = { label: explicitPlace.name, lat: explicitPlace.latitude, lng: explicitPlace.longitude, kind: 'landmark', outOfBounds: false };
      cache.set(key, res);
      return res;
    }
  }

  if (
    trimmed &&
    !GENERIC_ORIGIN.test(trimmed) &&
    clientLabelMatchesCoords(trimmed, lat, lng, places)
  ) {
    const fallback: ResolvedOrigin = {
      label: normalizeLandmarkLabel(trimmed, lat, lng),
      lat,
      lng,
      kind: 'coords' as const,
      outOfBounds: false,
    };
    cache.set(key, fallback);
    return fallback;
  }

  const coords: ResolvedOrigin = {
    label: 'Your current location',
    lat,
    lng,
    kind: 'coords' as const,
    outOfBounds: false,
  };
  cache.set(key, coords);
  return coords;
}

export async function forwardGeocode(
  query: string,
): Promise<{ label: string; lat: number; lng: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const qWithBatangas = encodeURIComponent(`${trimmed}, Batangas, Philippines`);
    let data = await fetchJson(
      `https://nominatim.openstreetmap.org/search?q=${qWithBatangas}&format=jsonv2&limit=1&addressdetails=1`,
      { 'User-Agent': NOMINATIM_UA, Accept: 'application/json' },
    );
    if (!Array.isArray(data) || data.length === 0) {
      const qRaw = encodeURIComponent(`${trimmed}, Philippines`);
      data = await fetchJson(
        `https://nominatim.openstreetmap.org/search?q=${qRaw}&format=jsonv2&limit=1&addressdetails=1`,
        { 'User-Agent': NOMINATIM_UA, Accept: 'application/json' },
      );
    }
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0] as Record<string, unknown>;
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const displayName =
          typeof item.display_name === 'string'
            ? item.display_name.split(',')[0].trim()
            : trimmed;
        return { label: displayName || trimmed, lat, lng };
      }
    }
  } catch {
    // fallback to photon
  }

  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=1&lat=13.7565&lon=121.0583`;
    const photonData = (await fetchJson(photonUrl)) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { name?: string; street?: string; city?: string };
      }>;
    } | null;
    if (photonData?.features && photonData.features.length > 0) {
      const feat = photonData.features[0];
      const coords = feat.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const name = feat.properties?.name || feat.properties?.street || trimmed;
          return { label: name, lat, lng };
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export interface PlacePoi {
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
}

export interface ResolvedLocation {
  label: string;
  lat: number | null;
  lng: number | null;
  kind: 'coords' | 'hub' | 'poi' | 'geocoded' | 'landmark' | 'street' | 'barangay' | 'unknown';
  outOfBounds: boolean;
}

/**
 * 3-Step Location Rule:
 * 1. Exact GPS Priority: Raw GPS coordinates are used exactly (never snapped or altered).
 * 2. Database POI Matching: Typed text checked against places (restaurants/tourist spots) and HUB_POINTS.
 * 3. Strict Batangas Geofencing: Custom unknown text geocoded and checked against BATANGAS_BOUNDS.
 *    If outside, rejected with outOfBounds: true.
 */
export async function resolveLocation(
  query?: string,
  opts: {
    rawLat?: number;
    rawLng?: number;
    places?: PlacePoi[];
  } = {},
): Promise<ResolvedLocation> {
  const { rawLat, rawLng, places = [] } = opts;
  const trimmed = query?.trim() ?? '';

  // 1. EXACT GPS PRIORITY:
  // If the frontend passes raw GPS coordinates, use those exact lat/lng values.
  // Do not override them with a snapped street name if coordinates are valid.
  if (
    typeof rawLat === 'number' &&
    Number.isFinite(rawLat) &&
    typeof rawLng === 'number' &&
    Number.isFinite(rawLng) &&
    rawLat !== 0 &&
    rawLng !== 0
  ) {
    if (!isInBatangas(rawLat, rawLng)) {
      return {
        label: trimmed || 'Your location (Outside Batangas City)',
        lat: rawLat,
        lng: rawLng,
        kind: 'coords',
        outOfBounds: true,
      };
    }

    const isGenericOrigin =
      !trimmed ||
      /^(your current location|current location|my location|here|gps)$/i.test(trimmed);

    if (isGenericOrigin) {
      const rev = await resolveGpsOrigin(rawLat, rawLng, places, trimmed);
      return {
        label: rev.label || 'Your current location',
        lat: rawLat, // EXACT GPS preserved
        lng: rawLng, // EXACT GPS preserved
        kind: 'coords',
        outOfBounds: false,
      };
    }

    return {
      label: trimmed,
      lat: rawLat, // EXACT GPS preserved
      lng: rawLng, // EXACT GPS preserved
      kind: 'coords',
      outOfBounds: false,
    };
  }

  if (!trimmed) {
    return {
      label: 'Unknown location',
      lat: null,
      lng: null,
      kind: 'unknown',
      outOfBounds: false,
    };
  }

  // 3-STEP LOCATION RULE:
  // Check explicit non-Batangas cities / areas first so queries like "SM Lipa"
  // or "Bauan Market" are not falsely matched to Batangas hubs or places.
  const normQuery = normalizePlaceToken(trimmed);
  const nonBatangasCities = [
    'manila', 'makati', 'quezon city', 'pasig', 'taguig', 'mandaluyong', 'cebu', 'davao',
    'lipa', 'tanauan', 'sto tomas', 'santo tomas', 'tagaytay', 'bauan', 'san jose', 'alitagtag',
    'cuenca', 'rosario', 'san juan', 'taysan', 'lobo', 'mabini', 'tingloy', 'nasugbu', 'calatagan',
  ];
  const isExplicitNonBatangas =
    !normQuery.includes('plaza mabini') &&
    nonBatangasCities.some((c) => {
      const regex = new RegExp(`\\b${c}\\b`, 'i');
      return regex.test(normQuery);
    });

  if (isExplicitNonBatangas) {
    return {
      label: trimmed,
      lat: null,
      lng: null,
      kind: 'unknown',
      outOfBounds: true,
    };
  }

  // 2. DATABASE POI MATCHING:
  // If the user types a text string, first check it against our places table (Restaurants and Tourist Spots)
  // and our known HUB_POINTS. If it matches, use the exact coordinates from the database.
  // Check known HUB_POINTS
  for (const hub of HUB_POINTS) {
    const normHub = normalizePlaceToken(hub.label);
    const matchesLabel =
      normQuery === normHub ||
      (normQuery.length >= 4 && normHub.includes(normQuery)) ||
      (normHub.length >= 4 && normQuery.includes(normHub));

    const matchesAlias = hub.aliases.some((a) => {
      const na = normalizePlaceToken(a);
      if (normQuery === na) return true;
      if (normQuery.length >= 3 && na.length >= 3) {
        return normQuery.includes(na) || na.includes(normQuery);
      }
      return false;
    });

    if (matchesLabel || matchesAlias) {
      return {
        label: hub.label,
        lat: hub.lat,
        lng: hub.lng,
        kind: 'hub',
        outOfBounds: false,
      };
    }
  }

  // Check places table (Restaurants & Tourist Spots)
  let bestPlace: PlacePoi | null = null;
  let bestPlaceLen = 0;
  for (const p of places) {
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') continue;
    const np = normalizePlaceToken(p.name);
    if (!np) continue;
    const isMatch =
      normQuery === np ||
      (normQuery.length >= 4 && np.includes(normQuery)) ||
      (np.length >= 4 && normQuery.includes(np));
    if (isMatch && np.length > bestPlaceLen) {
      bestPlace = p;
      bestPlaceLen = np.length;
    }
  }

  if (bestPlace) {
    return {
      label: bestPlace.name,
      lat: bestPlace.latitude,
      lng: bestPlace.longitude,
      kind: 'poi',
      outOfBounds: false,
    };
  }

  // 3. STRICT BATANGAS GEOFENCING:
  // If the typed text is an unknown custom string, geocode it. However, you MUST pass the resulting
  // coordinates through the isInBatangas check (using BATANGAS_BOUNDS).
  // If the coordinates fall outside Batangas City, reject the point entirely and return a specific
  // "out of bounds" flag so the AI can tell the user it is unsupported. Do not plot it.
  const geocoded = await forwardGeocode(trimmed);
  if (geocoded) {
    if (!isInBatangas(geocoded.lat, geocoded.lng)) {
      return {
        label: geocoded.label || trimmed,
        lat: geocoded.lat,
        lng: geocoded.lng,
        kind: 'geocoded',
        outOfBounds: true,
      };
    }

    return {
      label: geocoded.label || trimmed,
      lat: geocoded.lat,
      lng: geocoded.lng,
      kind: 'geocoded',
      outOfBounds: false,
    };
  }

  return {
    label: trimmed,
    lat: null,
    lng: null,
    kind: 'unknown',
    outOfBounds: false,
  };
}
