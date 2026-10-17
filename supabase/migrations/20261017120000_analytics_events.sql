-- Server-side analytics events already sent (Meta Conversions API, PostHog), one row per event. Stripe redelivers
-- webhooks — automatic retries keep coming even after a manual resend succeeded — so the webhook claims an event's
-- key here before sending it, and a redelivery finds the row and skips. See claimEvent in lib/db.ts.

create table public.analytics_events (
  -- '<destination>:<event>:<stripe ref>', e.g. 'meta:Purchase:cs_live_…' or 'posthog:upsell_paid:pi_…'.
  event_key text primary key,
  sent_at timestamptz not null default now()
);

-- Server-only, like the purchase tables.
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
