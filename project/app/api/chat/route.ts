import { NextRequest } from "next/server";
import { streamCompanion, type ChatTurn } from "@/lib/gemini";
import { supabaseForToken } from "@/lib/supabase/server";

const MAX_MSG = 2000;

function daysToExam(date: string | null) {
  if (!date) return null;
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));
}

async function buildSystem(sb: ReturnType<typeof supabaseForToken>) {
  const { data: prof } = await sb.from("profiles").select("exam,exam_date").maybeSingle();
  const { data: entries } = await sb
    .from("entries")
    .select("mood,text,created_at")
    .order("created_at", { ascending: false })
    .limit(3);
  const { data: triggers } = await sb.from("triggers").select("label,intensity");

  const days = daysToExam(prof?.exam_date ?? null);
  const top = (triggers ?? [])
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5)
    .map((t) => t.label)
    .join(", ");
  const recent = (entries ?? []).map((e) => `- (mood ${e.mood}/5) ${e.text}`).join("\n");

  return `You are MannMitra, a warm, calm companion for a student preparing for ${prof?.exam ?? "a major exam"}.
${days !== null ? `The exam is in ${days} days — match your tone to that pressure.` : ""}
Their recent journal entries:
${recent || "(none yet)"}
Their main stress triggers: ${top || "unknown"}.

Be empathetic and concrete. Validate feelings first, then offer ONE small, doable coping step or a brief mindfulness/reframing exercise. Reference their exam and triggers when relevant. Keep replies short (2-4 sentences). You are a supportive companion, not a therapist or doctor; never diagnose. If they mention self-harm or suicide, gently urge them to contact Tele-MANAS 14416 right now.`;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return new Response("unauthorized", { status: 401 });

  const { message, history } = (await req.json()) as { message: string; history: ChatTurn[] };
  if (!message?.trim()) return new Response("invalid input", { status: 400 });

  const sb = supabaseForToken(token);
  const system = await buildSystem(sb);
  const result = await streamCompanion(system, history ?? [], message.slice(0, MAX_MSG));

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of result) {
        if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
