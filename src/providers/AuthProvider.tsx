import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK === 'true';
const AUTH_TOKEN_KEY = 'auth_token';
const DEMO_BYPASS_KEY = 'taxpilot_mock_bypass';
const MOCK_AUTH_USER_KEY = 'taxpilot_mock_auth_user';
const MOCK_AUTH_PROFILES_KEY = 'taxpilot_mock_auth_profiles';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  empresa?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
  nombre: string;
  empresa: string;
}

interface MockProfile {
  nombre: string;
  empresa: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  isDemo: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  activateDemoMode: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'TP';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createMockUser(email: string, profile?: Partial<MockProfile>): AuthUser {
  const name = profile?.nombre?.trim() || email.split('@')[0] || 'Auditor';
  const empresa = profile?.empresa?.trim() || 'Auditor demo';

  return {
    id: `mock-${email}`,
    email,
    name,
    role: empresa,
    initials: getInitials(name),
    empresa,
  };
}

function readMockProfiles(): Record<string, MockProfile> {
  if (typeof window === 'undefined') return {};

  try {
    const rawProfiles = localStorage.getItem(MOCK_AUTH_PROFILES_KEY);
    return rawProfiles ? JSON.parse(rawProfiles) : {};
  } catch {
    return {};
  }
}

function readStoredMockUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawUser = localStorage.getItem(MOCK_AUTH_USER_KEY);
    if (!rawUser) return null;

    const parsedUser = JSON.parse(rawUser) as AuthUser;
    if (!parsedUser.email || !parsedUser.name) return null;

    return {
      ...parsedUser,
      initials: parsedUser.initials || getInitials(parsedUser.name),
    };
  } catch {
    localStorage.removeItem(MOCK_AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem(DEMO_BYPASS_KEY) === 'true';
  });

  const mapSupabaseUser = useCallback((sbUser: any): AuthUser | null => {
    if (!sbUser) return null;
    const email = sbUser.email || '';
    const name = sbUser.user_metadata?.nombre || email.split('@')[0] || 'Auditor';
    const role = sbUser.user_metadata?.empresa || 'Auditor';
    
    return {
      id: sbUser.id,
      email,
      name,
      role,
      initials: getInitials(name),
      empresa: sbUser.user_metadata?.empresa,
    };
  }, []);

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      setUser(readStoredMockUser());
      setLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setLoading(false);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, [mapSupabaseUser]);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (USE_MOCK_AUTH) {
      if (!isValidEmail(normalizedEmail)) {
        throw new Error('Ingresa un correo electronico valido.');
      }

      if (!password.trim()) {
        throw new Error('Ingresa tu contrasena.');
      }

      const profiles = readMockProfiles();
      const mockUser = createMockUser(normalizedEmail, profiles[normalizedEmail]);

      localStorage.setItem(MOCK_AUTH_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(AUTH_TOKEN_KEY, `mock-token-${Date.now()}`);
      localStorage.removeItem(DEMO_BYPASS_KEY);
      setUser(mockUser);
      setIsDemo(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) throw error;
    setUser(mapSupabaseUser(data.user));
    setIsDemo(false);
    localStorage.removeItem(DEMO_BYPASS_KEY);
  }, [mapSupabaseUser]);

  const signup = useCallback(async ({ email, password, nombre, empresa }: SignupCredentials) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (USE_MOCK_AUTH) {
      if (!isValidEmail(normalizedEmail)) {
        throw new Error('Ingresa un correo electronico valido.');
      }

      if (!password.trim()) {
        throw new Error('Ingresa tu contrasena.');
      }

      const profiles = readMockProfiles();
      profiles[normalizedEmail] = {
        nombre: nombre.trim(),
        empresa: empresa.trim(),
      };
      localStorage.setItem(MOCK_AUTH_PROFILES_KEY, JSON.stringify(profiles));
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          nombre,
          empresa,
        },
      },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (!USE_MOCK_AUTH) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(MOCK_AUTH_USER_KEY);
    localStorage.removeItem(DEMO_BYPASS_KEY);
    setUser(null);
    setIsDemo(false);
  }, []);

  const activateDemoMode = useCallback(() => {
    localStorage.setItem(DEMO_BYPASS_KEY, 'true');
    setIsDemo(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user) || isDemo,
      loading,
      isDemo,
      login,
      signup,
      logout,
      activateDemoMode,
    }),
    [login, signup, logout, user, loading, isDemo, activateDemoMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
