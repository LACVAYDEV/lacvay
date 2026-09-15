import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile and preferences</p>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold text-gray-900">Profile</h3>
        <div className="flex items-center gap-4">
          <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="" className="h-16 w-16 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-bold text-gray-900">Preferences</h3>
        <Select
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en')}
          options={[
            { value: 'en', label: 'English' },
          ]}
        />
        <p className="-mt-2 text-xs text-gray-500">Filipino translation is not available yet.</p>
        <Select
          label="Theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light')}
          options={[
            { value: 'light', label: 'Light' },
          ]}
        />
        <p className="-mt-2 text-xs text-gray-500">Dark theme is not available yet.</p>
        <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium">Notifications</span>
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="h-5 w-5 accent-lacvay-green" />
        </label>
        <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
          <span>
            <span className="block text-sm font-medium">Use location features</span>
            <span className="block text-xs text-gray-500">Browser permission is requested only when a location feature needs it.</span>
          </span>
          <input type="checkbox" checked={location} onChange={(e) => setLocation(e.target.checked)} className="h-5 w-5 accent-lacvay-green" />
        </label>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-bold text-gray-900">Privacy & Account</h3>
        <Link to="/privacy" className="block text-sm font-medium text-gray-600 hover:text-lacvay-green hover:underline">
          Privacy Policy
        </Link>
        <Link to="/terms" className="block text-sm font-medium text-gray-600 hover:text-lacvay-green hover:underline">
          Terms of Service
        </Link>
        <button
          type="button"
          onClick={() => {
            setDeleteConfirmation('');
            setDeleteError(null);
            setDeleteOpen(true);
          }}
          className="block text-sm font-semibold text-red-600 hover:underline"
        >
          Delete Account
        </button>
      </Card>

      {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Button className="w-full" onClick={() => void save()} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Settings
      </Button>

      <button
        type="button"
        onClick={() => void signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>

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
