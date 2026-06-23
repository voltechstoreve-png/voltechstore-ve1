import { createClient } from '@supabase/supabase-js';

// Inicialización lazy para evitar errores en build time
let supabaseClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

// Exportar el cliente
export const supabase = getSupabaseClient();