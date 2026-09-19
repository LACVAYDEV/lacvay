import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, ArrowRight, Bus } from 'lucide-react';
import { commuteGuidesService } from '@/services/commuteGuidesService';
import type { GlobalCommuteGuide, TransportSegment } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, EmptyState } from '@/components/ui/States';

export default function CommutePage() {
  const [guides, setGuides] = useState<GlobalCommuteGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GlobalCommuteGuide | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    commuteGuidesService.listGlobalGuides().then((g) => {
      setGuides(g);
      setLoading(false);
    });
  }, []);

  const handleViewRoute = (guide: GlobalCommuteGuide) => {
    navigate('/map', {
      state: {
        commuteGuide: {
          id: guide.id,
          title: guide.title,
          summary: guide.summary,
          destination: guide.destination,
          steps: Array.isArray(guide.steps) ? guide.steps : [],
          transport_segments: Array.isArray(guide.transport_segments) ? guide.transport_segments : [],
          estimated_fare_min: guide.estimated_fare_min,
          estimated_fare_max: guide.estimated_fare_max,
          estimated_travel_time_min: guide.estimated_travel_time_min,
        },
      },
    });
  };

  if (loading) return <LoadingState />;

  if (!guides.length) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commute Guide</h2>
          <p className="text-sm text-gray-500">Step-by-step guides for getting around Batangas City</p>
        </div>
        <Card className="p-8 text-center">
          <EmptyState
            title="No Commute Guides Available"
            description="Official commute guides will appear here once published by the LACVAY team."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Commute Guide</h2>
        <p className="text-sm text-gray-500">Step-by-step guides for getting around Batangas City</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Guide List */}
        <div className="space-y-3">
          {guides.map((g) => {
            const segments: TransportSegment[] = Array.isArray(g.transport_segments)
              ? g.transport_segments
              : [];

            return (
              <Card
                key={g.id}
                className={`cursor-pointer transition ${selected?.id === g.id ? 'ring-2 ring-lacvay-green' : 'hover:shadow-lg'}`}
                onClick={() => setSelected(g)}
              >
                <h3 className="font-bold text-gray-900">{g.title}</h3>
                {g.destination && (
                  <p className="text-xs text-gray-500 mt-0.5">→ {g.destination}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="gray">{g.difficulty || 'Easy'}</Badge>
                  {g.estimated_travel_time_min && (
                    <Badge>~{g.estimated_travel_time_min} min</Badge>
                  )}
                  {g.estimated_fare_min != null && g.estimated_fare_max != null && (
                    <Badge variant="lime">
                      ₱{g.estimated_fare_min}–₱{g.estimated_fare_max}
                    </Badge>
                  )}
                </div>

                {/* Transport segment pills */}
                {segments.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {segments.map((seg, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10.5px] font-semibold text-gray-600"
                      >
                        {seg.color && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: seg.color }}
                          />
                        )}
                        <Bus className="h-3 w-3" />
                        {seg.routeName || seg.type}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Selected Guide Detail */}
        {selected ? (
          <Card className="space-y-5">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{selected.title}</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                {selected.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {selected.destination}
                  </span>
                )}
                {selected.estimated_travel_time_min && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> ~{selected.estimated_travel_time_min} min
                  </span>
                )}
                {selected.estimated_fare_min != null && selected.estimated_fare_max != null && (
                  <span>₱{selected.estimated_fare_min}–₱{selected.estimated_fare_max}</span>
                )}
              </div>
            </div>

            {selected.summary && (
              <p className="text-sm text-gray-600 leading-relaxed bg-emerald-50/50 border border-emerald-100/60 p-3 rounded-xl">
                {selected.summary}
              </p>
            )}

            {/* Transport Segments */}
            {Array.isArray(selected.transport_segments) && selected.transport_segments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Transport Needed
                </h4>
                <div className="space-y-2">
                  {(selected.transport_segments as TransportSegment[]).map((seg, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        {seg.color && (
                          <span
                            className="h-3 w-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: seg.color }}
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {seg.routeName || seg.type}
                          </p>
                          <p className="text-[10.5px] text-gray-500">{seg.type}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {seg.fare != null ? `₱${seg.fare}` : 'Varies'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-step Directions */}
            {Array.isArray(selected.steps) && selected.steps.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Step-by-Step Directions
                </h4>
                <ol className="space-y-3">
                  {selected.steps.map((step: any) => (
                    <li key={step.order} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-sm font-bold text-white">
                        {step.order}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{step.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                        {step.tip && (
                          <p className="mt-1.5 text-xs text-lacvay-green font-medium">
                            💡 {step.tip}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* View Route Button */}
            <Button
              onClick={() => handleViewRoute(selected)}
              className="w-full gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              View on Map & Routes
            </Button>
          </Card>
        ) : (
          <Card>
            <EmptyState
              title="Select a guide"
              description="Choose a commute guide from the list to see step-by-step directions and transport details."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
