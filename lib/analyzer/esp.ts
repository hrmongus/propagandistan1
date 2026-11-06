import type { QuizAnswers } from './config';

/* Email service provider handoff. A stub until the provider is chosen; replace the body with its API call. */

export type EspLead = { email: string; first_name: string | null; results_url: string; tags: string[] };

export async function sendToESP(lead: EspLead) {
  console.info('[esp] stub, would send:', { email: lead.email.replace(/^(.).*@/, '$1***@'), first_name: lead.first_name, results_url: lead.results_url, tags: lead.tags });
}

/** ESP tags (HANDOFF.md §5.7): genre, listener bucket, goal, blocker, aesthetics, audience, tried, release, experience. */
export function espTags(a: QuizAnswers) {
  const tags = [`listeners:${a.listeners}`];
  if (a.genre) tags.push(`genre:${a.genre}`);
  if (a.goal) tags.push(`goal:${a.goal}`);
  if (a.blocker) tags.push(`blocker:${a.blocker}`);
  a.aesthetics.forEach((id, i) => tags.push(`aesthetic:${id}`, ...(i === 0 ? [`aesthetic_first:${id}`] : [])));
  a.age?.forEach((x) => tags.push(`age:${x}`));
  if (a.gender) tags.push(`gender:${a.gender}`);
  a.moments?.forEach((x) => tags.push(`moment:${x}`));
  a.tried?.forEach((x) => tags.push(`tried:${x}`));
  if (a.dailyTime) tags.push(`daily_time:${a.dailyTime}`);
  if (a.release) tags.push(`release:${a.release}`);
  if (a.experience) tags.push(`experience:${a.experience}`);
  return tags;
}
