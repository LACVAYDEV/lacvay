import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { DEFAULT_USER_PASSWORD, supabaseAdmin } from '../services/supabaseAdmin.js';
import { purgeUserData } from '../services/userDeletion.js';

export const adminRouter = Router();

function parseUserId(raw: string | string[] | undefined): string | null {
  if (!raw || Array.isArray(raw)) return null;
  return raw;
}

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? process.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

adminRouter.post('/users/:userId/reset-password', requireAdmin, async (req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'Password reset is not configured. Add SUPABASE_SERVICE_ROLE_KEY to server/.env.',
    });
    return;
  }

  const userId = parseUserId(req.params.userId);
  if (!userId) {
    res.status(400).json({ error: 'User ID is required.' });
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: DEFAULT_USER_PASSWORD,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({
    message: 'Password reset successfully.',
    defaultPassword: DEFAULT_USER_PASSWORD,
  });
});

adminRouter.delete('/users/:userId', requireAdmin, async (req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'User deletion is not configured. Add SUPABASE_SERVICE_ROLE_KEY to server/.env.',
    });
    return;
  }

  const userId = parseUserId(req.params.userId);
  if (!userId) {
    res.status(400).json({ error: 'User ID is required.' });
    return;
  }

  if (req.adminUser?.id === userId) {
    res.status(400).json({ error: 'You cannot delete your own account while signed in.' });
    return;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    res.status(400).json({ error: profileError.message });
    return;
  }

  if (!profile) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const envAdmins = parseAdminEmails();
  if (envAdmins.includes(profile.email.toLowerCase())) {
    res.status(400).json({ error: 'Env-configured admin accounts cannot be deleted here.' });
    return;
  }

  const purgeError = await purgeUserData(userId);
  if (purgeError) {
    res.status(400).json({ error: purgeError });
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: 'User deleted successfully.' });
});
