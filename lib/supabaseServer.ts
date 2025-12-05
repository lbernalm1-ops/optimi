// lib/supabaseServer.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // En el servidor NO queremos persistir sesión en localStorage
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}
