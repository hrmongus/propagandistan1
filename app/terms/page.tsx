import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions — FanpageKit',
  description: 'The terms that apply when you buy and use Fanpage Kit.',
  alternates: { canonical: '/terms' },
};

export default function Page() {
  return <LegalPage slug="terms" />;
}
