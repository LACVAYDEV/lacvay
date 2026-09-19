import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  FileUp,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { commuteGuidesService } from '@/services/commuteGuidesService';
import { transitAdminService, type TransitRouteRow } from '@/services/transitAdminService';
import { sendAIMessage } from '@/services/aiService';
import { useAuth } from '@/context/AuthContext';
import type { GlobalCommuteGuide, CommuteGuideStep, TransportSegment } from '@/types';
import { getTransitColorMeta } from '@/lib/transitColors';

// ─── Segment Builder ─────────────────────────────────────────────────────────

function emptySegment(): TransportSegment {
  return { type: 'Jeepney', routeId: '', routeName: '', fare: null, fareType: 'regular', color: '' };
}

function emptyStep(): CommuteGuideStep {
  return { order: 1, title: '', description: '', tip: '' };
}

// ─── AI Guide Parser ─────────────────────────────────────────────────────────

function parseAIGuide(text: string): {
  title: string;
  summary: string;
  steps: CommuteGuideStep[];
  segments: TransportSegment[];
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let title = 'Commute Guide';
  for (const line of lines) {
    const clean = line.replace(/^[#* \t-]+/, '').replace(/[*#]/g, '').trim();
    if (clean.length > 5 && clean.length < 80 && !clean.toLowerCase().startsWith('here')) {
      title = clean;
      break;
    }
  }

  let summary = '';
  for (const line of lines) {
    if (!line.startsWith('#') && !line.startsWith('*') && !line.match(/^\d+[.)]/) && line.length > 20) {
      summary = line.slice(0, 200);
      break;
    }
  }

  const steps: CommuteGuideStep[] = [];
  const segments: TransportSegment[] = [];
  let order = 1;

  for (const line of lines) {
    const numMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    const bulletMatch = line.match(/^[*•-]\s+\*\*(.+?)\*\*:?\s*(.*)/);

    if (numMatch) {
      const stepText = numMatch[2].replace(/[*_]/g, '').trim();
      const parts = stepText.split(/[:-]\s+/);
      const stepTitle = parts[0]?.trim() || `Step ${order}`;
      const desc = parts[1]?.trim() || parts[0]?.trim();

      steps.push({ order: order++, title: stepTitle, description: desc });

      // Detect transport type from step text
      const lower = stepText.toLowerCase();
      if (lower.includes('jeep') || lower.includes('jeepney')) {
        segments.push({ type: 'Jeepney', routeName: stepTitle });
      } else if (lower.includes('tricycle')) {
        segments.push({ type: 'Tricycle', routeName: stepTitle });
      } else if (lower.includes('angkas') || lower.includes('motorcycle') || lower.includes('habal')) {
        segments.push({ type: 'Motorcycle', routeName: stepTitle });
      }
    } else if (bulletMatch) {
      steps.push({
        order: order++,
        title: bulletMatch[1].trim(),
        description: bulletMatch[2].trim() || bulletMatch[1].trim(),
      });
    }
  }

  if (steps.length === 0) {
    steps.push({ order: 1, title: title, description: summary || 'AI-generated commute guide' });
  }

  return { title, summary, steps, segments };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminGuidesPage() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<GlobalCommuteGuide[]>([]);
  const [routes, setRoutes] = useState<TransitRouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // View state
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editingGuide, setEditingGuide] = useState<GlobalCommuteGuide | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [destination, setDestination] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [fareMin, setFareMin] = useState('');
  const [fareMax, setFareMax] = useState('');
  const [steps, setSteps] = useState<CommuteGuideStep[]>([emptyStep()]);
  const [segments, setSegments] = useState<TransportSegment[]>([emptySegment()]);

  // AI generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<GlobalCommuteGuide | null>(null);

  const flash = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ─── Data Loading ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedGuides, loadedRoutes] = await Promise.all([
        commuteGuidesService.listAllGuides(),
        transitAdminService.listRoutes().catch(() => []),
      ]);
      setGuides(loadedGuides);
      setRoutes(loadedRoutes);
    } catch (err) {
      flash('error', 'Failed to load guides');
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ─── Form Helpers ────────────────────────────────────────────────────────

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setDestination('');
    setDifficulty('Easy');
    setEstimatedTime('');
    setFareMin('');
    setFareMax('');
    setSteps([emptyStep()]);
    setSegments([emptySegment()]);
    setAiPrompt('');
    setEditingGuide(null);
  };

  const populateForm = (guide: GlobalCommuteGuide) => {
    setTitle(guide.title);
    setSummary(guide.summary || '');
    setDestination(guide.destination || '');
    setDifficulty(guide.difficulty || 'Easy');
    setEstimatedTime(guide.estimated_travel_time_min?.toString() || '');
    setFareMin(guide.estimated_fare_min?.toString() || '');
    setFareMax(guide.estimated_fare_max?.toString() || '');
    setSteps(Array.isArray(guide.steps) && guide.steps.length > 0 ? guide.steps : [emptyStep()]);
    setSegments(
      Array.isArray(guide.transport_segments) && guide.transport_segments.length > 0
        ? guide.transport_segments
        : [emptySegment()],
    );
    setEditingGuide(guide);
  };

  // ─── Step Management ─────────────────────────────────────────────────────

  const updateStep = (index: number, field: keyof CommuteGuideStep, value: any) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { ...emptyStep(), order: prev.length + 1 }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  // ─── Segment Management ──────────────────────────────────────────────────

  const updateSegment = (index: number, field: keyof TransportSegment, value: any) => {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSegment = () => {
    setSegments((prev) => [...prev, emptySegment()]);
  };

  const removeSegment = (index: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRouteSelect = (index: number, routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    if (route) {
      // Try to get route-specific fare
      const embedded = transitAdminService.extractRouteFares(route);
      setSegments((prev) =>
        prev.map((s, i) =>
          i === index
            ? {
                ...s,
                routeId: route.id,
                routeName: route.route_name,
                type: route.vehicle_type || 'Jeepney',
                color: route.color_code || '',
                fare: embedded?.regular ?? s.fare,
                fareType: 'regular',
              }
            : s,
        ),
      );
    }
  };

  // ─── AI Generation ───────────────────────────────────────────────────────

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const guidePrompt = `Create a commute guide for: ${aiPrompt}. Include numbered step-by-step directions with transport types (jeepney, tricycle, etc.) and tips.`;
      const reply = await sendAIMessage(guidePrompt);
      const parsed = parseAIGuide(reply.content);
      setTitle(parsed.title);
      setSummary(parsed.summary);
      if (parsed.steps.length > 0) setSteps(parsed.steps);
      if (parsed.segments.length > 0) setSegments(parsed.segments);
      flash('success', 'AI guide generated! Review and edit the fields below.');
    } catch (err) {
      flash('error', 'AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // ─── File Upload ─────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'json' || ext === 'geojson') {
        const json = JSON.parse(text);

        // GeoJSON route file — extract route info as transport segment and match LACVAY routes
        if (
          json.type === 'FeatureCollection' ||
          json.type === 'Feature' ||
          json.type === 'LineString' ||
          json.type === 'MultiLineString'
        ) {
          const features = json.type === 'FeatureCollection' ? json.features || [] : [json];
          const newSegments: TransportSegment[] = [];
          const newSteps: CommuteGuideStep[] = [];
          let matchedCount = 0;

          for (const feat of features) {
            const geomType = feat.geometry?.type || feat.type;
            const props = feat.properties || json.properties || {};

            if (geomType === 'LineString' || geomType === 'MultiLineString' || (!feat.geometry && props.name)) {
              const rawName = props.name || props.route_name || props.routeName || props.title || file.name.replace(/\.(geo)?json$/i, '');

              // Check if matches an existing LACVAY transit route
              const matchedRoute = routes.find(
                (r) =>
                  (props.route_id && r.id === props.route_id) ||
                  (props.id && r.id === props.id) ||
                  (r.route_name && rawName && r.route_name.toLowerCase().includes(rawName.toLowerCase())) ||
                  (rawName && r.route_name && rawName.toLowerCase().includes(r.route_name.toLowerCase())),
              );

              if (matchedRoute) {
                matchedCount++;
                const embedded = transitAdminService.extractRouteFares(matchedRoute);
                newSegments.push({
                  type: matchedRoute.vehicle_type || 'Jeepney',
                  routeId: matchedRoute.id,
                  routeName: matchedRoute.route_name,
                  color: matchedRoute.color_code || '',
                  fare: embedded?.regular ?? (props.fare != null ? Number(props.fare) : null),
                  fareType: 'regular',
                });
              } else {
                newSegments.push({
                  type: props.vehicle_type || 'Jeepney',
                  routeName: rawName,
                  color: props.color || props.color_code || '',
                  fare: props.fare != null ? Number(props.fare) : null,
                });
              }
            } else if (geomType === 'Point' && props.name) {
              newSteps.push({
                order: newSteps.length + 1,
                title: props.name,
                description: props.description || `Stop along the route`,
                tip: props.tip || '',
              });
            }
          }

          if (newSegments.length > 0) {
            setSegments((prev) => [
              ...prev.filter((s) => s.routeName || s.routeId),
              ...newSegments,
            ]);
          }
          if (newSteps.length > 0) {
            setSteps(newSteps);
          }
          const rootProps = json.properties || {};
          if (rootProps.title || rootProps.name) {
            setTitle(rootProps.title || rootProps.name);
          }

          flash(
            'success',
            `Loaded ${newSegments.length} route(s) from GeoJSON${
              matchedCount > 0 ? ` (${matchedCount} matched official LACVAY transit routes with fares)` : ''
            }.`,
          );
        } else if (json.title || json.steps) {
          // Structured guide JSON
          if (json.title) setTitle(json.title);
          if (json.summary) setSummary(json.summary);
          if (json.destination) setDestination(json.destination);
          if (Array.isArray(json.steps)) {
            setSteps(json.steps.map((s: any, i: number) => ({
              order: s.order ?? i + 1,
              title: s.title || `Step ${i + 1}`,
              description: s.description || '',
              tip: s.tip || '',
            })));
          }
          if (Array.isArray(json.transport_segments)) {
            // Auto-reference any existing routes by ID or name
            const mappedSegments = json.transport_segments.map((seg: TransportSegment) => {
              if (seg.routeId) return seg;
              const match = routes.find(
                (r) => seg.routeName && r.route_name.toLowerCase().includes(seg.routeName.toLowerCase()),
              );
              if (match) {
                const fares = transitAdminService.extractRouteFares(match);
                return {
                  ...seg,
                  routeId: match.id,
                  routeName: match.route_name,
                  color: match.color_code || seg.color,
                  fare: fares?.regular ?? seg.fare,
                };
              }
              return seg;
            });
            setSegments(mappedSegments);
          }
          flash('success', 'Guide loaded from JSON file with route references.');
        } else {
          flash('error', 'Unrecognized JSON format.');
        }
      } else {
        // Plain text — send to AI or parse as simple numbered list
        const parsed = parseAIGuide(text);
        setTitle(parsed.title);
        setSummary(parsed.summary);
        if (parsed.steps.length > 0) setSteps(parsed.steps);
        if (parsed.segments.length > 0) setSegments(parsed.segments);
        flash('success', 'Guide parsed from text file.');
      }
    } catch (err) {
      flash('error', 'Failed to parse uploaded file.');
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) {
      flash('error', 'Guide title is required.');
      return;
    }
    if (steps.length === 0 || !steps[0].title.trim()) {
      flash('error', 'At least one direction step is required.');
      return;
    }

    setActionLoading(true);
    try {
      const guideData = {
        title: title.trim(),
        summary: summary.trim() || null,
        destination: destination.trim() || null,
        steps: steps.filter((s) => s.title.trim()),
        transport_segments: segments.filter((s) => s.type.trim()),
        difficulty,
        estimated_travel_time_min: estimatedTime ? parseInt(estimatedTime, 10) : null,
        estimated_fare_min: fareMin ? parseFloat(fareMin) : null,
        estimated_fare_max: fareMax ? parseFloat(fareMax) : null,
        created_by: user?.id || null,
        is_global: true,
      };

      if (editingGuide) {
        await commuteGuidesService.updateGuide(editingGuide.id, guideData);
        flash('success', 'Guide updated successfully!');
      } else {
        await commuteGuidesService.createGuide(guideData as any);
        flash('success', 'Guide created successfully!');
      }

      resetForm();
      setCurrentView('list');
      void loadData();
    } catch (err: any) {
      flash('error', err?.message || 'Failed to save guide.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await commuteGuidesService.deleteGuide(deleteTarget.id);
      flash('success', 'Guide deleted.');
      setDeleteTarget(null);
      void loadData();
    } catch (err: any) {
      flash('error', err?.message || 'Failed to delete guide.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render: List View ───────────────────────────────────────────────────

  if (loading) return <LoadingState />;

  if (currentView === 'list') {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Commute Guides"
          description="Manage global commute guides published for all LACVAY users"
        />

        {notification && (
          <div
            className={cn(
              'rounded-xl px-4 py-3 text-sm font-semibold',
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200',
            )}
          >
            {notification.message}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              resetForm();
              setCurrentView('form');
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Guide
          </Button>
          <Button variant="secondary" onClick={() => void loadData()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {guides.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title="No Commute Guides"
              description="Create your first global commute guide to help travelers navigate Batangas City."
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {guides.map((guide) => {
              const stepCount = Array.isArray(guide.steps) ? guide.steps.length : 0;
              const segCount = Array.isArray(guide.transport_segments) ? guide.transport_segments.length : 0;

              return (
                <Card
                  key={guide.id}
                  className="flex flex-col justify-between space-y-3 border border-gray-100 transition hover:shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{guide.title}</h3>
                        {guide.destination && (
                          <p className="text-xs text-gray-500">→ {guide.destination}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="green">{guide.difficulty || 'Easy'}</Badge>
                        {guide.is_global && <Badge variant="lime">Global</Badge>}
                      </div>
                    </div>

                    {guide.summary && (
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{guide.summary}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                      {stepCount > 0 && <span>{stepCount} steps</span>}
                      {segCount > 0 && <span>· {segCount} transport segments</span>}
                      {guide.estimated_travel_time_min && (
                        <span>· ~{guide.estimated_travel_time_min} min</span>
                      )}
                      {guide.estimated_fare_min != null && guide.estimated_fare_max != null && (
                        <span>
                          · ₱{guide.estimated_fare_min}–₱{guide.estimated_fare_max}
                        </span>
                      )}
                    </div>

                    {/* Transport segment pills */}
                    {segCount > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(guide.transport_segments as TransportSegment[]).map((seg, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-semibold text-gray-700"
                          >
                            {seg.color && (
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: seg.color }}
                              />
                            )}
                            {seg.routeName || seg.type}
                            {seg.fare != null && <span className="text-gray-400">₱{seg.fare}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                    <Button
                      variant="secondary"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => {
                        populateForm(guide);
                        setCurrentView('form');
                      }}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      className="gap-1.5 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(guide)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Guide">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be
            undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleDelete()} disabled={actionLoading} className="bg-red-600 hover:bg-red-700">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── Render: Create / Edit Form ──────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setCurrentView('list');
          }}
          className="rounded-xl p-2 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {editingGuide ? 'Edit Commute Guide' : 'Create Commute Guide'}
          </h1>
          <p className="text-xs text-gray-500">
            {editingGuide
              ? 'Update the guide details below'
              : 'Build a step-by-step commute guide for Batangas City travelers'}
          </p>
        </div>
      </div>

      {notification && (
        <div
          className={cn(
            'rounded-xl px-4 py-3 text-sm font-semibold',
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200',
          )}
        >
          {notification.message}
        </div>
      )}

      {/* AI Generation Section */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Sparkles className="h-4 w-4 text-lacvay-green" />
          <h2 className="font-bold text-gray-900 text-sm">Generate with LACVAY AI</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. How to get from Grand Terminal to SM City Batangas..."
            className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-lacvay-green focus:outline-none focus:ring-2 focus:ring-lacvay-green/20"
            onKeyDown={(e) => e.key === 'Enter' && void handleAIGenerate()}
          />
          <Button onClick={() => void handleAIGenerate()} disabled={aiLoading || !aiPrompt.trim()} className="gap-1.5">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </Button>
        </div>
        <p className="text-[11px] text-gray-400">
          AI will generate guide steps and transport suggestions based on your prompt.
        </p>
      </Card>

      {/* File Upload Section */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <FileUp className="h-4 w-4 text-lacvay-green" />
          <h2 className="font-bold text-gray-900 text-sm">Upload Guide File</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,.geojson"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
            <FileUp className="h-4 w-4" />
            Choose File
          </Button>
          <span className="text-xs text-gray-500">Supports .txt, .json, .geojson</span>
        </div>
      </Card>

      {/* Basic Info */}
      <Card className="space-y-4">
        <h2 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Guide Details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grand Terminal to SM Batangas" />
          <Input label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. SM City Batangas" />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief description of this commute route..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-lacvay-green focus:outline-none focus:ring-2 focus:ring-lacvay-green/20 resize-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-lacvay-green focus:outline-none focus:ring-2 focus:ring-lacvay-green/20"
            >
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
            </select>
          </div>
          <Input label="Est. Travel Time (min)" type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="30" />
          <Input label="Min Fare (₱)" type="number" value={fareMin} onChange={(e) => setFareMin(e.target.value)} placeholder="14" />
          <Input label="Max Fare (₱)" type="number" value={fareMax} onChange={(e) => setFareMax(e.target.value)} placeholder="32" />
        </div>
      </Card>

      {/* Transport Segments Builder */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="font-bold text-gray-900 text-sm">Transport Segments</h2>
          <Button variant="secondary" onClick={addSegment} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Segment
          </Button>
        </div>

        <p className="text-[11px] text-gray-500">
          Define each transport leg of the journey. For LACVAY-managed jeepney routes, select from the dropdown to auto-fill fare and color.
        </p>

        {segments.map((seg, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                {seg.color && (
                  <span className="h-3 w-3 rounded-full border border-gray-200" style={{ backgroundColor: seg.color }} />
                )}
                Leg {i + 1}: {seg.routeName || seg.type}
              </span>
              {segments.length > 1 && (
                <button type="button" onClick={() => removeSegment(i)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Type</label>
                <select
                  value={seg.type}
                  onChange={(e) => updateSegment(i, 'type', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:border-lacvay-green focus:outline-none"
                >
                  <option value="Jeepney">Jeepney</option>
                  <option value="Tricycle">Tricycle</option>
                  <option value="Motorcycle">Motorcycle / Habal-habal</option>
                  <option value="Angkas">Angkas</option>
                  <option value="Taxi">Taxi</option>
                  <option value="Walking">Walking</option>
                  <option value="Other">Other (3rd Party)</option>
                </select>
              </div>

              {(seg.type === 'Jeepney' || seg.type === 'Tricycle') && routes.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Route (LACVAY)</label>
                  <select
                    value={seg.routeId || ''}
                    onChange={(e) => handleRouteSelect(i, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:border-lacvay-green focus:outline-none"
                  >
                    <option value="">— Manual / None —</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name} ({getTransitColorMeta(r.color_code).label})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  {seg.routeName ? 'Route Name' : 'Provider Name'}
                </label>
                <input
                  type="text"
                  value={seg.routeName || ''}
                  onChange={(e) => updateSegment(i, 'routeName', e.target.value)}
                  placeholder={seg.type === 'Angkas' ? 'Angkas' : 'Route name'}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:border-lacvay-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Fare (₱)</label>
                <input
                  type="number"
                  value={seg.fare ?? ''}
                  onChange={(e) => updateSegment(i, 'fare', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="—"
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:border-lacvay-green focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Steps (Directions) Builder */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="font-bold text-gray-900 text-sm">Step-by-Step Directions</h2>
          <Button variant="secondary" onClick={addStep} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Step
          </Button>
        </div>

        {steps.map((step, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-xs font-bold text-white mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={step.title}
                onChange={(e) => updateStep(i, 'title', e.target.value)}
                placeholder="Step title (e.g. Board jeepney at Grand Terminal)"
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold focus:border-lacvay-green focus:outline-none"
              />
              <textarea
                value={step.description}
                onChange={(e) => updateStep(i, 'description', e.target.value)}
                placeholder="Description and details..."
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs focus:border-lacvay-green focus:outline-none resize-none"
              />
              <input
                type="text"
                value={step.tip || ''}
                onChange={(e) => updateStep(i, 'tip', e.target.value)}
                placeholder="💡 Tip (optional)"
                className="w-full rounded-lg border border-dashed border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 focus:border-lacvay-green focus:outline-none"
              />
            </div>
            {steps.length > 1 && (
              <button type="button" onClick={() => removeStep(i)} className="mt-0.5 text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </Card>

      {/* Save Actions */}
      <div className="flex items-center gap-3 pb-8">
        <Button onClick={() => void handleSave()} disabled={actionLoading} className="gap-2">
          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editingGuide ? 'Update Guide' : 'Publish Guide'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            resetForm();
            setCurrentView('list');
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
