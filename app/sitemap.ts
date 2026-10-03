import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: config.siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${config.siteUrl}/guarantee`, changeFrequency: 'monthly', priority: 0.5 },
    ...['terms', 'privacy', 'refund-policy'].map((p) => ({ url: `${config.siteUrl}/${p}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
