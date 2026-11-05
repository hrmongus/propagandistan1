/* Email service provider handoff. A stub until the provider is chosen; replace the body with its API call. */

export type EspLead = { email: string; first_name: string | null; results_url: string; tags: string[] };

export async function sendToESP(lead: EspLead) {
  console.info('[esp] stub, would send:', { email: lead.email.replace(/^(.).*@/, '$1***@'), first_name: lead.first_name, results_url: lead.results_url, tags: lead.tags });
}

/** Tags from the quiz: listener bracket, goal, blocker, first aesthetic, time, release, experience. */
export function espTags(answers: Record<string, unknown>, firstAesthetic: string | undefined) {
  const tag = (k: string, v: unknown) => (typeof v === 'string' && v ? `${k}:${v}` : null);
  return [
    tag('listeners', answers.listeners), tag('goal', answers.goal), tag('blocker', answers.blocker), tag('aesthetic', firstAesthetic),
    tag('time', answers.time), tag('release', answers.release), tag('experience', answers.experience),
  ].filter((t): t is string => t !== null);
}
