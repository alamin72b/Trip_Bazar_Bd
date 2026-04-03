'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';

export function AuthStatus() {
  const { logout, status, user } = useAuth();

  if (status === 'loading') {
    return <span className="auth-pill auth-pill-muted">Checking session...</span>;
  }

  if (status === 'guest') {
    return (
      <Link className="auth-pill auth-pill-link" href="/auth">
        Sign in to review
      </Link>
    );
  }

  return (
    <div className="auth-status-group">
      <span className="auth-pill">{user?.email}</span>
      <button className="auth-pill auth-pill-button" onClick={logout} type="button">
        Logout
      </button>
    </div>
  );
}
