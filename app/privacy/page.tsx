import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — FanpageKit',
  description: 'How PROPAGANDISTAN, Inc. collects, uses and protects your personal data.',
  alternates: { canonical: '/privacy' },
};

export default function Page() {
  return <LegalPage slug="privacy" />;
}
