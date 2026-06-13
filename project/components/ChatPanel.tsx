"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { check } from "@/lib/safety";
import { HelplineBanner } from "./HelplineBanner";
import type { ChatTurn } from "@/lib/gemini";

const GREETING: ChatTurn = {
  role: "assistant",
  content: "Hey, I'm here whenever you need to talk. How are you feeling right now?",
};

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    if (check(text)) setShowHelp(true);

    const history = messages.filter((m) => m !== GREETING);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setInput("");
    setSending(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSending(false);
      return;
    }

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message: text, history }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: copy[copy.length - 1].content + chunk,
        };
        return copy;
      });
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setSending(false);
  }

  return (
    <section className="flex flex-col rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy">Talk to MannMitra</h2>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto" aria-live="polite" style={{ maxHeight: 340 }}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "bg-blue text-white" : "bg-gray-100 text-navy"
              }`}
            >
              {m.content || "…"}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {showHelp && (
        <div className="mt-3">
          <HelplineBanner />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type how you feel…"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-navy focus:border-blue focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="rounded-lg bg-purple px-4 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </section>
  );
}
