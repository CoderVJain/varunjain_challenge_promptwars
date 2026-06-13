"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ensureSession } from "@/lib/supabase/client";

const EXAMS = ["NEET", "JEE", "CUET", "CAT", "GATE", "UPSC"] as const;

export default function Onboarding() {
  const router = useRouter();
  const [exam, setExam] = useState("");
  const [examDate, setExamDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    if (!exam) return setError("Please pick the exam you're preparing for.");
    if (examDate) {
      const selectedDate = new Date(examDate + "T00:00:00");
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (selectedDate < todayDate) {
        return setError("Exam date must be today or in the future.");
      }
    }
    setSaving(true);
    setError("");
    const session = await ensureSession();
    if (!session) {
      setSaving(false);
      return setError("Could not start a session. Check Supabase config.");
    }
    const { error } = await supabase.from("profiles").upsert({
      user_id: session.user.id,
      exam,
      exam_date: examDate || null,
    });
    if (error) {
      setSaving(false);
      return setError(error.message);
    }
    router.push("/dashboard");
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-sm font-medium text-blue">MannMitra</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">
          Your exam-prep wellness companion
        </h1>
        <p className="mt-2 text-sm text-muted">
          Journal freely. We&apos;ll map your hidden stress triggers and support
          you all the way to exam day.
        </p>

        <div className="mt-6">
          <span className="block text-sm font-medium text-navy">
            Which exam are you preparing for?
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Exam">
            {EXAMS.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={exam === e}
                onClick={() => setExam(e)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  exam === e
                    ? "border-blue bg-blue text-white"
                    : "border-gray-200 bg-white text-navy hover:border-blue"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="exam-date" className="block text-sm font-medium text-navy">
            Exam date <span className="text-muted">(optional)</span>
          </label>
          <input
            id="exam-date"
            type="date"
            value={examDate}
            min={minDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-navy focus:border-blue focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={start}
          disabled={saving}
          className="mt-6 w-full rounded-lg bg-purple px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Starting…" : "Begin my journey"}
        </button>
      </section>
    </main>
  );
}
