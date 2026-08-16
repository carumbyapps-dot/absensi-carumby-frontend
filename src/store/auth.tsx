import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL, ApiError, apiFetch, appendPhotoToForm, getErrorMessage, setToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  notificationPrefs: Record<string, unknown>;
  role: 'admin' | 'employee';
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SignInPayload {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    notificationPrefs?: string | null;
    role?: string | null;
  };
  token: string;
  redirect: boolean;
  url: string | null;
}

interface GetSessionPayload {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    notificationPrefs?: string | null;
    role?: string | null;
  };
  session: { token: string };
}

interface MePayload {
  user: AuthUser;
}

function normalizeUser(raw: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  avatarUrl?: string | null;
  notificationPrefs?: string | null | Record<string, unknown>;
  role?: string | null;
}): AuthUser {
  const prefs = raw.notificationPrefs;
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    emailVerified: raw.emailVerified,
    avatarUrl: raw.avatarUrl ?? (raw.image ? `${API_URL}${raw.image}` : null),
    notificationPrefs:
      typeof prefs === 'string' ? safeParsePrefs(prefs) : prefs ?? {},
    role: raw.role === 'admin' ? 'admin' : 'employee',
  };
}

function safeParsePrefs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Email atau kata sandi salah',
  EMAIL_NOT_VERIFIED: 'Email belum diverifikasi. Silakan periksa kotak masuk email Anda.',
  USER_ALREADY_EXISTS: 'Email sudah terdaftar. Silakan masuk.',
  PASSWORD_TOO_SHORT: 'Kata sandi minimal 8 karakter',
  PASSWORD_TOO_LONG: 'Kata sandi maksimal 128 karakter',
  INVALID_EMAIL: 'Format email tidak valid',
};

export function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.code && AUTH_ERROR_MESSAGES[err.code]) {
    return AUTH_ERROR_MESSAGES[err.code];
  }
  return getErrorMessage(err);
}

export function isEmailNotVerifiedError(err: unknown): boolean {
  return err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED';
}

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  refreshUser: () => Promise<AuthUser>;
  updateProfile: (patch: { name?: string; notificationPrefs?: Record<string, unknown> }) => Promise<AuthUser>;
  uploadAvatar: (uri: string) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const payload = await apiFetch<GetSessionPayload | null>('/api/auth/get-session');
        if (!active) return;
        if (payload?.session?.token && payload.user) {
          await setToken(payload.session.token);
          setUser(normalizeUser(payload.user));
          setStatus('authenticated');
        } else {
          await setToken(null);
          setStatus('unauthenticated');
        }
      } catch {
        if (!active) return;
        await setToken(null);
        setStatus('unauthenticated');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      signIn: async (email, password) => {
        const payload = await apiFetch<SignInPayload>('/api/auth/sign-in/email', {
          method: 'POST',
          auth: false,
          body: { email, password },
        });
        await setToken(payload.token);
        setUser(normalizeUser(payload.user));
        setStatus('authenticated');
      },
      signUp: async (name, email, password) => {
        await apiFetch('/api/auth/sign-up/email', {
          method: 'POST',
          auth: false,
          body: { name, email, password },
        });
      },
      signOut: async () => {
        try {
          await apiFetch('/api/auth/sign-out', { method: 'POST' });
        } finally {
          await setToken(null);
          setUser(null);
          setStatus('unauthenticated');
        }
      },
      resendVerification: async (email) => {
        await apiFetch('/api/auth/send-verification-email', {
          method: 'POST',
          auth: false,
          body: { email },
        });
      },
      refreshUser: async () => {
        const payload = await apiFetch<MePayload>('/api/me');
        const next = normalizeUser(payload.user);
        setUser(next);
        return next;
      },
      updateProfile: async (patch) => {
        const payload = await apiFetch<MePayload>('/api/me', {
          method: 'PATCH',
          body: patch,
        });
        const next = normalizeUser(payload.user);
        setUser(next);
        return next;
      },
      uploadAvatar: async (uri) => {
        const form = new FormData();
        await appendPhotoToForm(form, uri);
        const payload = await apiFetch<MePayload>('/api/me/avatar', {
          method: 'POST',
          body: form,
        });
        const next = normalizeUser(payload.user);
        setUser(next);
        return next;
      },
      changePassword: async (currentPassword, newPassword) => {
        await apiFetch('/api/me/change-password', {
          method: 'POST',
          body: { currentPassword, newPassword },
        });
      },
    }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return ctx;
}