import { NextRequest, NextResponse } from "next/server";
import { analyzeBodySchema } from "@/lib/api-schemas";
import { analyzeJournal } from "@/lib/gemini";
import { supabaseForToken } from "@/lib/supabase/server";

const MAX_TEXT = 4000;

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = analyzeBodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });
  const { mood, text } = parsed.data;

  const sb = supabaseForToken(token);
  const { data: userData } = await sb.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const analysis = await analyzeJournal(String(text).slice(0, MAX_TEXT));

  const { data: entry, error } = await sb
    .from("entries")
    .insert({ user_id: userId, mood, text, sentiment: analysis.sentiment })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (analysis.triggers?.length) {
    await sb.from("triggers").insert(
      analysis.triggers.map((t) => ({
        user_id: userId,
        entry_id: entry.id,
        label: t.label,
        category: t.category,
        intensity: t.intensity,
      })),
    );
  }

  return NextResponse.json({ analysis });
}
