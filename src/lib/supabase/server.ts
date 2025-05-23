import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client
export const createServerSupabaseClient = async () => {
    const cookieStore = await cookies();
    
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `set` method was called from a Server Component.
              // We can ignore this error since we have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
  };

// Create a Supabase client using the service role key (bypasses RLS)
// WARNING: This should be used sparingly and only in special cases
// never expose the SUPABASE_SERVICE_ROLE_KEY in the client bundle
export const createServiceRoleSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}; 