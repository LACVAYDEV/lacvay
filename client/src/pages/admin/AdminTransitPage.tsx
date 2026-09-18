import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bus,
  Check,
  Edit3,
  Plus,
  RefreshCw,
  Route as RouteIcon,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { cn } from '@/lib/utils';
import {
  transitAdminService,
  type TransitRouteInsert,
  type TransitRouteRow,
} from '@/services/transitAdminService';

// Primary colors only: Yellow, Green, Red, Blue, Orange, White (with black border)
const PRIMARY_COLORS = [
  { label: 'Yellow', hex: '#EAB308', bgClass: 'bg-[#EAB308]', textClass: 'text-black', isWhite: false },
  { label: 'Green', hex: '#16A34A', bgClass: 'bg-[#16A34A]', textClass: 'text-white', isWhite: false },
  { label: 'Red', hex: '#DC2626', bgClass: 'bg-[#DC2626]', textClass: 'text-white', isWhite: false },
  { label: 'Blue', hex: '#2563EB', bgClass: 'bg-[#2563EB]', textClass: 'text-white', isWhite: false },
  { label: 'Orange', hex: '#EA580C', bgClass: 'bg-[#EA580C]', textClass: 'text-white', isWhite: false },
  { label: 'White', hex: '#FFFFFF', bgClass: 'bg-white', textClass: 'text-black', isWhite: true },
];



function isWhiteColor(hex: string): boolean {
  if (!hex) return false;
  const upper = hex.trim().toUpperCase();
  return upper === '#FFFFFF' || upper === '#FFF' || upper === 'WHITE';
}

