import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Trash2, Mail, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usePromptLimit } from '@/hooks/usePromptLimit';
import { supabase } from '@/lib/supabase';
import { updateUserMetadata } from '@/lib/userMetadata';
import { Modal } from '@/components/ui/Modal';
import { accountService } from '@/services/accountService';
import {
  getPreferencesStorageKey,
  readPreferences,
  type StoredPreferences,
} from '@/lib/preferences';

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { isPremium, remainingPrompts, totalPrompts } = usePromptLimit();
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [language, setLanguage] = useState<'en'>('en');
  const [theme, setTheme] = useState<'light'>('light');
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const preferences = readPreferences(user);
    setLanguage(preferences.language);
    setTheme(preferences.theme);
    setNotifications(Boolean(preferences.notifications));
    setLocation(Boolean(preferences.location));
    setName(profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
    setEmail(user?.email ?? '');
  }, [profile?.full_name, user]);

  const save = async () => {
    if (!user) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setSaving(true);
    setError(null);
    const preferences: StoredPreferences = { language, theme, notifications, location };
    const emailChanged = trimmedEmail.toLowerCase() !== user.email?.toLowerCase();
    try {
      await updateUserMetadata({ full_name: trimmedName, preferences });
    } catch (metadataError) {
      setError(metadataError instanceof Error ? metadataError.message : 'Could not update account settings.');
      setSaving(false);
      return;
    }

    let profileEmail = user.email ?? trimmedEmail;
    if (emailChanged) {
      const { data: authData, error: authError } = await supabase.auth.updateUser({ email: trimmedEmail });
      if (authError) {
        setError(authError.message);
        setSaving(false);
        return;
      }
      profileEmail = authData.user.email ?? profileEmail;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName,
        email: profileEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (profileError) {
      setError(`Your account was updated, but the profile could not be saved: ${profileError.message}`);
      setSaving(false);
      return;
    }

    localStorage.setItem(getPreferencesStorageKey(user.id), JSON.stringify(preferences));
    await refreshProfile();
    showToast(emailChanged ? 'Settings saved. Confirm your new email address to finish the change.' : 'Settings saved');
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (!user?.email || deleteConfirmation.trim().toLowerCase() !== user.email.toLowerCase()) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await accountService.deleteCurrentAccount(deleteConfirmation);
      Object.keys(localStorage)
        .filter((key) => key.startsWith('lacvay-'))
        .forEach((key) => localStorage.removeItem(key));
      await supabase.auth.signOut({ scope: 'local' });
      navigate('/welcome', { replace: true });
    } catch (deleteAccountError) {
      setDeleteError(
        deleteAccountError instanceof Error
          ? deleteAccountError.message
          : 'Could not delete your account.',
      );
      setDeleting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-2">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex h-full flex-col gap-4">
          <h3 className="text-base font-bold text-gray-900">Profile</h3>
          <div className="flex items-center gap-4">
            <img
              src={
                user?.user_metadata?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
              }
              alt=""
              className="h-16 w-16 shrink-0 rounded-full bg-gray-100 ring-2 ring-lacvay-blush"
            />
            <p className="text-sm text-gray-500">Update how LACVAY shows your name and sign-in email.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
        </Card>

        <Card className="flex h-full flex-col gap-4">
          <h3 className="text-base font-bold text-gray-900">Preferences</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Select
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en')}
                options={[{ value: 'en', label: 'English' }]}
              />
              <p className="mt-1 text-xs text-gray-500">Filipino translation is not available yet.</p>
            </div>
            <div>
              <Select
                label="Theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light')}
                options={[{ value: 'light', label: 'Light' }]}
              />
              <p className="mt-1 text-xs text-gray-500">Dark theme is not available yet.</p>
            </div>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-lacvay-cream px-4 py-3 transition hover:bg-lacvay-blush/70">
              <span>
                <span className="block text-sm font-medium">Notifications</span>
                <span className="block text-xs text-gray-500">Safety reminders and local deals.</span>
              </span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-lacvay-green"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-lacvay-cream px-4 py-3 transition hover:bg-lacvay-blush/70">
              <span>
                <span className="block text-sm font-medium">Use location features</span>
                <span className="block text-xs text-gray-500">Asked only when a feature needs GPS.</span>
              </span>
              <input
                type="checkbox"
                checked={location}
                onChange={(e) => setLocation(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-lacvay-green"
              />
            </label>
          </div>
        </Card>

        <Card className="flex h-full flex-col gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-lacvay-green" />
            <h3 className="text-base font-bold text-gray-900">Subscription & Limits</h3>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Type</p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                {isPremium ? '✨ Premium' : '🆓 Free'}
              </p>
            </div>
            {!isPremium && (
              <div className="rounded-lg bg-lacvay-green/5 p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Weekly AI Prompts</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-lacvay-green">{remainingPrompts}</span>
                  <span className="text-xs text-gray-600">of {totalPrompts} remaining</span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-lacvay-green"
                    style={{ width: `${(remainingPrompts / totalPrompts) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Resets every Monday at 12:00 AM</p>
              </div>
            )}
            <button
              type="button"
              className="w-full rounded-lg border-2 border-lacvay-green bg-transparent px-3 py-2 text-sm font-semibold text-lacvay-green transition hover:bg-lacvay-green hover:text-white"
            >
              {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
            </button>
          </div>
        </Card>

        <Card className="flex h-full flex-col gap-4">
          <div className="flex items-center gap-2 text-lacvay-green">
            <Mail className="h-5 w-5 shrink-0" />
            <h3 className="text-base font-bold text-gray-900">Partner & Advertising Inquiries</h3>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-gray-600">
            Feature your Batangas business, transport service, or tourist spot on LACVAY — reach our team directly.
          </p>
          <a
            href="mailto:partners@lacvay.ph?subject=LACVAY%20Partner%20%26%20Advertising%20Inquiry"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lacvay-green px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-lacvay-green-dark sm:w-auto sm:justify-start"
          >
            <Mail className="h-4 w-4" />
            partners@lacvay.ph
          </a>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex h-full flex-col gap-3">
          <h3 className="text-base font-bold text-gray-900">Privacy & Account</h3>
          <div className="flex flex-1 flex-col gap-2">
            <Link
              to="/privacy"
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-lacvay-cream hover:text-lacvay-green"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-lacvay-cream hover:text-lacvay-green"
            >
              Terms of Service
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmation('');
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Delete Account
            </button>
          </div>
        </Card>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button className="w-full py-3.5" onClick={() => void save()} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        title="Permanently delete account"
        size="md"
      >
        <div className="space-y-5 p-6">
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">This action cannot be undone.</p>
              <p className="mt-1 text-xs leading-relaxed text-red-700">
                Your account, synchronized favorites, and AI chat history will be permanently deleted.
                Browser data for LACVAY will also be removed from this device.
              </p>
            </div>
          </div>
          <div>
            <label htmlFor="delete-confirmation" className="mb-1.5 block text-sm font-medium text-gray-700">
              Enter {user?.email} to confirm
            </label>
            <input
              id="delete-confirmation"
              type="email"
              autoComplete="off"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              disabled={deleting}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>
          {deleteError && (
            <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {deleteError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void deleteAccount()}
              disabled={
                deleting ||
                !user?.email ||
                deleteConfirmation.trim().toLowerCase() !== user.email.toLowerCase()
              }
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete my account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
