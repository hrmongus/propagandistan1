import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { MediaFallback } from '@/components/MediaFallback';
import { config } from '@/lib/config';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

const title = 'FanpageKit — Organic views that turn into streams';
const description =
  '30 finished, silent, colour-graded vertical videos for independent artists. Attach your own track, post daily, never show your face. $37, instant download.';

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title,
  description,
  openGraph: { title, description, type: 'website', siteName: 'FanpageKit', url: '/' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = { themeColor: '#000000' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} style={{ '--accent': config.accent } as React.CSSProperties}>
      <body>
        {children}
        <MediaFallback />
      </body>
    </html>
  );
}
