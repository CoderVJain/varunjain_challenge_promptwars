import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for API routes, scoped to the caller's access token so
 * Row-Level Security enforces per-user isolation. Pass the bearer token from
 * the incoming request's Authorization header.
 */
export function supabaseForToken(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } },
  );
}
