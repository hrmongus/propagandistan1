import { headers } from 'next/headers';

/** Absolute origin for Stripe redirect URLs: NEXT_PUBLIC_SITE_URL, else the request's host. */
export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  return `${h.get('x-forwarded-proto') ?? 'http'}://${host}`;
}
