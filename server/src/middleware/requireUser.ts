import type { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: { id: string; email: string };
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export async function authenticateUser(
  req: Request,
  res: Response,
): Promise<{ id: string; email: string } | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server Supabase configuration is missing.' });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token.' });
    return null;
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return null;
  }

  return { id: user.id, email: user.email?.toLowerCase() ?? '' };
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const user = await authenticateUser(req, res);
  if (!user) return;
  req.authUser = user;
  next();
}
