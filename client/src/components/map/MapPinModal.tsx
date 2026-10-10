import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, X, Check, LocateFixed, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { requestUserLocation, getStoredGeo } from '@/lib/userLocation';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const BATANGAS_CENTER: [number, number] = [13.7565, 121.0583];
const API_URL = import.meta.env.VITE_API_URL || '/api';

const originPinIcon = L.divIcon({
  className: 'origin-map-pin',
  html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:grab;">
      <div style="background:#15803d;color:#ffffff;border:2.5px solid #ffffff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.35);font-size:11px;font-weight:800;letter-spacing:0.02em;">
        FROM
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #15803d;margin-top:-1px;"></div>
    </div>
  `,
  iconSize: [34, 40],
  iconAnchor: [17, 40],
});

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function PanToPosition({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const prevRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!position) return;
    if (
      !prevRef.current ||
      Math.abs(prevRef.current[0] - position[0]) > 0.001 ||
      Math.abs(prevRef.current[1] - position[1]) > 0.001
    ) {
      map.panTo(position, { animate: true, duration: 0.5 });
      prevRef.current = position;
    }
  }, [position, map]);

  return null;
}

export function MapPinModal() {
  const { isPinModalOpen, setIsPinModalOpen, pinnedOrigin, setPinnedOriginLocation } = useApp();

  const [position, setPosition] = useState<[number, number]>(() => {
    if (pinnedOrigin) return [pinnedOrigin.lat, pinnedOrigin.lng];
    const geo = getStoredGeo();
    if (geo) return [geo.lat, geo.lng];
    return BATANGAS_CENTER;
  });

  const [label, setLabel] = useState<string>(() => pinnedOrigin?.label || 'Pin starting point');
  const [isResolving, setIsResolving] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync position if modal opens
  useEffect(() => {
    if (isPinModalOpen) {
      if (pinnedOrigin) {
        setPosition([pinnedOrigin.lat, pinnedOrigin.lng]);
        setLabel(pinnedOrigin.label);
      } else {
        const geo = getStoredGeo();
        if (geo) {
          setPosition([geo.lat, geo.lng]);
          setLabel(geo.label);
        } else {
          setPosition(BATANGAS_CENTER);
          void resolveLabel(BATANGAS_CENTER[0], BATANGAS_CENTER[1]);
        }
      }
    }
  }, [isPinModalOpen, pinnedOrigin]);

  const resolveLabel = useCallback(async (lat: number, lng: number) => {
    setIsResolving(true);
    try {
      const res = await fetch(`${API_URL}/geo/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = (await res.json()) as { label?: string; outOfBounds?: boolean };
        if (data.outOfBounds) {
          setIsOutOfBounds(true);
          setLabel('Outside Batangas City bounds');
        } else {
          setIsOutOfBounds(false);
          setLabel(data.label?.trim() || `Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } else {
        setLabel(`Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setIsOutOfBounds(false);
      }
    } catch {
      setLabel(`Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      setIsOutOfBounds(false);
    } finally {
      setIsResolving(false);
    }
  }, []);

  const handlePositionChange = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void resolveLabel(lat, lng);
      }, 350);
    },
    [resolveLabel],
  );

  const handleUseGps = async () => {
    setIsLocatingGps(true);
    try {
      const geo = await requestUserLocation();
      if (geo) {
        setPosition([geo.lat, geo.lng]);
        setLabel(geo.label);
        setIsOutOfBounds(false);
      }
    } finally {
      setIsLocatingGps(false);
    }
  };

  const handleConfirm = async () => {
    if (isOutOfBounds) return;
    await setPinnedOriginLocation(position[0], position[1], label);
    setIsPinModalOpen(false);
  };

  if (!isPinModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className="relative flex h-[92vh] max-h-[720px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-lacvay-cream to-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lacvay-green text-white shadow-xs">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 id="pin-modal-title" className="text-sm sm:text-base font-bold text-gray-900">
                Pin Starting Point on Map
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Tap anywhere on the map or drag the pin to set your origin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPinModalOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 w-full overflow-hidden bg-gray-100">
          <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={true}
            className="h-full w-full cursor-crosshair"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapResizeHandler />
            <MapClickHandler onSelect={handlePositionChange} />
            <PanToPosition position={position} />

            <Marker
              position={position}
              icon={originPinIcon}
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const marker = e.target;
                  const latlng = marker.getLatLng();
                  handlePositionChange(latlng.lat, latlng.lng);
                },
              }}
            />
          </MapContainer>

          {/* Floating Map Controls */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLocatingGps}
              title="Locate my GPS"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 shadow-md hover:bg-gray-50 border border-gray-200 transition active:scale-95 disabled:opacity-50"
            >
              {isLocatingGps ? (
                <Loader2 className="h-4 w-4 animate-spin text-lacvay-green" />
              ) : (
                <LocateFixed className="h-4 w-4 text-lacvay-green" />
              )}
            </button>
          </div>

          {/* Quick preset landmarks banner */}
          <div className="absolute top-3 left-3 z-[1000] hidden sm:flex items-center gap-1.5 overflow-x-auto rounded-full bg-white/95 px-2.5 py-1 shadow-md border border-gray-200/80 backdrop-blur-xs text-[11px]">
            <span className="font-semibold text-gray-400 text-[10px] uppercase">Quick:</span>
            <button
              type="button"
              onClick={() => handlePositionChange(13.7594, 121.0722)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-lacvay-blush hover:text-lacvay-green transition font-medium"
            >
              SM Batangas
            </button>
            <button
              type="button"
              onClick={() => handlePositionChange(13.7818, 121.0543)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-lacvay-blush hover:text-lacvay-green transition font-medium"
            >
              Grand Terminal
            </button>
            <button
              type="button"
              onClick={() => handlePositionChange(13.754, 121.043)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-lacvay-blush hover:text-lacvay-green transition font-medium"
            >
              Pier
            </button>
            <button
              type="button"
              onClick={() => handlePositionChange(13.7539, 121.05)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-lacvay-blush hover:text-lacvay-green transition font-medium"
            >
              CLB
            </button>
          </div>
        </div>

        {/* Footer with Pinned Address & Confirm */}
        <div className="border-t border-gray-100 bg-white p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5',
                  isOutOfBounds
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-emerald-100 text-emerald-700',
                )}
              >
                {isOutOfBounds ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Selected Origin
                  </span>
                  {isResolving && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Resolving...
                    </span>
                  )}
                </div>
                <p className="truncate text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                  {label}
                </p>
                <p className="text-[10px] text-gray-400">
                  {position[0].toFixed(5)}, {position[1].toFixed(5)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 sm:flex-initial rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isOutOfBounds || isResolving}
                className={cn(
                  'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-50',
                  isOutOfBounds
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-lacvay-green hover:bg-lacvay-green-dark',
                )}
              >
                <Check className="h-3.5 w-3.5" />
                Set as Starting Point
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
