import { z } from "zod";

export const analyzeBodySchema = z.object({
  mood: z.number().int().min(1).max(5),
  text: z.string().trim().min(1),
});

export const chatBodySchema = z.object({
  message: z.string().trim().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
});
