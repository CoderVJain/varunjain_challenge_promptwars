import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load secrets from the shared `.env` kept one level above the app folder.
 * Maps the project's existing variable names to Next.js conventions. On Vercel
 * the file is absent and the correctly-named env vars are set in the dashboard,
 * so existing values are never overwritten.
 */
function loadEnv() {
  const vars: Record<string, string> = {};
  
  // 1. Try reading the shared `.env` file first
  try {
    const raw = readFileSync(resolve(process.cwd(), "..", ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (match) vars[match[1]] = match[2].trim();
    }
  } catch {
    // Shared .env file not present (e.g. on Vercel) — rely on real env vars
  }

  // 2. Resolve URLs (check standard NEXT_PUBLIC name first, then fallbacks)
  const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || vars.VITE_SUPABASE_URL || "";
  const supabaseUrl = supabaseUrlRaw.replace(/\/rest\/v1\/?$/, "");

  // 3. Resolve Anon Key (check standard NEXT_PUBLIC name first, then fallbacks)
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.anon_key || vars.anon_key || "";

  // 4. Resolve Gemini API Key (check process.env first, then fallbacks)
  const geminiApiKey = process.env.GEMINI_API_KEY || vars.GEMINI_API_KEY || "";

  // 5. Expose sanitized variables to the current environment so server-side routines can access them
  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
  process.env.GEMINI_API_KEY = geminiApiKey;
}

loadEnv();

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in the home dir misleads detection).
  turbopack: { root: process.cwd() },
  // Explicitly export these environment variables to the client-side bundle
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },
};

export default nextConfig;
