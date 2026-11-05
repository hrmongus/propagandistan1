import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

/*
 * Supabase for the analyzer (supabase/migrations/20261105130000_analyzer.sql). Server-only: the secret key
 * bypasses RLS. Both tables have RLS on and no policies, so the publishable key can read nothing.
 */

let client: SupabaseClient | null = null;

export function sb() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY not set');
  if (key.startsWith('sb_publishable_')) throw new Error('Supabase key is the publishable key; the server needs the secret key (sb_secret_…)');
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Random base62 slug (8 chars ≈ 47.6 bits), rejection-sampled so every character is equally likely. */
export function slug(len = 8) {
  let out = '';
  while (out.length < len) for (const b of randomBytes(len * 2)) if (b < 248 && out.length < len) out += ALPHABET[b % 62];
  return out;
}

export const isSlug = (s: string) => /^[0-9A-Za-z]{8}$/.test(s);
