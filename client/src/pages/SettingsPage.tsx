import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { formatRateSummary } from '@/lib/partnerRates';
import { getTransportLabel } from '@/lib/transport';

export default function SettingsPage() {
  const { user, signOut, updateUser, isTranspoPartner } = useAuth();
  const profile = user?.partnerProfile;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [baseFare, setBaseFare] = useState(String(profile?.baseFare ?? 25));
  const [perKmFee, setPerKmFee] = useState(String(profile?.perKmFee ?? 8));
  const [vehicleLabel, setVehicleLabel] = useState(profile?.vehicleLabel ?? '');
  const [plateNumber, setPlateNumber] = useState(profile?.plateNumber ?? '');
  const { showToast } = useApp();

  const save = () => {
    if (isTranspoPartner && profile) {
      updateUser({
        partnerProfile: {
          ...profile,
          baseFare: parseFloat(baseFare) || profile.baseFare,
          perKmFee: parseFloat(perKmFee) || profile.perKmFee,
          vehicleLabel: vehicleLabel.trim() || profile.vehicleLabel,
          plateNumber: plateNumber.trim() || undefined,
        },
      });
    }
    showToast('Settings saved');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your profile and preferences</p>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold text-gray-900">Profile</h3>
        <div className="flex items-center gap-4">
          <img src={user?.avatarUrl} alt="" className="h-16 w-16 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
        </div>
      </Card>

      {isTranspoPartner && profile && (
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-gray-900">Partner rates</h3>
            <p className="mt-1 text-sm text-gray-500">
              Shown to passengers on the map when you are online.
            </p>
          </div>
          <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {getTransportLabel(profile.vehicleType)}
            {' · '}
            Current: {formatRateSummary(profile.baseFare, profile.perKmFee)}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Base fare (₱)"
              type="number"
              min={1}
              value={baseFare}
              onChange={(e) => setBaseFare(e.target.value)}
            />
            <Input
              label="Per km fee (₱)"
              type="number"
              min={1}
              value={perKmFee}
              onChange={(e) => setPerKmFee(e.target.value)}
            />
          </div>
          <Input
            label="Vehicle details"
            value={vehicleLabel}
            onChange={(e) => setVehicleLabel(e.target.value)}
            placeholder="e.g. 125cc · helmet provided"
          />
          <Input
            label="Plate number"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="MC 1234"
          />
        </Card>
      )}

      <Card className="space-y-4">
        <h3 className="font-bold text-gray-900">Preferences</h3>
        <Select
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'fil', label: 'Filipino' },
          ]}
        />
        <Select
          label="Theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark (coming soon)' },
          ]}
        />
        <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium">Notifications</span>
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="h-5 w-5 accent-lacvay-green" />
        </label>
        <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium">Location permissions</span>
          <input type="checkbox" checked={location} onChange={(e) => setLocation(e.target.checked)} className="h-5 w-5 accent-lacvay-green" />
        </label>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-bold text-gray-900">Privacy & Account</h3>
        <button type="button" className="block text-sm text-gray-600 hover:text-lacvay-green">Privacy Policy</button>
        <button type="button" className="block text-sm text-gray-600 hover:text-lacvay-green">Terms of Service</button>
        <button type="button" className="block text-sm text-red-600 hover:underline">Delete Account</button>
      </Card>

      <Button className="w-full" onClick={save}>Save Settings</Button>

      <button
        type="button"
        onClick={() => void signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
