'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from './auth-provider';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithEmail, status, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = searchParams.get('redirect') ?? '/offers';

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      return;
    }

    if (user.role === 'admin') {
      router.replace('/admin');
      return;
    }

    router.replace(
      redirectPath.startsWith('/admin') ? '/offers' : redirectPath,
    );
  }, [redirectPath, router, status, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const authenticatedUser = await loginWithEmail(email, password);
      const nextPath =
        authenticatedUser.role === 'admin'
          ? '/admin'
          : redirectPath.startsWith('/admin')
            ? '/offers'
            : redirectPath;

      router.push(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Authentication failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel form-stack" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">One entrypoint</p>
        <h1 className="section-heading">Sign in or create your traveler account</h1>
      </div>
      <p className="muted-copy">
        TripBazarBD uses one email/password form for both new accounts and returning
        users. Travelers can leave reviews on offers, and admins land in the
        dashboard after login.
      </p>

      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="traveler@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="strong-password-123"
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="button button-primary button-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Authenticating...' : 'Continue'}
      </button>
    </form>
  );
}
