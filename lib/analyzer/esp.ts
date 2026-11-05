export type Lead = { strategyId: string; name: string; email: string; link: string };

/** Stub: the email provider isn't chosen yet. Replace with the ESP's API call (add contact + send the /s/{id} link). */
export async function sendToESP(lead: Lead) {
  console.info('[esp] would send', { strategyId: lead.strategyId, email: lead.email.replace(/(.).*@/, '$1***@'), link: lead.link });
}
