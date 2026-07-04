import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'taxpilot_user';

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  initials: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUser(): AuthUser | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!token || !storedUser) {
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as AuthUser;
    if (!user.email || !user.name || !user.initials) {
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function toTitleCase(value: string): string {
  return value
    .split(/[._-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getInitials(name: string): string {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');

  return initials.toUpperCase() || 'TP';
}

function buildMockUser(email: string): AuthUser {
  const localPart = email.split('@')[0] ?? 'auditor';
  const name = toTitleCase(localPart) || 'Auditor Fiscal';

  return {
    email,
    name,
    role: 'Auditor',
    initials: getInitials(name),
  };
}

function createMockToken(email: string): string {
  const payload = `${email}:${Date.now()}`;
  return `mock.${window.btoa(payload)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    const normalizedEmail = email.trim().toLowerCase();
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!hasValidEmail) {
      throw new Error('Ingresa un correo válido.');
    }

    if (!password.trim()) {
      throw new Error('Ingresa tu contraseña.');
    }

    const nextUser = buildMockUser(normalizedEmail);

    localStorage.setItem(AUTH_TOKEN_KEY, createMockToken(normalizedEmail));
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
