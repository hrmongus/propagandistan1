import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Refund Policy — FanpageKit',
  description: 'When you can get a refund for Fanpage Kit, and how to ask for one.',
  alternates: { canonical: '/refund-policy' },
};

export default function Page() {
  return <LegalPage slug="refund-policy" />;
}
