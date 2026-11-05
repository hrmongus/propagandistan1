/*
 * Email checks for lead capture: a sane format plus a block on obvious disposable domains. The list is small on
 * purpose (the big throwaway services); swap in a maintained list or an ESP-side check if junk leads become a problem.
 */

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', 'grr.la', '10minutemail.com', '10minutemail.net',
  'temp-mail.org', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'temp-mail.io', 'throwawaymail.com', 'yopmail.com', 'yopmail.net',
  'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.de', 'dispostable.com', 'maildrop.cc', 'mintemail.com', 'mohmal.com',
  'fakeinbox.com', 'spamgourmet.com', 'emailondeck.com', 'mailnesia.com', 'mailcatch.com', 'mytemp.email', 'tempinbox.com',
  'burnermail.io', 'discard.email', 'spambox.us', 'inboxkitten.com', 'moakt.com', 'tmail.ws', 'tmpmail.org', 'tmpmail.net',
  'emailfake.com', 'luxusmail.org', 'minuteinbox.com', 'mail.tm', 'mailpoof.com', 'linshiyouxiang.net', 'byom.de', 'trbvm.com',
]);

export type EmailCheck = { ok: true; email: string } | { ok: false; error: 'invalid_email' | 'disposable_email' };

export function checkEmail(raw: unknown): EmailCheck {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return { ok: false, error: 'invalid_email' };
  const domain = email.split('@')[1];
  // Block subdomains of disposable services too (e.g. anything.mailinator.com).
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) if (DISPOSABLE.has(parts.slice(i).join('.'))) return { ok: false, error: 'disposable_email' };
  return { ok: true, email };
}
