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
import { emptyPromotion } from '@/pages/admin/adminPromotionUtils';
import type { Promotion } from '@/types';

export default function AdminPromotionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyPromotion());

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const promotion = await adminService.getPromotion(id);
        if (!cancelled && promotion) setForm({ ...promotion, isActive: promotion.isActive !== false });
      } catch {
        if (!cancelled) showToast('Could not load promotion');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  const save = async () => {
    if (!form.title.trim()) {
      showToast('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && id) {
        await adminService.updatePromotion({ ...form, id } as Promotion);
        showToast('Ad updated');
      } else {
        await adminService.createPromotion(form);
        showToast('Ad created');
      }
      navigate('/admin/promotions');
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
        to="/admin/promotions"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-lacvay-green hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to promotions
      </Link>

      <div>
        <h1 className="sr-only">{isEditing ? 'Edit ad' : 'Create ad'}</h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Promotions are ads shown to travelers on the home page and promotions screen. Add an image or video creative.
        </p>
      </div>

      <Card className="space-y-4">
        <Input label="Ad title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Ad copy</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-lacvay-green focus:bg-white focus:ring-2 focus:ring-lacvay-green/20"
            placeholder="Short message travelers will read…"
          />
        </div>
        <MediaUploadField
          label="Ad media (image or video)"
          value={form.imageUrl ?? ''}
          onChange={(url) => setForm({ ...form, imageUrl: url })}
          folder="promotions"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Promo code (optional)"
            value={form.promoCode ?? ''}
            onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
          />
          <Input
            label="Discount label (optional)"
            value={form.discount ?? ''}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
            placeholder="10% OFF"
          />
        </div>
        <Input
          label="Valid until (optional)"
          type="date"
          value={form.validUntil ?? ''}
          onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
        />
        <label className="flex items-center gap-2 rounded-2xl bg-lacvay-cream/70 px-4 py-3 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive !== false}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="h-4 w-4 accent-lacvay-green"
          />
          Published — show this ad to travelers
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button className="flex-1 sm:flex-none" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Publish ad'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/promotions')}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
