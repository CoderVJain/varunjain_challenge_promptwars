"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureSession } from "@/lib/supabase/client";
import { EntryForm } from "@/components/EntryForm";
import { StressGraph } from "@/components/StressGraph";
import { ChatPanel } from "@/components/ChatPanel";
import type { Trigger } from "@/lib/gemini";

type Profile = { exam: string; exam_date: string | null };

function daysToExam(date: string | null) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTriggers = useCallback(async () => {
    const { data } = await supabase.from("triggers").select("label,category,intensity");
    setTriggers((data as Trigger[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const session = await ensureSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("exam,exam_date")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!prof) {
        router.push("/");
        return;
      }
      setProfile(prof);
      await loadTriggers();
      setLoading(false);
    })();
  }, [router, loadTriggers]);

  if (loading) {
    return <main className="flex flex-1 items-center justify-center text-muted">Loading…</main>;
  }

  const days = daysToExam(profile?.exam_date ?? null);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue">MannMitra</p>
          <h1 className="text-xl font-bold text-navy">
            {profile?.exam} prep companion
          </h1>
        </div>
        {days !== null && (
          <div className="rounded-xl bg-navy px-4 py-2 text-right text-white">
            <p className="text-2xl font-bold leading-none text-yellow">{days}</p>
            <p className="text-xs">days to exam</p>
          </div>
        )}
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <EntryForm onSaved={loadTriggers} />

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy">Your stress map</h2>
          <p className="mb-3 text-sm text-muted">
            Hidden triggers we&apos;ve picked up across your entries.
          </p>
          <StressGraph triggers={triggers} />
        </section>

        <div className="md:col-span-2">
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}
