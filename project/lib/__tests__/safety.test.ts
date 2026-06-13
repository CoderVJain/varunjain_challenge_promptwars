import { describe, it, expect } from "vitest";
import { check } from "../safety";
import { normalizeTriggers } from "../triggers";

describe("safety.check", () => {
  it("flags severe distress language", () => {
    expect(check("I want to die, there's no reason to live")).toBe(true);
    expect(check("sometimes I think about suicide")).toBe(true);
    expect(check("I can't go on like this")).toBe(true);
  });

  it("does not flag ordinary exam stress", () => {
    expect(check("I'm so stressed about the JEE mock tomorrow")).toBe(false);
    expect(check("organic chem is killing me lol")).toBe(false);
  });
});

describe("normalizeTriggers", () => {
  it("clamps out-of-range intensity to 1-5", () => {
    const out = normalizeTriggers([
      { label: "JEE fear", category: "Academic", intensity: 9 },
      { label: "sleep", category: "SLEEP", intensity: 0 },
    ]);
    expect(out[0].intensity).toBe(5);
    expect(out[1].intensity).toBe(1);
  });

  it("lowercases categories and tolerates empty input", () => {
    expect(normalizeTriggers(undefined)).toEqual([]);
    expect(normalizeTriggers([{ label: "x", category: "Self-Doubt", intensity: 3 }])[0].category).toBe(
      "self-doubt",
    );
  });
});
