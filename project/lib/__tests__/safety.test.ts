import { describe, it, expect } from "vitest";
import { check, HELPLINES } from "../safety";
import { normalizeTriggers } from "../triggers";

describe("HELPLINES", () => {
  it("lists verified Indian crisis helplines", () => {
    const numbers = HELPLINES.map((h) => h.number);
    expect(numbers).toContain("14416");
    expect(numbers).toContain("9152987821");
    expect(numbers).toContain("9999666555");
  });
});

describe("safety.check", () => {
  it("flags severe distress language", () => {
    expect(check("I want to die, there's no reason to live")).toBe(true);
    expect(check("sometimes I think about suicide")).toBe(true);
    expect(check("I can't go on like this")).toBe(true);
    expect(check("I want to kill myself")).toBe(true);
    expect(check("thinking about self harm")).toBe(true);
    expect(check("I might hurt myself tonight")).toBe(true);
    expect(check("I want to end my life")).toBe(true);
  });

  it("does not flag ordinary exam stress", () => {
    expect(check("I'm so stressed about the JEE mock tomorrow")).toBe(false);
    expect(check("organic chem is killing me lol")).toBe(false);
    expect(check("feeling anxious but I'll push through")).toBe(false);
    expect(check("")).toBe(false);
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
    expect(normalizeTriggers([])).toEqual([]);
    expect(normalizeTriggers([{ label: "x", category: "Self-Doubt", intensity: 3 }])[0].category).toBe(
      "self-doubt",
    );
  });

  it("defaults undefined category to other and rounds intensity", () => {
    const out = normalizeTriggers([
      { label: "mock tests", category: undefined as unknown as string, intensity: 2.6 },
    ]);
    expect(out[0].category).toBe("other");
    expect(out[0].intensity).toBe(3);
  });
});
