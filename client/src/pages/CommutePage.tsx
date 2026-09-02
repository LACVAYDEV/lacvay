import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { CommuteGuide } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { transportIcons } from '@/components/ui/TransportIcons';
import { getTransportLabel } from '@/lib/transport';
import { formatFareRange } from '@/lib/utils';

export default function CommutePage() {
  const [guides, setGuides] = useState<CommuteGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CommuteGuide | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    dataService.getCommuteGuides().then((g) => {
      setGuides(g);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState />;
  if (!guides.length) return <EmptyState title="No commute guides yet" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Commute Guide</h2>
        <p className="text-sm text-gray-500">Step-by-step guides for getting around Batangas City</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {guides.map((g) => (
            <Card
              key={g.id}
              className={`cursor-pointer transition ${selected?.id === g.id ? 'ring-2 ring-lacvay-green' : 'hover:shadow-lg'}`}
              onClick={() => setSelected(g)}
            >
              <h3 className="font-bold text-gray-900">{g.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="gray">{g.difficulty}</Badge>
                <Badge>{g.estimatedTravelTimeMin} min</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {g.transportTypes.map((type) => {
                  const Icon = transportIcons[type];
                  return (
                    <span
                      key={type}
                      title={getTransportLabel(type)}
                      className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10.5px] font-semibold text-gray-600"
                    >
                      <Icon className="h-3 w-3" />
                      {getTransportLabel(type)}
                    </span>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {selected ? (
          <Card>
            <h3 className="text-xl font-bold text-gray-900">{selected.title}</h3>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selected.destination}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selected.estimatedTravelTimeMin} min</span>
              <span>{formatFareRange(selected.estimatedFareMin, selected.estimatedFareMax)}</span>
            </div>
            <ol className="mt-6 space-y-4">
              {selected.steps.map((step) => (
                <li key={step.order} className="flex gap-4 rounded-2xl bg-gray-50 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-sm font-bold text-white">
                    {step.order}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => navigate(`/map?to=${encodeURIComponent(selected.destination)}`)}
              className="mt-6 text-sm font-semibold text-lacvay-green hover:underline"
            >
              View on map →
            </button>
          </Card>
        ) : (
          <Card>
            <EmptyState title="Select a guide" description="Choose a commute guide from the list to see step-by-step directions." />
          </Card>
        )}
      </div>
    </div>
  );
}
