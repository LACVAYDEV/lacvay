import 'dotenv/config';
import { supabase } from '../src/services/supabase.js';

const PIER = { lat: 13.754, lng: 121.043 };
const ACOSTA = { lat: 13.758966822164, lng: 121.059363209643 };
const TERMINAL = { lat: 13.7818, lng: 121.0543 };
const CITY_HALL = { lat: 13.75578, lng: 121.05833 };
const EVANGELISTA = { lat: 13.75786, lng: 121.05735 };

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function extractCoords(geojson: unknown): [number, number][] {
  const pts: [number, number][] = [];
  const walk = (obj: unknown): void => {
    if (!obj) return;
    if (Array.isArray(obj) && obj.length >= 2 && typeof obj[0] === 'number') {
      const a = obj[0];
      const b = obj[1];
      pts.push([a > 50 ? b : a, a > 50 ? a : b]);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    const o = obj as Record<string, unknown>;
    if (o.type === 'LineString' && Array.isArray(o.coordinates)) o.coordinates.forEach(walk);
    if (o.type === 'MultiLineString' && Array.isArray(o.coordinates)) {
      o.coordinates.flat().forEach(walk);
    }
    if (o.type === 'Feature' && o.geometry) walk(o.geometry);
    if (o.type === 'FeatureCollection' && Array.isArray(o.features)) {
      o.features.forEach((f) => walk((f as { geometry?: unknown }).geometry));
    }
  };
  walk(geojson);
  return pts;
}

function minDist(lat: number, lng: number, path: [number, number][]): number {
  let m = Infinity;
  for (const [a, b] of path) m = Math.min(m, haversine(lat, lng, a, b));
  return m;
}

const { data: routes, error } = await supabase.from('transit_routes').select('route_name,geojson_path');
if (error) throw error;

const target = process.argv[2] === 'terminal' ? TERMINAL : ACOSTA;
const targetName = process.argv[2] === 'terminal' ? 'Grand Terminal' : 'Acosta';

console.log(`Route                          | Pier (board) | ${targetName} | City Hall | Evangelista | Notes`);
console.log('-'.repeat(100));
for (const r of routes ?? []) {
  const path = extractCoords(r.geojson_path);
  const pierKm = minDist(PIER.lat, PIER.lng, path);
  const destKm = minDist(target.lat, target.lng, path);
  const hallKm = minDist(CITY_HALL.lat, CITY_HALL.lng, path);
  const evKm = minDist(EVANGELISTA.lat, EVANGELISTA.lng, path);
  const boardNote =
    pierKm <= 0.35 ? 'BOARD AT PIER' : pierKm <= 1.8 ? `walk ~${Math.max(2, Math.round(pierKm * 12))} min` : 'not near pier';
  const servesDest = destKm <= 1.8 ? 'serves dest' : '';
  console.log(
    `${r.route_name.padEnd(30)} | ${pierKm.toFixed(2).padStart(5)} km   | ${destKm.toFixed(2).padStart(5)} km | ${hallKm.toFixed(2).padStart(5)} km | ${evKm.toFixed(2).padStart(5)} km | ${boardNote} ${servesDest}`,
  );
}
