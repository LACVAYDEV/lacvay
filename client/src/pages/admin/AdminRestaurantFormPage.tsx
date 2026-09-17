import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/States';
import { MediaUploadField } from '@/components/admin/MediaUploadField';
import { adminService } from '@/services/adminService';
import { useApp } from '@/context/AppContext';
import { emptyRestaurant } from '@/pages/admin/adminRestaurantUtils';
import { formatOpeningHours, isCurrentlyOpenNow } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';

export default function AdminRestaurantFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyRestaurant());

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const restaurant = await adminService.getRestaurant(id);
        if (!cancelled && restaurant) {
          setForm({
            ...restaurant,
            openTime: restaurant.openTime || '08:00',
            closeTime: restaurant.closeTime || '21:00',
            location: 'Batangas City',
            coordinates: restaurant.coordinates || { lat: 13.7565, lng: 121.0583 },
          });
        }
      } catch {
        if (!cancelled) showToast('Could not load eatery');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  const save = async () => {
    if (!form.name.trim()) {
      showToast('Name is required');
      return;
    }
    setSaving(true);
    const formattedHours = formatOpeningHours(form.openTime, form.closeTime);
    const payload = {
      ...form,
      location: 'Batangas City',
      openingHours: formattedHours,
      isOpen: isCurrentlyOpenNow(form.openTime, form.closeTime),
    };
    try {
      if (isEditing && id) {
        await adminService.updateRestaurant({ ...payload, id } as Restaurant);
        showToast('Eatery updated');
      } else {
        await adminService.createRestaurant(payload);
        showToast('Eatery created');
      }
      navigate('/admin/restaurants');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentlyOpen = isCurrentlyOpenNow(form.openTime, form.closeTime);

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/admin/restaurants"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-lacvay-green hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to eateries
      </Link>

      <div>
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-lacvay-green-dark sm:text-[26px]">
          {isEditing ? 'Edit eatery' : 'Add eatery'}
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          {isEditing ? 'Update restaurant details shown to travelers.' : 'Create a new dining listing for the app.'}
        </p>
      </div>

      <Card className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/20"
          />
        </div>

        <MediaUploadField
          label="Eatery media (image or video)"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          folder="restaurants"
        />

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={form.coordinates?.lat ?? 13.7565}
            onChange={(e) =>
              setForm({
                ...form,
                coordinates: {
                  lat: parseFloat(e.target.value) || 0,
                  lng: form.coordinates?.lng ?? 121.0583,
                },
              })
            }
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={form.coordinates?.lng ?? 121.0583}
            onChange={(e) =>
              setForm({
                ...form,
                coordinates: {
                  lat: form.coordinates?.lat ?? 13.7565,
                  lng: parseFloat(e.target.value) || 0,
                },
              })
            }
          />
        </div>

        <Input
          label="Price range"
          value={form.priceRange}
          onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
          placeholder="₱₱ (e.g. ₱, ₱₱, ₱₱₱)"
        />

        {/* Operating Hours */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Operating hours</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Opens at</label>
              <input
                type="time"
                value={form.openTime || '08:00'}
                onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Closes at</label>
              <input
                type="time"
                value={form.closeTime || '21:00'}
                onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/20"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Formatted display:{' '}
            <span className="font-semibold text-gray-700">
              {formatOpeningHours(form.openTime, form.closeTime) || 'Not set'}
            </span>
          </p>
        </div>

        {/* Dynamic Open/Closed Status Indicator */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-lacvay-cream/60 p-4">
          <div className="space-y-0.5">
            <span className="block text-sm font-bold text-gray-900">Live Operating Status</span>
            <span className="block text-xs text-gray-500">
              Automatically determined from opening hours vs current time.
            </span>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
              isCurrentlyOpen
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isCurrentlyOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500',
              )}
            />
            {isCurrentlyOpen ? 'Currently Open' : 'Currently Closed'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button className="flex-1 sm:flex-none" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create eatery'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/restaurants')}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
