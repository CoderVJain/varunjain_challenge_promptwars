"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Trigger } from "@/lib/gemini";

const CATEGORY_COLOR: Record<string, string> = {
  academic: "#209dd7",
  sleep: "#753991",
  social: "#ecad0a",
  health: "#16a34a",
  "self-doubt": "#ef4444",
  time: "#f97316",
  family: "#0ea5e9",
  other: "#888888",
};

/** Aggregates triggers across all entries into a ranked stress map. */
export function StressGraph({ triggers }: { triggers: Trigger[] }) {
  if (!triggers.length) {
    return (
      <p className="text-sm text-muted">
        Your stress map will appear here after your first journal entry.
      </p>
    );
  }

  const map = new Map<string, { label: string; total: number; count: number; category: string }>();
  for (const t of triggers) {
    const key = t.label.toLowerCase();
    const e = map.get(key) ?? { label: t.label, total: 0, count: 0, category: t.category };
    e.total += t.intensity;
    e.count += 1;
    map.set(key, e);
  }

  const data = [...map.values()]
    .map((e) => ({ ...e, score: e.total }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 38)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fill: "#032147", fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const p = item?.payload as { count: number; category: string };
              return [`intensity ${value} · ${p.count}×`, p.category];
            }}
            cursor={{ fill: "#f1f5f9" }}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={CATEGORY_COLOR[d.category] ?? CATEGORY_COLOR.other} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((d) => (
          <span
            key={d.label}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: CATEGORY_COLOR[d.category] ?? CATEGORY_COLOR.other }}
          >
            {d.label} · {d.count}×
          </span>
        ))}
      </div>
    </div>
  );
}
