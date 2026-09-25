import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { GEO_EVENT, getStoredGeo, requestUserLocation, type UserGeo } from '@/lib/userLocation';

const DISMISS_KEY = 'lacvay-geo-dismissed';

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function LocationPermissionBar() {
  const [geo, setGeo] = useState<UserGeo | null>(() => getStoredGeo());
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const onGeo = (event: Event) => {
      const next = (event as CustomEvent<UserGeo>).detail;
      if (next?.lat != null) setGeo(next);
    };
    window.addEventListener(GEO_EVENT, onGeo);

    let cancelled = false;
    void (async () => {
      const existing = getStoredGeo();
      if (existing) {
        setGeo(existing);
        return;
      }
      setAsking(true);
      const result = await requestUserLocation();
      if (cancelled) return;
      setAsking(false);
      if (result) setGeo(result);
      else if (typeof navigator !== 'undefined' && navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') setDenied(true);
        } catch {
          /* Permissions API not available for geolocation */
        }
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(GEO_EVENT, onGeo);
    };
  }, []);

  const visible = !geo && !dismissed;

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 border-b border-lacvay-green/10 bg-lacvay-blush px-4 py-2.5 text-sm text-lacvay-green-dark md:px-6 lg:px-7">
      <MapPin className="h-4 w-4 shrink-0 text-lacvay-green" />
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        {denied
          ? 'Location is blocked in your browser. Enable it for this site so jeepney directions can start from where you are.'
          : asking
            ? 'Allow location so LACVAY can start directions from where you are.'
            : 'Allow location so the AI does not need to ask where you currently are.'}
      </p>
      <button
        type="button"
        onClick={() => {
          void (async () => {
            setAsking(true);
            const result = await requestUserLocation();
            setAsking(false);
            if (result) {
              setGeo(result);
              setDenied(false);
            } else {
              setDenied(true);
            }
          })();
        }}
        disabled={asking}
        className="shrink-0 rounded-full bg-lacvay-green px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-soft hover:bg-lacvay-green-dark disabled:opacity-70"
      >
        {asking ? 'Asking…' : 'Allow location'}
      </button>
      <button
        type="button"
        aria-label="Dismiss location prompt"
        onClick={() => {
          try {
            sessionStorage.setItem(DISMISS_KEY, '1');
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lacvay-green/70 hover:bg-lacvay-green/10 hover:text-lacvay-green"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
