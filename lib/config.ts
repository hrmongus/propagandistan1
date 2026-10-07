/* Site settings read from environment variables (see .env.example). */

export const config = {
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL || '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

/** Paid-only links. Server-side so they never ship in the public JS bundle. */
export const privateLinks = () => ({
  discordUrl: process.env.DISCORD_URL || '#',
});

/**
 * Google Drive folder for a pack slug ('bundle' is the four-pack folder), from DRIVE_URL_<SLUG>
 * (e.g. DRIVE_URL_GOLDEN_HOUR). Server-only: read it only after the order is verified as paid.
 */
export function driveLink(slug: string) {
  return process.env[`DRIVE_URL_${slug.toUpperCase().replace(/-/g, '_')}`] || '';
}

/** Google Drive folder with the editing guides (one per tool), from DRIVE_URL_GUIDES. Every paid order gets it. */
export function guidesLink() {
  return process.env.DRIVE_URL_GUIDES || '';
}
