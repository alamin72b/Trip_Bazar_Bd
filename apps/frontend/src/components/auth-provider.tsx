'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  authenticateWithEmail,
  getCurrentUserProfile,
  refreshAuthTokens,
} from '@/lib/api';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from '@/lib/auth-storage';
import type { UserProfile } from '@/lib/types';

type AuthStatus = 'loading' | 'guest' | 'authenticated';

interface AuthContextValue {
  accessToken: string | null;
  user: UserProfile | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  refreshSession: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedSession = loadStoredSession();

      if (!storedSession) {
        if (!cancelled) {
          setStatus('guest');
        }
        return;
      }

      try {
        const restoredUser = await getCurrentUserProfile(storedSession.accessToken);

        if (cancelled) {
          return;
        }

        setAccessToken(storedSession.accessToken);
        setRefreshToken(storedSession.refreshToken);
        setUser(restoredUser);
        setStatus('authenticated');
      } catch {
        try {
          const refreshedSession = await refreshAuthTokens(
            storedSession.refreshToken,
          );

          if (cancelled) {
            return;
          }

          saveStoredSession({
            accessToken: refreshedSession.accessToken,
            refreshToken: refreshedSession.refreshToken,
          });
          setAccessToken(refreshedSession.accessToken);
          setRefreshToken(refreshedSession.refreshToken);
          setUser(refreshedSession.user);
          setStatus('authenticated');
        } catch {
          if (cancelled) {
            return;
          }

          clearStoredSession();
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
          setStatus('guest');
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loginWithEmail(
    email: string,
    password: string,
  ): Promise<UserProfile> {
    const session = await authenticateWithEmail(email, password);

    saveStoredSession({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });

    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    setUser(session.user);
    setStatus('authenticated');

    return session.user;
  }

  function logout() {
    clearStoredSession();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setStatus('guest');
  }

  async function refreshSession(): Promise<string | null> {
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const session = await refreshAuthTokens(refreshToken);

      saveStoredSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });

      setAccessToken(session.accessToken);
      setRefreshToken(session.refreshToken);
      setUser(session.user);
      setStatus('authenticated');

      return session.accessToken;
    } catch {
      logout();
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        status,
        isAuthenticated: status === 'authenticated',
        loginWithEmail,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
