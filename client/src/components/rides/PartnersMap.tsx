import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Ride } from '@/types';
import { BATANGAS_CENTER } from '@/data/mockData';
import { getTransportLabel } from '@/lib/transport';
import { formatRateSummary } from '@/lib/partnerRates';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const userIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function partnerIcon(color: string, selected: boolean) {
  const size = selected ? 18 : 14;
  const ring = selected ? `box-shadow:0 0 0 3px ${color}55, 0 2px 6px rgba(0,0,0,.35);` : 'box-shadow:0 1px 4px rgba(0,0,0,.35);';
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [map, center]);
  return null;
}

function SelectedPartnerFocus({
  partners,
  selectedId,
}: {
  partners: Ride[];
  selectedId?: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const partner = partners.find((p) => p.id === selectedId);
    if (!partner) return;
    map.flyTo([partner.coordinates.lat, partner.coordinates.lng], 15, { duration: 0.6 });
  }, [map, partners, selectedId]);
  return null;
}

function PartnerMarker({
  partner,
  selected,
  tripDistanceKm,
  onSelect,
}: {
  partner: Ride;
  selected: boolean;
  tripDistanceKm?: number;
  onSelect?: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const color = partner.vehicleType === 'taxi' ? '#159447' : '#2563eb';

  useEffect(() => {
    if (selected) markerRef.current?.openPopup();
  }, [selected]);

  return (
    <Marker
      ref={markerRef}
      position={[partner.coordinates.lat, partner.coordinates.lng]}
      icon={partnerIcon(color, selected)}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect?.(partner.id) }}
    >
      <Popup>
        <div className="min-w-[160px] text-[13px]">
          <p className="font-bold text-gray-900">{partner.driverName}</p>
          <p className="text-gray-500">{getTransportLabel(partner.vehicleType)}</p>
          <p className="mt-2 font-semibold text-lacvay-green-dark">
            {formatRateSummary(partner.baseFare, partner.perKmFee)}
          </p>
          <p className="text-gray-500">{partner.distanceKm} km away · ★ {partner.rating}</p>
          {tripDistanceKm != null && (
            <p className="mt-1 font-bold text-lacvay-green">
              Est. trip: {formatCurrency(partner.estimatedFare)}
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

interface PartnersMapProps {
  partners: Ride[];
  userLocation?: { lat: number; lng: number };
  tripDistanceKm?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

export function PartnersMap({
  partners,
  userLocation = BATANGAS_CENTER,
  tripDistanceKm,
  selectedId,
  onSelect,
  className = 'h-[320px] w-full',
}: PartnersMapProps) {
  const center: [number, number] = [userLocation.lat, userLocation.lng];

  return (
    <div className={cn('relative', className)}>
      <MapContainer center={center} zoom={14} className="h-full w-full rounded-2xl" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />
        <SelectedPartnerFocus partners={partners} selectedId={selectedId} />
        <Circle
          center={center}
          radius={800}
          pathOptions={{ color: '#159447', fillColor: '#159447', fillOpacity: 0.06, weight: 1 }}
        />
        <Marker position={center} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {partners.map((partner) => (
          <PartnerMarker
            key={partner.id}
            partner={partner}
            selected={selectedId === partner.id}
            tripDistanceKm={tripDistanceKm}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 flex gap-2 rounded-xl bg-white/95 px-3 py-2 text-[10.5px] font-medium text-gray-600 shadow-soft backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
          Habal-habal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lacvay-green" />
          Taxi
        </span>
      </div>
    </div>
  );
}
