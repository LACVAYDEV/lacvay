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

function roleIsAdmin(role: string | null | undefined): boolean {
  return role?.trim().toLowerCase() === 'admin';
}

function userClientForToken(token: string) {
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function callerIsAdmin(token: string, userId: string): Promise<boolean> {
  const userClient = userClientForToken(token);

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (!profileError && roleIsAdmin(profile?.role)) return true;

  if (supabaseAdmin) {
    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (!adminProfileError && roleIsAdmin(adminProfile?.role)) return true;
  }

  return false;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server Supabase configuration is missing.' });
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

  let isAdmin = false;
  try {
    isAdmin = await callerIsAdmin(token, user.id);
  } catch {
    res.status(500).json({ error: 'Could not verify admin role.' });
    return;
  }

  if (!isAdmin) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }

  req.adminUser = { id: user.id, email };
  next();
}
