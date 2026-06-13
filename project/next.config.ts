import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load secrets from the shared `.env` kept one level above the app folder.
 * Maps the project's existing variable names to Next.js conventions. On Vercel
 * the file is absent and the correctly-named env vars are set in the dashboard,
 * so existing values are never overwritten.
 */
function loadSharedEnv() {
  let raw: string;
  try {
    raw = readFileSync(resolve(process.cwd(), "..", ".env"), "utf8");
  } catch {
    return; // no shared file (e.g. on Vercel) — rely on real env vars
  }

  const vars: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (match) vars[match[1]] = match[2].trim();
  }

  const supabaseUrl = vars.VITE_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= supabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= vars.anon_key;
  process.env.GEMINI_API_KEY ??= vars.GEMINI_API_KEY;
}

loadSharedEnv();

const nextConfig: NextConfig = {
  // Pin the workspace root (a stray lockfile in the home dir misleads detection).
  turbopack: { root: process.cwd() },
};

export default nextConfig;
