import { driveLink } from './config';
import { PACKS } from './data';

/*
 * Transactional email through Resend's HTTP API (RESEND_API_KEY + EMAIL_FROM). Without a key the email is
 * only logged, so local checkouts still work.
 */

type Mail = { to: string; subject: string; html: string; text: string; idempotencyKey: string };

async function send(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn('[email] RESEND_API_KEY / EMAIL_FROM not set — not sent:', mail.subject, '→', mail.to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    // Stripe retries webhooks; the idempotency key keeps that to one email.
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': mail.idempotencyKey },
    body: JSON.stringify({ from, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Emails the Drive folders for the given pack slugs. */
export async function sendPackLinks(to: string, slugs: string[], idempotencyKey: string) {
  const packs = slugs.map((slug) => ({ name: PACKS.find((p) => p.slug === slug)?.name ?? slug, url: driveLink(slug) }));
  const missing = packs.filter((p) => !p.url).map((p) => p.name);
  if (missing.length) console.error('[email] no Drive link configured for', missing.join(', '));
  const ready = packs.filter((p) => p.url);
  if (!ready.length) return;

  await send({
    to,
    idempotencyKey,
    subject: ready.length > 1 ? 'Your FanpageKit packs are ready' : `Your FanpageKit pack is ready: ${ready[0].name}`,
    text: ['Here are your packs — finished videos, raw clips, guides and the playbook:', '', ...ready.map((p) => `${p.name}: ${p.url}`)].join('\n'),
    html: `<p>Here are your packs — finished videos, raw clips, guides and the playbook:</p><ul>${ready
      .map((p) => `<li><a href="${esc(p.url)}">${esc(p.name)}</a></li>`)
      .join('')}</ul>`,
  });
}
