/** Verified Indian mental-health helplines shown during distress. */
export const HELPLINES = [
  { name: "Tele-MANAS (Govt. of India)", number: "14416", note: "24x7, free" },
  { name: "iCall (TISS)", number: "9152987821", note: "Mon-Sat, 8am-10pm" },
  { name: "Vandrevala Foundation", number: "9999666555", note: "24x7" },
];

const CRISIS_PATTERNS = [
  /suicid/i,
  /kill myself/i,
  /end my life/i,
  /want to die/i,
  /no reason to live/i,
  /can'?t go on/i,
  /self.?harm/i,
  /hurt myself/i,
];

/** Fast keyword pre-filter for severe distress. Complements the model's flag. */
export function check(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}
