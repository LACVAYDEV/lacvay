const GEO_LAT_KEY = 'lacvay-geo-lat';
const GEO_LNG_KEY = 'lacvay-geo-lng';
const GEO_LABEL_KEY = 'lacvay-geo-label';
export const GEO_ORIGIN_MANUAL_KEY = 'lacvay-ai-origin-manual';
export const GEO_EVENT = 'lacvay-geo';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface UserGeo {
  lat: number;
  lng: number;
  label: string;
}

let inflight: Promise<UserGeo | null> | null = null;

function persist(geo: UserGeo) {
  try {
    sessionStorage.setItem(GEO_LAT_KEY, String(geo.lat));
    sessionStorage.setItem(GEO_LNG_KEY, String(geo.lng));
    sessionStorage.setItem(GEO_LABEL_KEY, geo.label);
    if (sessionStorage.getItem(GEO_ORIGIN_MANUAL_KEY) !== '1') {
      sessionStorage.setItem('lacvay-ai-origin', geo.label);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(GEO_EVENT, { detail: geo }));
}

export function getStoredGeo(): UserGeo | null {
  try {
    const lat = Number(sessionStorage.getItem(GEO_LAT_KEY));
    const lng = Number(sessionStorage.getItem(GEO_LNG_KEY));
    const label = sessionStorage.getItem(GEO_LABEL_KEY)?.trim() ?? '';
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !label) return null;
    return { lat, lng, label };
  } catch {
    return null;
  }
}

async function reverseLabel(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/geo/reverse?lat=${lat}&lng=${lng}`);
    if (!res.ok) return 'Your current location';
    const data = (await res.json()) as { label?: string };
    return data.label?.trim() || 'Your current location';
  } catch {
    return 'Your current location';
  }
}

function readPosition(): Promise<GeolocationPosition | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30_000 },
    );
  });
}

function metersBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function watchUserLocation(): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return () => undefined;
  }

  let lastReverse = getStoredGeo();
  const id = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const movedFar =
        !lastReverse || metersBetween(lastReverse.lat, lastReverse.lng, lat, lng) > 120;

      if (!movedFar && lastReverse) {
        persist({ lat, lng, label: lastReverse.label });
        return;
      }

      if (movedFar) {
        try {
          sessionStorage.removeItem(GEO_ORIGIN_MANUAL_KEY);
        } catch {
          /* ignore */
        }
      }

      if (lastReverse && movedFar) {
        persist({ lat, lng, label: 'Updating location…' });
      }

      void reverseLabel(lat, lng).then((label) => {
        lastReverse = { lat, lng, label };
        persist(lastReverse);
      });
    },
    () => undefined,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10_000 },
  );

  return () => navigator.geolocation.clearWatch(id);
}

export function requestUserLocation(): Promise<UserGeo | null> {
  if (inflight) return inflight;

  inflight = (async () => {
    const position = await readPosition();
    if (!position) return null;
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const label = await reverseLabel(lat, lng);
    const geo = { lat, lng, label };
    persist(geo);
    return geo;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
