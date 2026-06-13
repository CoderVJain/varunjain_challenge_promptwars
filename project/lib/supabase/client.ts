import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const sanitizedUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");

if (typeof window !== "undefined") {
  if (!sanitizedUrl) {
    console.error("MannMitra Error: NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("MannMitra Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  }
}

/** Browser Supabase client. Persists the anonymous session in localStorage. */
export const supabase = createClient(
  sanitizedUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

/** Returns the current anon session, creating one on first use. */
export async function ensureSession() {
  try {
    const { data, error: getSessionError } = await supabase.auth.getSession();
    if (getSessionError) {
      console.error("MannMitra: Error fetching session:", getSessionError.message, getSessionError);
    }
    if (data?.session) return data.session;

    const { data: signed, error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      console.error("MannMitra: Anonymous sign-in failed. Please verify that 'Anonymous sign-ins' are enabled in your Supabase project settings.", signInError.message, signInError);
    }
    return signed?.session || null;
  } catch (err) {
    console.error("MannMitra: ensureSession encountered an unexpected error:", err);
    return null;
  }
}
