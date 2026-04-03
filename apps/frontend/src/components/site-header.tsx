import { Suspense } from 'react';
import Link from 'next/link';
import { AuthStatus } from './auth-status';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/offers', label: 'Offers' },
  { href: '/auth', label: 'Auth' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link className="brand-mark" href="/">
          <span className="brand-mark__eyebrow">TripBazarBD</span>
          <span className="brand-mark__title">Travel offers with a direct WhatsApp path.</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Suspense
          fallback={
            <span className="auth-pill auth-pill-muted">Checking session...</span>
          }
        >
          <AuthStatus />
        </Suspense>
      </div>
    </header>
  );
}
