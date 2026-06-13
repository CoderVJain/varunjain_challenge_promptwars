import { createClient } from "@supabase/supabase-js";

/** Browser Supabase client. Persists the anonymous session in localStorage. */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** Returns the current anon session, creating one on first use. */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signed } = await supabase.auth.signInAnonymously();
  return signed.session;
}
