import { Router } from 'express';
import { resolveGpsOrigin } from '../services/reverseGeocode.js';
import { supabase } from '../services/supabase.js';

export const geoRouter = Router();

async function loadPlaceSnapPoints() {
  const { data } = await supabase
    .from('places')
    .select('name, latitude, longitude');
  return (data ?? []).filter(
    (p): p is { name: string; latitude: number; longitude: number } =>
      typeof p.latitude === 'number' && typeof p.longitude === 'number',
  );
}

geoRouter.get('/reverse', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Invalid coordinates' });
    return;
  }

  try {
    const places = await loadPlaceSnapPoints();
    const origin = await resolveGpsOrigin(lat, lng, places);
    res.json(origin);
  } catch {
    res.status(502).json({ error: 'Could not reverse-geocode location' });
  }
});
