/* The design's "Tweaks", now set through environment variables (see .env.example). */

const ACCENTS = { white: '#F5F5F7', blue: '#2997FF', green: '#30D158' } as const;

function seconds(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  accent: ACCENTS[(process.env.NEXT_PUBLIC_ACCENT as keyof typeof ACCENTS) ?? 'white'] ?? ACCENTS.white,
  heroSeconds: seconds(process.env.NEXT_PUBLIC_HERO_SECONDS, 60),
  marqueeSeconds: seconds(process.env.NEXT_PUBLIC_MARQUEE_SECONDS, 50),
  discordUrl: process.env.NEXT_PUBLIC_DISCORD_URL || '#',
  driveUrl: process.env.NEXT_PUBLIC_DRIVE_URL || '#',
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL || '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};