export default function AdminTransitPage() {
  const [routes, setRoutes] = useState<TransitRouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View state: 'list' shows catalog of routes; 'form' shows unified add/edit page
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editingRoute, setEditingRoute] = useState<TransitRouteRow | null>(null);

  // Form Fields
  const [routeName, setRouteName] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [geoJsonText, setGeoJsonText] = useState('');
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);
  const [geoJsonStats, setGeoJsonStats] = useState<string | null>(null);

  // Fare Matrix Fixed Pricing (no hardcoded prefilled defaults)
  const [regularFare, setRegularFare] = useState('');
  const [discountedFare, setDiscountedFare] = useState('');
  const [extraDistance, setExtraDistance] = useState('');
  const [extraDistanceDiscounted, setExtraDistanceDiscounted] = useState('');

  // Modal
  const [deleteModalRoute, setDeleteModalRoute] = useState<TransitRouteRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Load routes & fare pricing
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const routeData = await transitAdminService.listRoutes();
      setRoutes(routeData);
    } catch (err: any) {
      const msg = err?.message || (err instanceof Error ? err.message : 'Failed to load transit data');
      showNotification('error', msg);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Open the Form to Add a New Route
  const handleOpenCreateForm = () => {
    setEditingRoute(null);
    setRouteName('');
    setColorCode('');
    setGeoJsonText('');
    setGeoJsonError(null);
    setGeoJsonStats(null);
    setRegularFare('');
    setDiscountedFare('');
    setExtraDistance('');
    setExtraDistanceDiscounted('');
    setCurrentView('form');
  };

  // Open the Form to Edit an Existing Route
  const handleOpenEditForm = async (route: TransitRouteRow) => {
    setEditingRoute(route);
    setRouteName(route.route_name);
    setColorCode(route.color_code || '');

    const formattedGeo = route.geojson_path ? JSON.stringify(route.geojson_path, null, 2) : '';
    setGeoJsonText(formattedGeo);
    validateGeoJson(formattedGeo);

    try {
      const fares = await transitAdminService.getFixedFarePricing();
      if (fares) {
        setRegularFare(fares.regular != null ? fares.regular.toString() : '');
        setDiscountedFare(fares.discounted != null ? fares.discounted.toString() : '');
        setExtraDistance(fares.extraDistance != null ? fares.extraDistance.toString() : '');
        setExtraDistanceDiscounted(
          fares.extraDistanceDiscounted != null ? fares.extraDistanceDiscounted.toString() : '',
        );
      }
    } catch {
      // ignore
    }

    setCurrentView('form');
  };

  // Back to list view
  const handleBackToList = () => {
    setCurrentView('list');
    setEditingRoute(null);
  };

  // Validate GeoJSON input
  const validateGeoJson = (text: string) => {
    if (!text.trim()) {
      setGeoJsonError(null);
      setGeoJsonStats(null);
      return null;
    }
    try {
      const parsed = JSON.parse(text);
      let coordCount = 0;

      if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
        coordCount = parsed.coordinates.length;
      } else if (
        parsed.type === 'Feature' &&
        parsed.geometry?.type === 'LineString' &&
        Array.isArray(parsed.geometry.coordinates)
      ) {
        coordCount = parsed.geometry.coordinates.length;
      } else if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
        coordCount = parsed.features.reduce((acc: number, f: { geometry?: { coordinates?: unknown[] } }) => {
          return acc + (f?.geometry?.coordinates?.length || 0);
        }, 0);
      } else if (Array.isArray(parsed.coordinates)) {
        coordCount = parsed.coordinates.length;
      }

      setGeoJsonError(null);
      setGeoJsonStats(coordCount > 0 ? `Valid GeoJSON (${coordCount} coordinate points)` : 'Valid JSON');
      return parsed;
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Invalid JSON format';
      setGeoJsonError(errorMsg);
      setGeoJsonStats(null);
      return null;
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setGeoJsonText(content);
      validateGeoJson(content);
      showNotification('success', `Loaded ${file.name}`);
    };
    reader.onerror = () => {
      showNotification('error', 'Failed to read file');
    };
    reader.readAsText(file);
  };



  const formatGeoJson = () => {
    try {
      const parsed = JSON.parse(geoJsonText);
      setGeoJsonText(JSON.stringify(parsed, null, 2));
      showNotification('success', 'GeoJSON formatted');
    } catch {
      showNotification('error', 'Cannot format invalid JSON');
    }
  };

  // 20% statutory discount calculator helper
  const handleAutoCalculateDiscount = () => {
    const reg = parseFloat(regularFare);
    const extra = parseFloat(extraDistance);
    if (!isNaN(reg) && reg > 0) {
      setDiscountedFare((Math.round(reg * 0.8 * 100) / 100).toFixed(2));
    }
    if (!isNaN(extra) && extra > 0) {
      setExtraDistanceDiscounted((Math.round(extra * 0.8 * 100) / 100).toFixed(2));
    }
    showNotification('success', 'Calculated 20% discounted rates');
  };

  // UNIFIED SAVE: Route Details + Fixed Fare Matrix
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) {
      showNotification('error', 'Please provide a Route Name');
      return;
    }
    if (!colorCode) {
      showNotification('error', 'Please select a Primary Color for the route');
      return;
    }

    // Validate GeoJSON
    let parsedGeoJson = null;
    if (geoJsonText.trim()) {
      try {
        parsedGeoJson = JSON.parse(geoJsonText);
      } catch {
        showNotification('error', 'Please fix GeoJSON syntax error before saving');
        return;
      }
    }

    try {
      setActionLoading(true);

      if (editingRoute) {
        // Update existing route
        const updated = await transitAdminService.updateRoute(editingRoute.id, {
          route_name: routeName.trim(),
          vehicle_type: 'Jeepney',
          color_code: colorCode,
          geojson_path: parsedGeoJson,
        });
        setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        // Create new route
        const insertData: TransitRouteInsert = {
          route_name: routeName.trim(),
          vehicle_type: 'Jeepney',
          color_code: colorCode,
          geojson_path: parsedGeoJson,
        };
        const created = await transitAdminService.createRoute(insertData);
        setRoutes((prev) => [created, ...prev]);
      }

      // Save fixed fare matrix if values are entered
      const reg = regularFare.trim() ? parseFloat(regularFare) : null;
      const disc = discountedFare.trim() ? parseFloat(discountedFare) : null;
      const extra = extraDistance.trim() ? parseFloat(extraDistance) : null;
      const extraDisc = extraDistanceDiscounted.trim() ? parseFloat(extraDistanceDiscounted) : null;

      if (reg !== null || disc !== null || extra !== null || extraDisc !== null) {
        await transitAdminService.saveFixedFarePricing({
          regular: reg,
          discounted: disc,
          extraDistance: extra,
          extraDistanceDiscounted: extraDisc,
        });
      }

      showNotification('success', `Route "${routeName.trim()}" saved successfully!`);
      setCurrentView('list');
      setEditingRoute(null);
    } catch (err: any) {
      const msg = err?.message || (err instanceof Error ? err.message : 'Failed to save route data');
      showNotification('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Route
  const handleDeleteRoute = async () => {
    if (!deleteModalRoute) return;
    try {
      setActionLoading(true);
      await transitAdminService.deleteRoute(deleteModalRoute.id);
      setRoutes((prev) => prev.filter((r) => r.id !== deleteModalRoute.id));
      setDeleteModalRoute(null);
      if (editingRoute?.id === deleteModalRoute.id) {
        setCurrentView('list');
        setEditingRoute(null);
      }
      showNotification('success', 'Route deleted successfully');
    } catch (err: any) {
      const msg = err?.message || (err instanceof Error ? err.message : 'Failed to delete route');
      showNotification('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Toast Notification */}
      {notification && (
        <div
          className={cn(
            'fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium shadow-xl transition-all animate-in fade-in slide-in-from-bottom-5',
            notification.type === 'success'
              ? 'bg-lacvay-green text-white shadow-lacvay-green/30'
              : 'bg-red-600 text-white shadow-red-600/30',
          )}
        >
          {notification.type === 'success' ? (
            <Check className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* VIEW 1: ROUTES LIST (The first thing to see!) */}
      {currentView === 'list' && (
        <div className="space-y-6">
          <AdminPageHeader
            title="Transit Routes"
            description="Browse Batangas City jeepney transit routes. Add new routes or open one to edit."
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={loadInitialData}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  onClick={handleOpenCreateForm}
                  className="gap-1.5 bg-lacvay-green text-white hover:bg-lacvay-green-dark"
                >
                  <Plus className="h-4 w-4" />
                  Add route
                </Button>
              </div>
            }
          />

          {loading ? (
            <LoadingState message="Loading routes..." />
          ) : routes.length === 0 ? (
            <div className="space-y-4 py-8">
              <EmptyState
                title="No transit routes yet"
                description="Create your first jeepney transit route to establish paths and fares."
              />
              <div className="flex justify-center">
                <Button onClick={handleOpenCreateForm} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add route
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((route) => {
                const white = isWhiteColor(route.color_code);
                return (
                  <div
                    key={route.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 shadow-card transition hover:border-lacvay-green/30 hover:shadow-lg"
                  >
                    <div>
                      {/* Color Header Indicator */}
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            'flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold shadow-xs',
                            white
                              ? 'border-2 border-black bg-white text-black'
                              : 'text-white',
                          )}
                          style={{ backgroundColor: white ? '#FFFFFF' : (route.color_code || '#16A34A') }}
                        >
                          <RouteIcon className="h-3.5 w-3.5" />
                          <span>Jeepney</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(route)}
                            className="rounded-xl p-2 text-gray-500 transition hover:bg-lacvay-green/10 hover:text-lacvay-green"
                            title="Edit route"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalRoute(route)}
                            className="rounded-xl p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete route"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Route Name */}
                      <h3 className="mt-4 text-base font-extrabold leading-snug text-gray-900 line-clamp-2">
                        {route.route_name}
                      </h3>

                      {/* GeoJSON Status Badge */}
                      {route.geojson_path && (
                        <div className="mt-3">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                            GeoJSON Line Configured
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEditForm(route)}
                        className="w-full text-xs font-bold"
                      >
                        Edit Route
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DEDICATED ADD / EDIT FORM (All on one unified page!) */}
      {currentView === 'form' && (
        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-soft transition hover:bg-gray-50 hover:text-gray-900"
                title="Back to routes list"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                  {editingRoute ? 'Edit Transit Route' : 'Add New Transit Route'}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure route name, primary color, path coordinates, and fixed fare pricing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={handleBackToList}>
                Cancel
              </Button>
              {editingRoute && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setDeleteModalRoute(editingRoute)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-lacvay-green text-white hover:bg-lacvay-green-dark gap-1.5"
              >
                <Save className="h-4 w-4" />
                {actionLoading ? 'Saving...' : 'Save Route'}
              </Button>
            </div>
          </div>

          {/* SECTION 1: ROUTE DETAILS & GEOJSON */}
          <Card padding="lg" className="border border-gray-200/80 shadow-card">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">1. Route Details & Color</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Route name, official primary color branding, and LineString path coordinates.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              {/* Route Name */}
              <Input
                label="Route Name *"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g. Capitolio - Balagtas via Kumintang"
                required
              />

              {/* Primary Color Selector (Yellow, Green, Red, Blue, Orange, White) */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Primary Color Code (Required)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select one of the 6 official transit route colors. White routes feature high-contrast black borders.
                </p>

                <div className="flex flex-wrap items-center gap-2.5">
                  {PRIMARY_COLORS.map((col) => {
                    const isSelected = colorCode.toUpperCase() === col.hex.toUpperCase();
                    return (
                      <button
                        key={col.label}
                        type="button"
                        onClick={() => setColorCode(col.hex)}
                        className={cn(
                          'flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all',
                          col.isWhite
                            ? 'border-2 border-black bg-white text-black'
                            : `${col.bgClass} ${col.textClass}`,
                          isSelected
                            ? 'ring-4 ring-lacvay-green/30 scale-105 shadow-md'
                            : 'opacity-85 hover:opacity-100 hover:scale-102',
                        )}
                      >
                        {col.isWhite && (
                          <span className="h-3 w-3 rounded-full border border-black bg-white" />
                        )}
                        <span>{col.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Live Preview */}
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-50 p-3 border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500">Live Preview:</span>
                  {colorCode ? (
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold shadow-xs',
                        isWhiteColor(colorCode)
                          ? 'border-2 border-black bg-white text-black'
                          : 'text-white',
                      )}
                      style={{ backgroundColor: isWhiteColor(colorCode) ? '#FFFFFF' : colorCode }}
                    >
                      <Bus className="h-3.5 w-3.5" />
                      <span>{routeName || 'Route Name'}</span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-gray-400">
                      No color selected yet. Click one of the 6 colors above to preview.
                    </span>
                  )}
                </div>
              </div>

              {/* GeoJSON LineString */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      GeoJSON LineString Path (`geojson_path`)
                    </label>
                    <p className="text-xs text-gray-500">
                      Upload or paste GeoJSON LineString data representing the transit route path.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={formatGeoJson}
                      className="text-xs py-1"
                    >
                      Prettify
                    </Button>
                  </div>
                </div>

                {/* File Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="group mb-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition hover:border-lacvay-green hover:bg-lacvay-green/5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".geojson,.json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                  />
                  <Upload className="h-5 w-5 text-gray-400 group-hover:text-lacvay-green" />
                  <p className="mt-1 text-xs font-semibold text-gray-700">
                    Drop .geojson or .json file here, or{' '}
                    <span className="text-lacvay-green underline">browse</span>
                  </p>
                </div>

                {/* Text Area */}
                <textarea
                  rows={6}
                  value={geoJsonText}
                  onChange={(e) => {
                    setGeoJsonText(e.target.value);
                    validateGeoJson(e.target.value);
                  }}
                  placeholder='{\n  "type": "LineString",\n  "coordinates": [[121.0583, 13.7565], [121.0620, 13.7650]]\n}'
                  className="w-full font-mono text-xs rounded-2xl border border-gray-200 bg-gray-50 p-3.5 outline-none transition focus:border-lacvay-green focus:bg-white"
                />

                <div className="mt-1.5 flex items-center justify-between text-xs">
                  {geoJsonError ? (
                    <span className="flex items-center gap-1 font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {geoJsonError}
                    </span>
                  ) : geoJsonStats ? (
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <Check className="h-3.5 w-3.5" />
                      {geoJsonStats}
                    </span>
                  ) : (
                    <span className="text-gray-400">Optional: leave empty if coordinates are not available</span>
                  )}
                  {geoJsonText && (
                    <button
                      type="button"
                      onClick={() => {
                        setGeoJsonText('');
                        setGeoJsonError(null);
                        setGeoJsonStats(null);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* SECTION 2: FARE MATRIX (FIXED CUMULATIVE PRICING - NO PER-KM BASIS) */}
          <Card padding="lg" className="border border-gray-200/80 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">2. Fixed Fare Matrix (Cumulative Pricing)</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Regulated jeepney fares for this route. Prices are total cumulative trip fares (NOT per-kilometer and NOT additive).
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAutoCalculateDiscount}
                className="text-xs text-lacvay-green font-bold"
              >
                ⚡ Calculate 20% Discount
              </Button>
            </div>

            {/* Commuter & Admin Clarity Notice */}
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950">
              <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Important Notice for Commuters & Admins:</p>
                <p className="text-blue-900/90 leading-relaxed">
                  Prices entered for Extended Trips are the <strong>total cumulative fare</strong> for the entire ride. They are <strong>NOT additive</strong> and are <strong>NOT computed on a per-km basis</strong>. Commuters traveling the extended route pay this single cumulative fare.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Regular */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Regular Fare (₱)
                  </label>
                  <span className="rounded-md bg-gray-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">Standard</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">Total flat fare for standard trip</p>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={regularFare}
                  onChange={(e) => setRegularFare(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-mono font-bold text-gray-900 outline-none focus:border-lacvay-green"
                />
              </div>

              {/* Discounted */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Discounted Fare (₱)
                  </label>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Standard</span>
                </div>
                <p className="text-[11px] text-emerald-700 mb-2">20% discount (Student / Senior / PWD)</p>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={discountedFare}
                  onChange={(e) => setDiscountedFare(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-mono font-bold text-emerald-700 outline-none focus:border-lacvay-green"
                />
              </div>

              {/* Extended Distance */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-950">
                    Extended Trip Fare (₱)
                  </label>
                  <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">Cumulative</span>
                </div>
                <p className="text-[11px] text-blue-800/80 mb-2">Total cumulative fare for full extended trip</p>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={extraDistance}
                  onChange={(e) => setExtraDistance(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-mono font-bold text-blue-950 outline-none focus:border-lacvay-green"
                />
              </div>

              {/* Extended Distance Discounted */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Extended Disc Fare (₱)
                  </label>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">Cumulative</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 mb-2">Total discounted fare for full extended trip</p>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={extraDistanceDiscounted}
                  onChange={(e) => setExtraDistanceDiscounted(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-mono font-bold text-emerald-700 outline-none focus:border-lacvay-green"
                />
              </div>
            </div>
          </Card>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">
            <Button type="button" variant="secondary" onClick={handleBackToList}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actionLoading}
              className="bg-lacvay-green text-white hover:bg-lacvay-green-dark gap-1.5"
            >
              <Save className="h-4 w-4" />
              {actionLoading ? 'Saving...' : 'Save Route'}
            </Button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteModalRoute)}
        onClose={() => setDeleteModalRoute(null)}
        title="Delete Transit Route?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete route{' '}
            <strong className="text-gray-900">{deleteModalRoute?.route_name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalRoute(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteRoute}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Route'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
