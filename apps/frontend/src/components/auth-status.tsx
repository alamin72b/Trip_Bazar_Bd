'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from './auth-provider';

export function AuthStatus() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, status, user } = useAuth();

  const redirectPath = (() => {
    const currentSearch = searchParams.toString();

    if (!pathname) {
      return '/offers';
    }

    return currentSearch ? `${pathname}?${currentSearch}` : pathname;
  })();

  function handleLogout() {
    logout();
    router.refresh();
  }

  if (status === 'loading') {
    return <span className="auth-pill auth-pill-muted">Checking session...</span>;
  }

  if (status === 'guest') {
    return (
      <Link
        className="auth-pill auth-pill-link"
        href={`/auth?redirect=${encodeURIComponent(redirectPath)}`}
      >
        Sign in to review
      </Link>
    );
  }

  return (
    <div className="auth-status-group">
      <span className="auth-pill">{user?.email}</span>
      <button
        className="auth-pill auth-pill-button"
        onClick={handleLogout}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
