import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info, MapPin, Search } from 'lucide-react';
import { findTodaByBarangay, todaTerritories } from '@/data/todaMockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { transportIcons } from '@/components/ui/TransportIcons';

const TricycleIcon = transportIcons.tricycle;

export default function TodaTerritoriesPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('to') || params.get('from') || '');

  const results = useMemo(() => findTodaByBarangay(query), [query]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-lacvay-green">Tricycle · TODA only</p>
        <h2 className="text-2xl font-bold text-gray-900">TODA Territories</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Tricycles in Batangas City operate within registered TODA (Tricycle Operators and
          Drivers Association) areas. They are not bookable in LACVAY — find your zone below and
          hail at the terminal or trike stand. For app bookings, use{' '}
          <span className="font-medium text-gray-700">taxi</span> or{' '}
          <span className="font-medium text-gray-700">habal-habal</span>.
        </p>
      </div>

      <Card className="flex gap-3 border-lacvay-green/20 bg-lacvay-green/[0.04]">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-lacvay-green" />
        <p className="text-[13px] leading-relaxed text-gray-600">
          Each TODA covers specific barangays. Drivers cannot pick up outside their registered
          territory. Fares are negotiated or posted at the stand — use the Fare Checker for estimates.
        </p>
      </Card>

      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search barangay, TODA name, or terminal…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-[13px] outline-none transition focus:border-lacvay-green"
        />
      </div>

      <p className="text-sm text-gray-500">
        {results.length} TODA{results.length === 1 ? '' : 's'}
        {query.trim() ? ` matching “${query.trim()}”` : ' in Batangas City'}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {results.map((toda) => (
          <Card key={toda.id} className="flex flex-col">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lacvay-green/10 text-lacvay-green">
                <TricycleIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900">{toda.name}</h3>
                <p className="mt-1 flex items-start gap-1.5 text-[12.5px] text-gray-500">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lacvay-green" />
                  {toda.terminalLocation}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Covered barangays
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {toda.barangays.map((b) => (
                  <Badge key={b} variant="gray">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-2 border-t border-gray-100 pt-4 text-[12.5px] sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium text-gray-400">Hours</p>
                <p className="mt-0.5 text-gray-700">{toda.operatingHours}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400">Typical fare</p>
                <p className="mt-0.5 text-gray-700">{toda.fareNote}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {results.length === 0 && (
        <Card>
          <p className="text-sm text-gray-600">
            No TODA found for that search. Try a barangay name like Poblacion, Alangilan, or Bolbok.
          </p>
        </Card>
      )}

      {!query.trim() && (
        <p className="text-center text-[12px] text-gray-400">
          Showing all {todaTerritories.length} registered TODA zones · data for demo purposes
        </p>
      )}
    </div>
  );
}
