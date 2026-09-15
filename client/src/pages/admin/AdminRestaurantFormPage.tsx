import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/States';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { adminService } from '@/services/adminService';
import { useApp } from '@/context/AppContext';
import { cuisineOptions, emptyRestaurant, parseCuisineInput } from '@/pages/admin/adminRestaurantUtils';
export default function AdminRestaurantFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyRestaurant());
  const [cuisineInput, setCuisineInput] = useState('Filipino');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const restaurant = await adminService.getRestaurant(id);
        if (!cancelled && restaurant) {
          setForm({ ...restaurant });
          setCuisineInput(restaurant.cuisine.join(', '));
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
    const payload = { ...form, cuisine: parseCuisineInput(cuisineInput) };
    try {
      if (isEditing && id) {
        await adminService.updateRestaurant({ ...payload, id });
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
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-lacvay-green-dark">
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
        <Input
          label="Cuisine (comma-separated)"
          value={cuisineInput}
          onChange={(e) => setCuisineInput(e.target.value)}
          placeholder={cuisineOptions.join(', ')}
        />
        <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <ImageUploadField
          label="Image"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          folder="restaurants"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Distance (km)"
            type="number"
            step="0.1"
            value={form.distanceKm}
            onChange={(e) => setForm({ ...form, distanceKm: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <Input
          label="Price range"
          value={form.priceRange}
          onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
          placeholder="₱₱"
        />
        <Input
          label="Opening hours"
          value={form.openingHours}
          onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
        />
        <label className="flex items-center gap-2 rounded-2xl bg-lacvay-cream/70 px-4 py-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.isOpen}
            onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
            className="h-4 w-4 accent-lacvay-green"
          />
          Currently open
        </label>
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
