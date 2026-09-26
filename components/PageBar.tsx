import Link from 'next/link';
import { LogoMark } from './Logo';

export function PageBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-bar">
      <Link className="logo" href="/">
        <LogoMark />
        <span>FanpageKit</span>
      </Link>
      <span className="status">{children}</span>
    </div>
  );
}
