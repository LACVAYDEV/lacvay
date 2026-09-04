import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Info, Loader2, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BATANGAS_CENTER } from '@/data/mockData';
import type { OnDemandVehicle } from '@/types';
import { cn } from '@/lib/utils';

export default function BecomeDriverPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [vehicleType, setVehicleType] = useState<OnDemandVehicle>('motorcycle');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    if (!vehicleDetails.trim() || !contactNumber.trim() || !baseFare || !perKmRate) {
      setError('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      updateUser({
        role: 'transpo_partner',
        partnerProfile: {
          vehicleType,
          vehicleLabel: vehicleDetails.trim(),
          plateNumber: contactNumber.trim(),
          baseFare: Number(baseFare),
          perKmFee: Number(perKmRate),
          coordinates: BATANGAS_CENTER,
          isOnline: false,
          rating: 5,
          tripsCompleted: 0,
          acceptanceRate: 100,
        },
      });
      navigate('/partner', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register as driver. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-gray-200 bg-white py-3 px-4 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-lacvay-green focus:ring-2 focus:ring-lacvay-green/15';
  const labelClass = 'mb-1.5 block text-[12px] font-medium text-gray-700';

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Become a Transport Partner</h2>
        <p className="text-sm text-gray-500">Set your rates and start accepting taxi or habal-habal bookings.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vehicleType" className={labelClass}>Vehicle Type</label>
            <div className="relative">
              <Car className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as OnDemandVehicle)}
                className={cn(inputClass, 'pl-11 appearance-none')}
              >
                <option value="motorcycle">Habal-habal</option>
                <option value="taxi">Taxi</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="vehicleDetails" className={labelClass}>Vehicle Details (Make/Model/Plate No.)</label>
            <div className="relative">
              <Info className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="vehicleDetails"
                type="text"
                value={vehicleDetails}
                onChange={(e) => setVehicleDetails(e.target.value)}
                placeholder="e.g. Honda TMX / ABC-123"
                className={cn(inputClass, 'pl-11')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contactNumber" className={labelClass}>Contact Number</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="contactNumber"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="0912 345 6789"
                className={cn(inputClass, 'pl-11')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="baseFare" className={labelClass}>Base Fare (₱)</label>
              <input
                id="baseFare"
                type="number"
                min="0"
                step="1"
                value={baseFare}
                onChange={(e) => setBaseFare(e.target.value)}
                placeholder="40"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="perKmRate" className={labelClass}>Per KM Rate (₱)</label>
              <input
                id="perKmRate"
                type="number"
                min="0"
                step="1"
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                placeholder="10"
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-[12px] font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-lacvay-green py-3.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-lacvay-green-dark disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Register as Transport Partner
          </button>
        </form>
      </div>
    </div>
  );
}
