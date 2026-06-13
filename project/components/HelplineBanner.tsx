import { HELPLINES } from "@/lib/safety";

export function HelplineBanner() {
  return (
    <div role="alert" className="rounded-xl border-2 border-purple bg-purple/5 p-4">
      <p className="font-semibold text-purple">You don&apos;t have to face this alone.</p>
      <p className="mt-1 text-sm text-navy">
        If you&apos;re in distress, please reach out right now — talking to someone helps.
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {HELPLINES.map((h) => (
          <li key={h.number} className="text-navy">
            <span className="font-semibold">{h.name}:</span>{" "}
            <a href={`tel:${h.number}`} className="font-bold text-blue">
              {h.number}
            </a>{" "}
            <span className="text-muted">({h.note})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
