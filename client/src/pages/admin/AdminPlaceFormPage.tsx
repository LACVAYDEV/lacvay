import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/States';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { adminService } from '@/services/adminService';
import { useApp } from '@/context/AppContext';
import { emptySpot, placeCategories } from '@/pages/admin/adminPlaceUtils';
import type { TouristCategory, TouristSpot } from '@/types';

export default function AdminPlaceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptySpot());

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const spot = await adminService.getPlace(id);
        if (!cancelled && spot) setForm({ ...spot });
      } catch {
        if (!cancelled) showToast('Could not load tourist spot');
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
    try {
      if (isEditing && id) {
        await adminService.updatePlace({ ...form, id } as TouristSpot);
        showToast('Tourist spot updated');
      } else {
        await adminService.createPlace(form);
        showToast('Tourist spot created');
      }
      navigate('/admin/places');
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
        to="/admin/places"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-lacvay-green hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tourist spots
      </Link>

      <div>
        <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-lacvay-green-dark sm:text-[26px]">
          {isEditing ? 'Edit tourist spot' : 'Add tourist spot'}
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          {isEditing ? 'Update destination details shown to travelers.' : 'Create a new destination for the app.'}
        </p>
      </div>

      <Card className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input
          label="Short description"
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Full description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/20"
          />
        </div>
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as TouristCategory })}
          options={placeCategories.map((c) => ({ value: c, label: c }))}
        />
        <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <ImageUploadField
          label="Image"
          value={form.imageUrl}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          folder="places"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={form.coordinates.lat}
            onChange={(e) =>
              setForm({ ...form, coordinates: { ...form.coordinates, lat: parseFloat(e.target.value) || 0 } })
            }
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={form.coordinates.lng}
            onChange={(e) =>
              setForm({ ...form, coordinates: { ...form.coordinates, lng: parseFloat(e.target.value) || 0 } })
            }
          />
        </div>
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
            label="Travel time"
            value={form.estimatedTravelTime}
            onChange={(e) => setForm({ ...form, estimatedTravelTime: e.target.value })}
          />
        </div>
        <Input
          label="Opening hours"
          value={form.openingHours}
          onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
        />
        <div className="flex flex-wrap gap-2 pt-2">
          <Button className="flex-1 sm:flex-none" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create spot'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/places')}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
