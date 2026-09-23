import { Router } from 'express';
import { requireUser } from '../middleware/requireUser.js';
import { supabaseAdmin } from '../services/supabaseAdmin.js';
import { purgeUserData } from '../services/userDeletion.js';

export const accountRouter = Router();

accountRouter.delete('/', requireUser, async (req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'Account deletion is not configured. Contact the site administrator.',
    });
    return;
  }

  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return;
  }

  const confirmation = typeof req.body?.confirmation === 'string'
    ? req.body.confirmation.trim().toLowerCase()
    : '';
  if (!user.email || confirmation !== user.email) {
    res.status(400).json({ error: 'Enter your account email address to confirm deletion.' });
    return;
  }

  const purgeError = await purgeUserData(user.id);
  if (purgeError) {
    res.status(400).json({ error: purgeError });
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: 'Account deleted successfully.' });
});
