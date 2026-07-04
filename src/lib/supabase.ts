import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient ??= createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export const supabaseConfig = isSupabaseConfigured
  ? { url: supabaseUrl!, anonKey: supabaseAnonKey! }
  : null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    return Reflect.get(getSupabaseClient(), property, receiver);
  },
});

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await getSupabaseClient().auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}
