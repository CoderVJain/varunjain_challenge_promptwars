"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { check } from "@/lib/safety";
import { HelplineBanner } from "./HelplineBanner";
import type { Analysis } from "@/lib/gemini";

const MOODS = [
  { v: 1, e: "😞" },
  { v: 2, e: "😕" },
  { v: 3, e: "😐" },
  { v: 4, e: "🙂" },
  { v: 5, e: "😄" },
];

export function EntryForm({ onSaved }: { onSaved: (a: Analysis) => void }) {
  const [mood, setMood] = useState(3);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [crisisHint, setCrisisHint] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) return setError("Write a few words about your day.");
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      return setError("Please write a bit more (at least 2 words) about your day so we can analyze it.");
    }
    setLoading(true);
    setError("");
    setResult(null);
    setCrisisHint(check(trimmed));

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return setError("Session expired. Please reload the page.");
    }

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ mood, text }),
    });
    setLoading(false);
    if (!res.ok) return setError("Could not analyze right now. Please try again.");

    const { analysis } = (await res.json()) as { analysis: Analysis };
    setResult(analysis);
    setText("");
    onSaved(analysis);
  }

  const showHelp = result?.crisis || crisisHint;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy">How was today?</h2>

      <div className="mt-3 flex gap-2" role="group" aria-label="Mood">
        {MOODS.map((m) => (
          <button
            key={m.v}
            type="button"
            aria-label={`Mood ${m.v} of 5`}
            aria-pressed={mood === m.v}
            onClick={() => setMood(m.v)}
            className={`flex-1 rounded-lg border py-2 text-2xl transition ${
              mood === m.v ? "border-blue bg-blue/10" : "border-gray-200 hover:border-blue"
            }`}
          >
            {m.e}
          </button>
        ))}
      </div>

      <label htmlFor="journal" className="mt-4 block text-sm font-medium text-navy">
        What&apos;s on your mind?
      </label>
      <textarea
        id="journal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={4000}
        placeholder="Today felt… (the more honest, the better we can help)"
        className="mt-2 w-full resize-none rounded-lg border border-gray-200 p-3 text-navy focus:border-blue focus:outline-none"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-3 w-full rounded-lg bg-purple px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Reflecting…" : "Reflect & save"}
      </button>

      {showHelp && (
        <div className="mt-4">
          <HelplineBanner />
        </div>
      )}

      {result && !result.crisis && (
        <div className="mt-4 rounded-xl border border-yellow/40 bg-yellow/10 p-4">
          <p className="text-sm font-semibold text-navy">A small step for now</p>
          <p className="mt-1 text-sm text-navy">{result.coping}</p>
        </div>
      )}
    </div>
  );
}
