import Link from 'next/link';
import { PageBar } from '@/components/PageBar';

export default function NotFound() {
  return (
    <main className="page">
      <PageBar>404</PageBar>
      <div className="access">
        <div className="access-head">
          <h1>This page doesn&apos;t exist.</h1>
          <p>It may have moved, or the pack it pointed to has been retired.</p>
          <Link className="btn" href="/">Back to FanpageKit</Link>
        </div>
      </div>
    </main>
  );
}
