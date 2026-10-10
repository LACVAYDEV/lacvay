import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { MapPin, X, Check, LocateFixed, Loader2, Navigation, AlertCircle, Compass } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { requestUserLocation, getStoredGeo } from '@/lib/userLocation';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const BATANGAS_CENTER: [number, number] = [13.7565, 121.0583];
const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Ensures map tiles recalculate accurately when the modal is opened
 */
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * Tracks map movement so the center-locked pin reflects the exact center coordinate
 */
function CenterPinMapListener({
  onCenterChange,
  setIsMoving,
}: {
  onCenterChange: (lat: number, lng: number) => void;
  setIsMoving: (moving: boolean) => void;
}) {
  const map = useMapEvents({
    movestart() {
      setIsMoving(true);
    },
    moveend() {
      setIsMoving(false);
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
    click(e) {
      map.panTo(e.latlng, { animate: true, duration: 0.35 });
    },
  });

  return null;
}

/**
 * Pans/Flies the map camera to target coordinate when presets or GPS is pressed
 */
function FlyToPosition({ target }: { target: [number, number] | null }) {
  const map = useMap();
  const prevTargetRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!target) return;
    if (
      !prevTargetRef.current ||
      Math.abs(prevTargetRef.current[0] - target[0]) > 0.0001 ||
      Math.abs(prevTargetRef.current[1] - target[1]) > 0.0001
    ) {
      prevTargetRef.current = target;
      map.flyTo(target, 16, { animate: true, duration: 0.6 });
    }
  }, [target, map]);

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

  const [panTarget, setPanTarget] = useState<[number, number] | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [label, setLabel] = useState<string>(() => pinnedOrigin?.label || 'Pin starting point');
  const [isResolving, setIsResolving] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync position whenever modal opens
  useEffect(() => {
    if (isPinModalOpen) {
      if (pinnedOrigin) {
        setPosition([pinnedOrigin.lat, pinnedOrigin.lng]);
        setPanTarget([pinnedOrigin.lat, pinnedOrigin.lng]);
        setLabel(pinnedOrigin.label);
      } else {
        const geo = getStoredGeo();
        if (geo) {
          setPosition([geo.lat, geo.lng]);
          setPanTarget([geo.lat, geo.lng]);
          setLabel(geo.label);
        } else {
          setPosition(BATANGAS_CENTER);
          setPanTarget(BATANGAS_CENTER);
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

  const handleCenterChange = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void resolveLabel(lat, lng);
      }, 300);
    },
    [resolveLabel],
  );

  const handleSelectPreset = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setPanTarget([lat, lng]);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void resolveLabel(lat, lng);
    }, 250);
  };

  const handleUseGps = async () => {
    setIsLocatingGps(true);
    try {
      const geo = await requestUserLocation();
      if (geo) {
        setPosition([geo.lat, geo.lng]);
        setPanTarget([geo.lat, geo.lng]);
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
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-lacvay-cream to-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lacvay-green text-white shadow-xs">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 id="pin-modal-title" className="text-sm sm:text-base font-bold text-gray-900">
                Pin Starting Point on Map
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Drag the map to position the center pin at your pickup location
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

        {/* Map Viewport Area */}
        <div className="relative flex-1 w-full overflow-hidden bg-gray-100 select-none">
          <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={true}
            className="h-full w-full cursor-grab active:cursor-grabbing"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapResizeHandler />
            <CenterPinMapListener
              onCenterChange={handleCenterChange}
              setIsMoving={setIsMoving}
            />
            <FlyToPosition target={panTarget} />
          </MapContainer>

          {/* ========================================================= */}
          {/* CENTER-LOCKED PIN & GROUND RADAR (STAYS FIXED AT 50% 50%) */}
          {/* ========================================================= */}

          {/* Ground Radar Target at exact map center */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[998] flex items-center justify-center">
            {/* Concentric radar ring */}
            <span
              className={cn(
                'absolute rounded-full border-2 border-emerald-500/60 transition-all duration-300',
                isMoving ? 'w-14 h-14 opacity-80 scale-125 animate-ping' : 'w-7 h-7 opacity-25 scale-100',
              )}
            />
            {/* Precision crosshair axes */}
            <span
              className={cn(
                'absolute w-6 h-[1.5px] bg-emerald-700 transition-opacity duration-200',
                isMoving ? 'opacity-80' : 'opacity-30',
              )}
            />
            <span
              className={cn(
                'absolute h-6 w-[1.5px] bg-emerald-700 transition-opacity duration-200',
                isMoving ? 'opacity-80' : 'opacity-30',
              )}
            />
            {/* Ground contact shadow - contracts when pin lifts */}
            <span
              className={cn(
                'absolute top-2 rounded-full bg-black/40 transition-all duration-200 blur-[1px]',
                isMoving ? 'w-2.5 h-1 opacity-25 scale-75' : 'w-5 h-1.5 opacity-70 scale-100',
              )}
            />
            {/* Center target dot */}
            <span className="relative h-2 w-2 rounded-full bg-emerald-800 ring-2 ring-white shadow-xs" />
          </div>

          {/* Elevated Center Pin: Needle Tip Points Directly at [50%, 50%] */}
          <div
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 pointer-events-none z-[1000] flex flex-col items-center transition-all duration-200 ease-out select-none',
              isMoving
                ? '-translate-y-[calc(100%+12px)] scale-105'
                : '-translate-y-full scale-100',
            )}
          >
            {/* Floating Badge Header */}
            <div
              className={cn(
                'mb-1.5 flex items-center gap-1.5 rounded-full px-3 py-1 shadow-lg border border-white/80 text-[11px] font-black uppercase tracking-wider backdrop-blur-xs transition-colors duration-200',
                isOutOfBounds
                  ? 'bg-rose-600 text-white shadow-rose-900/30'
                  : isMoving
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-950/30'
                  : 'bg-white text-emerald-900 shadow-md ring-1 ring-emerald-600/20',
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isOutOfBounds
                    ? 'bg-white animate-pulse'
                    : isMoving
                    ? 'bg-amber-300 animate-pulse'
                    : 'bg-emerald-500',
                )}
              />
              <span>
                {isOutOfBounds
                  ? 'Outside Batangas City'
                  : isMoving
                  ? 'Locating Spot...'
                  : 'Starting Point'}
              </span>
            </div>

            {/* Pin Body */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-white shadow-2xl transition-all duration-200',
                  isOutOfBounds
                    ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-800 text-white'
                    : 'bg-gradient-to-br from-emerald-500 via-lacvay-green to-teal-800 text-white shadow-emerald-950/35',
                )}
              >
                {isOutOfBounds ? (
                  <AlertCircle className="h-5 w-5" />
                ) : isMoving ? (
                  <Navigation className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[10px] font-black tracking-wider">FROM</span>
                  </div>
                )}
              </div>

              {/* Downward Pointer Triangle */}
              <div
                className={cn(
                  '-mt-1.5 h-0 w-0 border-l-[8px] border-r-[8px] border-t-[11px] border-l-transparent border-r-transparent drop-shadow-sm transition-colors duration-200',
                  isOutOfBounds ? 'border-t-red-800' : 'border-t-teal-800',
                )}
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* FLOATING CONTROLS & HINTS                                 */}
          {/* ========================================================= */}

          {/* Instruction Pill on Top Center */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none hidden sm:flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 shadow-md border border-gray-200/80 backdrop-blur-xs text-[11px] font-medium text-gray-700">
            <MapPin className="h-3.5 w-3.5 text-lacvay-green shrink-0" />
            <span>Pan map to position pin · Tap anywhere to center</span>
          </div>

          {/* Quick preset landmarks banner */}
          <div className="absolute bottom-4 left-3 z-[1000] flex items-center gap-1.5 overflow-x-auto rounded-full bg-white/95 px-2.5 py-1 shadow-md border border-gray-200/80 backdrop-blur-xs text-[11px] max-w-[calc(100%-4rem)] sm:max-w-none">
            <span className="font-semibold text-gray-400 text-[10px] uppercase shrink-0">Quick:</span>
            <button
              type="button"
              onClick={() => handleSelectPreset(13.7594, 121.0722)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-emerald-50 hover:text-lacvay-green transition font-medium shrink-0"
            >
              SM Batangas
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset(13.7818, 121.0543)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-emerald-50 hover:text-lacvay-green transition font-medium shrink-0"
            >
              Grand Terminal
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset(13.754, 121.043)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-emerald-50 hover:text-lacvay-green transition font-medium shrink-0"
            >
              Pier
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset(13.7539, 121.05)}
              className="rounded-full px-2 py-0.5 text-gray-700 hover:bg-emerald-50 hover:text-lacvay-green transition font-medium shrink-0"
            >
              CLB
            </button>
          </div>

          {/* Floating GPS Button */}
          <div className="absolute top-3 right-3 z-[1000]">
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLocatingGps}
              title="Center on my current GPS"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-700 shadow-md hover:bg-gray-50 border border-gray-200 transition active:scale-95 disabled:opacity-50"
            >
              {isLocatingGps ? (
                <Loader2 className="h-5 w-5 animate-spin text-lacvay-green" />
              ) : (
                <LocateFixed className="h-5 w-5 text-lacvay-green" />
              )}
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
