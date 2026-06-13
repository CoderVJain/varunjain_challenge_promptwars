import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for API routes, scoped to the caller's access token so
 * Row-Level Security enforces per-user isolation. Pass the bearer token from
 * the incoming request's Authorization header.
 */
export function supabaseForToken(accessToken: string) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const sanitizedUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
  return createClient(
    sanitizedUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } },
  );
}
