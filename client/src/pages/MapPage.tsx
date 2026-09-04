import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams } from 'react-router-dom';
import { Copy } from 'lucide-react';
import type { TransportType } from '@/types';
import { BATANGAS_CENTER, mapLandmarks } from '@/data/mockData';
import { buildMockRoute } from '@/lib/fareCalculator';
import { getTransportLabel, getTransportOption } from '@/lib/transport';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getStepIcon } from '@/components/ui/TransportIcons';
import { formatFareRange } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [map, center]);
  return null;
}

export default function MapPage() {
  const [params] = useSearchParams();
  const from = params.get('from') || 'Current Location';
  const to = params.get('to') || 'SM City Batangas';
  const transportParam = params.get('transport') as TransportType | null;
  const transport: TransportType =
    transportParam && getTransportOption(transportParam) ? transportParam : 'jeepney';
  const { addHistory, showToast } = useApp();

  const route = useMemo(() => buildMockRoute(from, to, transport), [from, to, transport]);

  useEffect(() => {
    addHistory({ query: `${from} → ${to}`, type: 'route', meta: transport });
  }, [from, to, transport, addHistory]);

  const copyRoute = async () => {
    const summary = `${from} → ${to} (${getTransportLabel(transport)}, ${route.totalDurationMin} min, ${formatFareRange(route.estimatedFareMin, route.estimatedFareMax)})`;
    try {
      await navigator.clipboard.writeText(summary);
      showToast('Route copied to clipboard');
    } catch {
      showToast('Could not copy route');
    }
  };

  const center: [number, number] = [BATANGAS_CENTER.lat, BATANGAS_CENTER.lng];
  const routeLine: [number, number][] = [
    [13.756, 121.058],
    [13.754, 121.062],
    [13.755, 121.066],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Map & Routes</h2>
        <p className="text-sm text-gray-500">Interactive map for Batangas City transportation</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card padding="sm" className="overflow-hidden p-0">
          <div className="h-[420px] w-full md:h-[520px]">
            <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={center} />
              <Marker position={center} icon={icon}>
                <Popup>{from}</Popup>
              </Marker>
              {mapLandmarks.map((lm) => (
                <Marker key={lm.id} position={[lm.coordinates.lat, lm.coordinates.lng]} icon={icon}>
                  <Popup>{lm.name}</Popup>
                </Marker>
              ))}
              <Polyline positions={routeLine} pathOptions={{ color: '#159447', weight: 4 }} />
            </MapContainer>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900">Route Details</h3>
              <button
                type="button"
                onClick={copyRoute}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:border-lacvay-green hover:text-lacvay-green"
                aria-label="Copy route summary"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">{from} → {to}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{getTransportLabel(transport)}</Badge>
              <Badge variant="gray">{route.totalDurationMin} min</Badge>
              <Badge variant="gray">{route.totalDistanceKm} km</Badge>
            </div>
            <p className="mt-3 text-lg font-bold text-lacvay-green">
              {formatFareRange(route.estimatedFareMin, route.estimatedFareMax)}
            </p>
            <p className="text-xs text-gray-500">{route.transfers} transfer(s)</p>
          </Card>

          <Card>
            <h3 className="font-bold text-gray-900">Directions</h3>
            <ol className="mt-4 space-y-4">
              {route.steps.map((step, i) => {
                const StepIcon = getStepIcon(step.type);
                return (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lacvay-green/10 text-lacvay-green">
                      <StepIcon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{getTransportLabel(step.type)}</p>
                      <p className="text-sm text-gray-500">{step.instruction}</p>
                      <p className="text-xs text-gray-400">{step.durationMin} min</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
