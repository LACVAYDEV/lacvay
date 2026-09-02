import { useState } from 'react';
import type { TransportType } from '@/types';
import { calculateFare } from '@/lib/fareCalculator';
import { fareCheckerOptions, getTransportLabel } from '@/lib/transport';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatFareRange } from '@/lib/utils';

export default function FaresPage() {
  const [origin, setOrigin] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [transport, setTransport] = useState<TransportType>('jeepney');
  const [distance, setDistance] = useState('');
  const [result, setResult] = useState<ReturnType<typeof calculateFare> | null>(null);
  const { addHistory } = useApp();

  const handleCalculate = () => {
    if (!destination.trim()) return;
    const dist = distance ? parseFloat(distance) : undefined;
    const fare = calculateFare(origin, destination, transport, dist);
    setResult(fare);
    addHistory({ query: `${origin} → ${destination}`, type: 'fare', meta: transport });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Fare Checker</h2>
        <p className="text-sm text-gray-500">
          Estimate fares for jeepneys, tricycles, motorcycle taxis, and taxis
        </p>
      </div>

      <Card className="space-y-4">
        <Input label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
        <Input label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where to?" />
        <Select
          label="Transportation type"
          value={transport}
          onChange={(e) => setTransport(e.target.value as TransportType)}
          options={fareCheckerOptions.map((o) => ({ value: o.type, label: o.label }))}
        />
        <Input label="Distance (km, optional)" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="Auto-estimate if empty" type="number" step="0.1" />
        <Button className="w-full" onClick={handleCalculate}>Calculate Fare</Button>
      </Card>

      {result && (
        <Card className="bg-gradient-to-br from-lacvay-green/5 to-lacvay-lime/10">
          <p className="text-sm text-gray-500">Estimated Fare by {getTransportLabel(result.transportType)}</p>
          <p className="mt-1 text-3xl font-extrabold text-lacvay-green-dark">
            {formatFareRange(result.estimatedFareMin, result.estimatedFareMax)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Distance</p>
              <p className="font-semibold">{result.distanceKm} km</p>
            </div>
            <div>
              <p className="text-gray-500">Travel Time</p>
              <p className="font-semibold">{result.estimatedTravelTimeMin} minutes</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
