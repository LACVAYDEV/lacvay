import '../config/env.js';

/** Upper bound for any provider (avoid absurd env typos). */
const HARD_CAP = 65_536;

function readMaxTokens(envKey: string, fallback: number): number {
  const raw = process.env[envKey] ?? process.env.AI_MAX_OUTPUT_TOKENS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), HARD_CAP);
}

/** Groq chat completions — `max_completion_tokens`. */
export function groqMaxCompletionTokens(): number {
  return readMaxTokens('GROQ_MAX_COMPLETION_TOKENS', 32_768);
}

/** Gemini `generateContent` — `generationConfig.maxOutputTokens`. */
export function geminiMaxOutputTokens(): number {
  return readMaxTokens('GEMINI_MAX_OUTPUT_TOKENS', 8_192);
}
