// Primary transit color definitions and GeoJSON route path helpers for Lacvay

export interface TransitColorOption {
  label: string;
  hex: string;
  bgClass: string;
  textClass: string;
  isWhite: boolean;
}

export const PRIMARY_TRANSIT_COLORS: TransitColorOption[] = [
  { label: 'Yellow', hex: '#EAB308', bgClass: 'bg-[#EAB308]', textClass: 'text-black', isWhite: false },
  { label: 'Green', hex: '#16A34A', bgClass: 'bg-[#16A34A]', textClass: 'text-white', isWhite: false },
  { label: 'Red', hex: '#DC2626', bgClass: 'bg-[#DC2626]', textClass: 'text-white', isWhite: false },
  { label: 'Blue', hex: '#2563EB', bgClass: 'bg-[#2563EB]', textClass: 'text-white', isWhite: false },
  { label: 'Orange', hex: '#EA580C', bgClass: 'bg-[#EA580C]', textClass: 'text-white', isWhite: false },
  { label: 'White', hex: '#FFFFFF', bgClass: 'bg-white', textClass: 'text-black', isWhite: true },
];

export function isWhiteColor(hex?: string | null): boolean {
  if (!hex) return false;
  const upper = hex.trim().toUpperCase();
  return upper === '#FFFFFF' || upper === '#FFF' || upper === 'WHITE';
}

export function getTransitColorMeta(hex?: string | null): TransitColorOption {
  if (!hex) return PRIMARY_TRANSIT_COLORS[0];
  const upper = hex.trim().toUpperCase();
  if (isWhiteColor(upper)) return PRIMARY_TRANSIT_COLORS[5];

  const found = PRIMARY_TRANSIT_COLORS.find(
    (c) => c.hex.toUpperCase() === upper || c.label.toUpperCase() === upper,
  );
  if (found) return found;

  return {
    label: hex,
    hex,
    bgClass: '',
    textClass: 'text-white',
    isWhite: false,
  };
}

/**
 * Fallback polyline coordinates across central Batangas City landmarks
 * (Grand Terminal -> P. Burgos -> Minor Basilica -> SM City Batangas)
 */
export const DEFAULT_BATANGAS_ROUTE_PATH: [number, number][] = [
  [13.7818, 121.0543], // Batangas Grand Terminal / Diversion
  [13.7745, 121.0572], // Diversion Rd intersection
  [13.7650, 121.0558], // Balagtas towards proper
  [13.7578, 121.0579], // Rizal Ave / P. Burgos
  [13.7548, 121.0583], // Plaza Mabini / Minor Basilica
  [13.7522, 121.0620], // P. Burgos East
  [13.7562, 121.0685], // Towards SM Batangas
  [13.7594, 121.0722], // SM City Batangas
];

/**
 * Parses coordinates from GeoJSON LineString / MultiLineString / FeatureCollection.
 * Leaflet requires [latitude, longitude] pairs.
 */
export function extractPolylineCoords(geojson: unknown): [number, number][] {
  if (!geojson) return [];

  // Helper to validate and convert [lng, lat] to [lat, lng]
  const convertPoint = (pt: unknown): [number, number] | null => {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const a = Number(pt[0]);
    const b = Number(pt[1]);
    if (isNaN(a) || isNaN(b)) return null;

    // In GeoJSON: [longitude, latitude]. Batangas lat is ~13.7, lng is ~121.0
    let lat = a;
    let lng = b;
    if (a > 50 && b < 50) {
      lat = b;
      lng = a;
    }

    // Drop points outside Batangas City (often ferry / open-water geometry)
    if (lat < 13.58 || lat > 13.92 || lng < 120.98 || lng > 121.22) return null;
    return [lat, lng];
  };

  const obj = geojson as Record<string, any>;

  // Case 1: Simple array of coordinates
  if (Array.isArray(obj)) {
    const res: [number, number][] = [];
    for (const item of obj) {
      const p = convertPoint(item);
      if (p) res.push(p);
    }
    return res;
  }

  // Case 2: FeatureCollection
  if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
    const coords: [number, number][] = [];
    for (const f of obj.features) {
      coords.push(...extractPolylineCoords(f.geometry || f));
    }
    return coords;
  }

  // Case 3: Feature
  if (obj.type === 'Feature' && obj.geometry) {
    return extractPolylineCoords(obj.geometry);
  }

  // Case 4: LineString
  if (obj.type === 'LineString' && Array.isArray(obj.coordinates)) {
    const coords: [number, number][] = [];
    for (const pt of obj.coordinates) {
      const p = convertPoint(pt);
      if (p) coords.push(p);
    }
    return coords;
  }

  // Case 5: MultiLineString
  if (obj.type === 'MultiLineString' && Array.isArray(obj.coordinates)) {
    const coords: [number, number][] = [];
    for (const line of obj.coordinates) {
      if (Array.isArray(line)) {
        for (const pt of line) {
          const p = convertPoint(pt);
          if (p) coords.push(p);
        }
      }
    }
    return coords;
  }

  return [];
}
