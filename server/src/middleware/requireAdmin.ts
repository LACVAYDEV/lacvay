import type { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import { supabaseAdmin } from '../services/supabaseAdmin.js';
import '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      adminUser?: { id: string; email: string };
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server Supabase configuration is missing.' });
    return;
  }

  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'Admin API requires SUPABASE_SERVICE_ROLE_KEY in server/.env.',
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token.' });
    return;
  }

  const token = authHeader.slice(7);
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return;
  }

  const email = user.email?.toLowerCase() ?? '';

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Could not verify admin role.' });
    return;
  }

  if (profile?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  req.adminUser = { id: user.id, email };
  next();
}
