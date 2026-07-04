import {
  createContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  empresa?: string;
  mail_conectado?: string;
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
  mailConectado: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('taxpilot_mock_bypass') === 'true';
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
      mail_conectado: sbUser.user_metadata?.mail_conectado,
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, [mapSupabaseUser]);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, o usa el modo demo.',
      );
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setIsDemo(false);
    localStorage.removeItem('taxpilot_mock_bypass');
  }, []);

  const signup = useCallback(async ({ email, password, nombre, empresa, mailConectado }: SignupCredentials) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
      );
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          empresa,
          mail_conectado: mailConectado,
        },
      },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('taxpilot_mock_bypass');
    setIsDemo(false);
  }, []);

  const activateDemoMode = useCallback(() => {
    localStorage.setItem('taxpilot_mock_bypass', 'true');
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
