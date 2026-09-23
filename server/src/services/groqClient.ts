const DEFAULT_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
];

const limitedUntil = new Map<string, number>();

export function groqModelQueue(): string[] {
  const preferred = (process.env.GROQ_MODEL ?? '').trim();
  const extra = (process.env.GROQ_MODELS ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  return [...new Set([preferred, ...extra, ...DEFAULT_GROQ_MODELS].filter(Boolean))];
}

function isCoolingDown(model: string): boolean {
  const until = limitedUntil.get(model);
  if (!until) return false;
  if (Date.now() >= until) {
    limitedUntil.delete(model);
    return false;
  }
  return true;
}

function parseResetMs(value?: string | null, fallbackMs = 60_000): number {
  if (!value) return fallbackMs;
  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.max(Number(trimmed) * 1000, 5_000);

  let ms = 0;
  const minutes = trimmed.match(/(\d+(?:\.\d+)?)m/);
  const seconds = trimmed.match(/(\d+(?:\.\d+)?)s/);
  if (minutes) ms += Number(minutes[1]) * 60_000;
  if (seconds) ms += Number(seconds[1]) * 1000;
  return Math.max(ms || fallbackMs, 5_000);
}

function markLimited(model: string, retryAfterHeader?: string | null, resetHeader?: string | null) {
  const ms = parseResetMs(retryAfterHeader, parseResetMs(resetHeader, 60_000));
  limitedUntil.set(model, Date.now() + ms);
  console.warn(`Groq ${model} rate-limited; rotating for ${Math.ceil(ms / 1000)}s`);
}

function maybeMarkLowQuota(model: string, res: Response) {
  const remainingRequests = Number(res.headers.get('x-ratelimit-remaining-requests'));
  const remainingTokens = Number(res.headers.get('x-ratelimit-remaining-tokens'));
  const resetRequests = res.headers.get('x-ratelimit-reset-requests');
  const resetTokens = res.headers.get('x-ratelimit-reset-tokens');

  if (Number.isFinite(remainingRequests) && remainingRequests <= 0) {
    markLimited(model, null, resetRequests);
    return;
  }
  if (Number.isFinite(remainingTokens) && remainingTokens < 800) {
    markLimited(model, null, resetTokens);
  }
}

function isRateLimitStatus(status: number, body: string): boolean {
  if (status === 429) return true;
  const lower = body.toLowerCase();
  return lower.includes('rate_limit') || lower.includes('rate limit') || lower.includes('tokens per minute');
}

export async function completeWithGroq(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const payload = {
    temperature: 0.3,
    max_completion_tokens: 1200,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };

  const available = groqModelQueue().filter((model) => !isCoolingDown(model));
  const models = available.length > 0 ? available : groqModelQueue();

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, model }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (isRateLimitStatus(res.status, errorText)) {
          markLimited(model, res.headers.get('retry-after'), res.headers.get('x-ratelimit-reset-tokens'));
          continue;
        }
        console.error(`Groq ${model} returned status ${res.status}:`, errorText);
        continue;
      }

      maybeMarkLowQuota(model, res);

      const data = await res.json() as {
        choices?: { message?: { content?: string | null } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log(`LACVAY AI using Groq model ${model}`);
        return text;
      }
    } catch (error) {
      console.error(`Failed to call Groq ${model}:`, error);
    }
  }

  return null;
}
