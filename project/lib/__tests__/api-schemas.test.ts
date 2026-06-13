import { describe, it, expect } from "vitest";
import { analyzeBodySchema, chatBodySchema } from "../api-schemas";

describe("analyzeBodySchema", () => {
  it("accepts valid mood and text", () => {
    const out = analyzeBodySchema.safeParse({ mood: 3, text: "  Couldn't sleep, scared about JEE  " });
    expect(out.success).toBe(true);
    if (out.success) expect(out.data.text).toBe("Couldn't sleep, scared about JEE");
  });

  it("rejects mood outside 1-5", () => {
    expect(analyzeBodySchema.safeParse({ mood: 0, text: "ok" }).success).toBe(false);
    expect(analyzeBodySchema.safeParse({ mood: 6, text: "ok" }).success).toBe(false);
  });

  it("rejects empty or missing text", () => {
    expect(analyzeBodySchema.safeParse({ mood: 3, text: "   " }).success).toBe(false);
    expect(analyzeBodySchema.safeParse({ mood: 3 }).success).toBe(false);
  });
});

describe("chatBodySchema", () => {
  it("accepts message with optional history", () => {
    const out = chatBodySchema.safeParse({ message: "I'm stressed" });
    expect(out.success).toBe(true);
    if (out.success) expect(out.data.history).toEqual([]);
  });

  it("accepts trimmed message and history turns", () => {
    const out = chatBodySchema.safeParse({
      message: "  help  ",
      history: [{ role: "user", content: "hi" }, { role: "assistant", content: "hey" }],
    });
    expect(out.success).toBe(true);
    if (out.success) expect(out.data.message).toBe("help");
  });

  it("rejects empty message and invalid history roles", () => {
    expect(chatBodySchema.safeParse({ message: "" }).success).toBe(false);
    expect(
      chatBodySchema.safeParse({ message: "hi", history: [{ role: "bot", content: "x" }] }).success,
    ).toBe(false);
  });
});
