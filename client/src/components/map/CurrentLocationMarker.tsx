import { useEffect, useState } from 'react';
import { CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { GEO_EVENT, getStoredGeo, requestUserLocation, watchUserLocation, type UserGeo } from '@/lib/userLocation';

const userLocationIcon = L.divIcon({
  className: 'lacvay-user-location-icon',
  html: '<span class="lacvay-user-pulse"></span><span class="lacvay-user-dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -12],
});

function LocateButton({
  map,
  onLocated,
}: {
  map: L.Map;
  onLocated: (geo: UserGeo) => void;
}) {
  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control mb-3 mr-3">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void requestUserLocation().then((result) => {
              if (!result) return;
              onLocated(result);
              map.setView([result.lat, result.lng], 16, { animate: true });
            });
          }}
          className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-md hover:bg-blue-50"
          aria-label="Center map on my location"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          My location
        </button>
      </div>
    </div>
  );
}

export function CurrentLocationMarker({
  panOnFirstFix = false,
}: {
  panOnFirstFix?: boolean;
}) {
  const map = useMap();
  const [geo, setGeo] = useState<UserGeo | null>(() => getStoredGeo());
  const [didPan, setDidPan] = useState(false);

  useEffect(() => {
    const onGeo = (event: Event) => {
      const next = (event as CustomEvent<UserGeo>).detail;
      if (next?.lat != null && next?.lng != null) setGeo(next);
    };
    window.addEventListener(GEO_EVENT, onGeo);
    void requestUserLocation().then((result) => {
      if (result) setGeo(result);
    });
    const stopWatch = watchUserLocation();
    return () => {
      window.removeEventListener(GEO_EVENT, onGeo);
      stopWatch();
    };
  }, []);

  useEffect(() => {
    if (!panOnFirstFix || didPan || !geo) return;
    map.setView([geo.lat, geo.lng], Math.max(map.getZoom(), 15), { animate: true });
    setDidPan(true);
  }, [didPan, geo, map, panOnFirstFix]);

  if (!geo) {
    return <LocateButton map={map} onLocated={setGeo} />;
  }

  return (
    <>
      <CircleMarker
        center={[geo.lat, geo.lng]}
        radius={18}
        pathOptions={{
          color: '#1d4ed8',
          weight: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
        }}
      />
      <Marker position={[geo.lat, geo.lng]} icon={userLocationIcon} zIndexOffset={1200}>
        <Popup>
          <div className="max-w-[200px] p-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">You are here</p>
            <p className="mt-0.5 text-sm font-bold leading-snug text-gray-900">{geo.label}</p>
          </div>
        </Popup>
      </Marker>
      <LocateButton map={map} onLocated={setGeo} />
    </>
  );
}
