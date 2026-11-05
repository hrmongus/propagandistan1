import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

/*
 * Supabase storage for analyzer jobs and saved strategies (supabase/migrations/20261105120000_analyzer.sql).
 * Server-only: the secret key bypasses RLS. Both tables are RLS-locked with no public policies.
 */

let client: SupabaseClient | null = null;

export function sb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY not set');
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** 10 chars of base62: ~59 bits, unguessable enough for a share link. */
export function slug(len = 10) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const bytes = randomBytes(len * 2);
  let out = '';
  for (let i = 0; out.length < len && i < bytes.length; i++) if (bytes[i] < 248) out += alphabet[bytes[i] % 62];
  return out;
}

export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export type Job = {
  id: string;
  created_at: string;
  status: 'running' | 'done';
  track: Record<string, unknown>;
  steps: Record<string, { status: StepStatus; ms?: number; error?: string }>;
  deezer: Record<string, unknown> | null;
  analysis: Record<string, unknown> | null;
  transcript: Record<string, unknown> | null;
};

export async function createJob(track: Record<string, unknown>) {
  const id = slug(12);
  const steps = { deezer: { status: 'pending' }, audio: { status: 'pending' }, lyrics: { status: 'pending' } };
  const { error } = await sb().from('analyzer_jobs').insert({ id, track, steps, status: 'running' });
  if (error) throw error;
  return id;
}

export async function updateJob(id: string, patch: Partial<Omit<Job, 'id' | 'created_at'>>) {
  const { error } = await sb().from('analyzer_jobs').update(patch).eq('id', id);
  if (error) throw error;
}

export async function getJob(id: string) {
  const { data, error } = await sb().from('analyzer_jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Job | null;
}
