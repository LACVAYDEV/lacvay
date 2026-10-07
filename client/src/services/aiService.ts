import type { AIMessage, CommuteGuidePlan } from '@/types';
import { generateId } from '@/lib/utils';
import { getStoredGeo, requestUserLocation, GEO_ORIGIN_MANUAL_KEY } from '@/lib/userLocation';
import { supabase } from '@/lib/supabase';
const API_URL = import.meta.env.VITE_API_URL || '/api';
export const AI_ORIGIN_STORAGE_KEY = 'lacvay-ai-origin';
export const ACTIVE_COMMUTE_PLAN_KEY = 'lacvay-active-commute-plan';


export function getStoredAiOrigin(): string {
  try {
    return sessionStorage.getItem(AI_ORIGIN_STORAGE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setStoredAiOrigin(origin: string): void {
  try {
    const value = origin.trim();
    if (value) sessionStorage.setItem(AI_ORIGIN_STORAGE_KEY, value);
    else sessionStorage.removeItem(AI_ORIGIN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isManualAiOrigin(): boolean {
  try {
    return sessionStorage.getItem(GEO_ORIGIN_MANUAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function markManualAiOrigin(): void {
  try {
    sessionStorage.setItem(GEO_ORIGIN_MANUAL_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearManualAiOrigin(): void {
  try {
    sessionStorage.removeItem(GEO_ORIGIN_MANUAL_KEY);
  } catch {
    /* ignore */
  }
}

export function storeActiveCommutePlan(plan: CommuteGuidePlan): void {
  try {
    sessionStorage.setItem(ACTIVE_COMMUTE_PLAN_KEY, JSON.stringify(plan));
  } catch {
    /* ignore */
  }
}

export function loadActiveCommutePlan(): CommuteGuidePlan | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_COMMUTE_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CommuteGuidePlan;
  } catch {
    return null;
  }
}

export function clearActiveCommutePlan(): void {
  try {
    sessionStorage.removeItem(ACTIVE_COMMUTE_PLAN_KEY);
  } catch {
    /* ignore */
  }
}

export async function sendAIMessage(
  message: string,
  originOverride?: string,
): Promise<AIMessage> {
  const geo = (await requestUserLocation()) ?? getStoredGeo();
  const typed = (originOverride ?? getStoredAiOrigin()).trim();
  const manual = isManualAiOrigin() || Boolean(originOverride?.trim());

  // If From is a known landmark different from GPS (e.g. typed "CLB" while GPS is Sto. Niño), keep From
  const typedIsExplicitPlace =
    Boolean(typed) &&
    /^(clb|colegio|sm\b|pier|grand terminal|monte maria|pablo borbon|basilica|alangilan|sto\.?\s*nino|santo nino)/i.test(
      typed,
    );

  const typedLooksLikeGps =
    !typed ||
    !geo ||
    normalizeLabel(typed) === normalizeLabel(geo.label) ||
    normalizeLabel(geo.label).includes(normalizeLabel(typed)) ||
    normalizeLabel(typed).includes(normalizeLabel(geo.label)) ||
    /current location|your location/i.test(typed);

  const usingGps =
    Boolean(geo) && !typedIsExplicitPlace && (!manual || typedLooksLikeGps);

  const origin = usingGps
    ? geo!.label
    : typed || (geo ? geo.label : 'SM Batangas');

  const trimmedMsg = message.trim();
  const apiMessage =
    /^(monte maria|montemaria|mnte maria)$/i.test(trimmedMsg) ||
    (/monte maria|montemaria/i.test(trimmedMsg) && !/\b(from|to|→)\b/i.test(trimmedMsg))
      ? `How do I get from ${origin} to Monte Maria?`
      : trimmedMsg;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: apiMessage,
        origin,
        // Only attach GPS when From matches current location — otherwise named place (CLB) wins
        originLat: usingGps ? geo!.lat : undefined,
        originLng: usingGps ? geo!.lng : undefined,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { reply?: string; plan?: CommuteGuidePlan | null };
      if (!data.reply) {
        throw new Error('Empty reply from AI');
      }
      return {
        id: generateId(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        plan: data.plan ?? null,
      };
    }

    if (res.status === 401) {
      return {
        id: generateId(),
        role: 'assistant',
        content: 'Please sign in to plan routes with the AI assistant.',
        timestamp: new Date().toISOString(),
        plan: null,
      };
    }

    if (res.status === 429) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      return {
        id: generateId(),
        role: 'assistant',
        content: body?.error ?? 'Weekly free prompt limit reached. Upgrade or try again next week.',
        timestamp: new Date().toISOString(),
        plan: null,
      };
    }

    const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errBody?.error ?? 'AI API Error');
  } catch (error) {
    console.error('AI API Error:', error);
    throw new Error("My network is a bit jammed right now. Please give me a few seconds and try asking again.");
  }
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const AI_SUGGESTIONS = [
  'How to get to Monte Maria?',
  'Walk me through the Ilijan jeepney',
  'What are the best tourist spots?',
];
