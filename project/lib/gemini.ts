import { ApiError, GoogleGenAI, Type } from "@google/genai";
import { normalizeTriggers, type Trigger } from "./triggers";

/** Centralized model ids — swap here if rate limits bite (see plan). */
export const FLASH_MODEL = "gemini-2.5-flash";
export const FLASH_LITE_MODEL = "gemini-2.5-flash-lite";
export const ANALYZE_MODEL = FLASH_LITE_MODEL;
export const CHAT_MODEL = FLASH_MODEL;

function fallbackModel(model: string): string | null {
  if (model === FLASH_MODEL) return FLASH_LITE_MODEL;
  if (model === FLASH_LITE_MODEL) return FLASH_MODEL;
  return null;
}

function isRateLimited(err: unknown): boolean {
  return err instanceof ApiError && err.status === 429;
}

export { fallbackModel, isRateLimited };

export type { Trigger };

export type Analysis = {
  mood: number;
  sentiment: string;
  triggers: Trigger[];
  coping: string;
  crisis: boolean;
};

function client() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

const ANALYZE_SYSTEM = `You are the analysis engine of MannMitra, a wellness app for Indian
students preparing for high-stakes exams (NEET, JEE, CUET, CAT, GATE, UPSC).
From a student's free-text journal entry, extract structured emotional signals.
Surface HIDDEN stress triggers a basic mood tracker would miss — link feelings to
concrete causes (a subject, sleep, comparison with peers, time pressure, family
expectations, health). Keep trigger labels short (1-3 words). Set crisis=true only
for signs of self-harm, suicidal thoughts, or severe hopelessness. Write coping as
one concrete, doable micro-step for right now.
CRITICAL: If the input text is extremely short, uninformative, or just a simple greeting/test (e.g. "hey", "hi", "hello", "test", "ok"), do not extract triggers (set triggers to []), and set coping to: "Please write a bit more about how your day went so I can suggest a relevant step."`;

const ANALYZE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mood: { type: Type.INTEGER, description: "Overall mood 1 (very low) to 5 (great)" },
    sentiment: { type: Type.STRING, description: "One word, e.g. anxious, hopeful, drained" },
    triggers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Short trigger name, e.g. 'organic chem'" },
          category: {
            type: Type.STRING,
            description: "One of: academic, sleep, social, health, self-doubt, time, family, other",
          },
          intensity: { type: Type.INTEGER, description: "Stress intensity 1-5" },
        },
        required: ["label", "category", "intensity"],
      },
    },
    coping: { type: Type.STRING, description: "One concrete coping micro-step" },
    crisis: { type: Type.BOOLEAN, description: "True only for self-harm / severe distress" },
  },
  required: ["mood", "sentiment", "triggers", "coping", "crisis"],
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Streams an empathetic, context-aware companion reply (one chunk at a time). */
export async function streamCompanion(systemInstruction: string, history: ChatTurn[], message: string) {
  const contents = [
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];
  const config = { systemInstruction, temperature: 0.8 };
  try {
    return await client().models.generateContentStream({ model: CHAT_MODEL, contents, config });
  } catch (err) {
    const fb = fallbackModel(CHAT_MODEL);
    if (isRateLimited(err) && fb) {
      return client().models.generateContentStream({ model: fb, contents, config });
    }
    throw err;
  }
}

/** Single structured call: mood + triggers + coping + crisis flag together. */
export async function analyzeJournal(text: string): Promise<Analysis> {
  const config = {
    systemInstruction: ANALYZE_SYSTEM,
    responseMimeType: "application/json" as const,
    responseSchema: ANALYZE_SCHEMA,
    temperature: 0.4,
  };
  let res;
  try {
    res = await client().models.generateContent({ model: ANALYZE_MODEL, contents: text, config });
  } catch (err) {
    const fb = fallbackModel(ANALYZE_MODEL);
    if (isRateLimited(err) && fb) {
      res = await client().models.generateContent({ model: fb, contents: text, config });
    } else {
      throw err;
    }
  }
  const a = JSON.parse(res.text ?? "{}") as Analysis;
  a.triggers = normalizeTriggers(a.triggers);
  return a;
}
