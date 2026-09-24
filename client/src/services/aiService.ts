import type { AIMessage, CommuteGuidePlan } from '@/types';
import { generateId } from '@/lib/utils';
import { getStoredGeo, requestUserLocation, GEO_ORIGIN_MANUAL_KEY } from '@/lib/userLocation';

const API_URL = import.meta.env.VITE_API_URL || '/api';
export const AI_ORIGIN_STORAGE_KEY = 'lacvay-ai-origin';
export const ACTIVE_COMMUTE_PLAN_KEY = 'lacvay-active-commute-plan';

const MOCK_RESPONSES: Record<string, string> = {
  'monte maria': 'Take the Dela Paz/Ilijan - Batangas jeepney. From San Isidro, wait at the road-side stop — the route passes the church and serves Monte Maria. Extended fare about ₱23, roughly 30–45 min. Alight at Monte Maria; a short walk to the shrine is usually enough. Do NOT board Libjo/San Isidro (goes to Batangas City). TNVS is optional.',
  'sm batangas': 'From Batangas City Grand Terminal to SM City Batangas, the documented regular fare is ₱32 across two jeepney legs. From Batangas Pier to SM City Batangas, the regular fare is ₱14.',
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'fare': "Jeepney fares use LACVAY's documented matrix. For places off the jeepney line, book Angkas, Grab, or iDOL Taxi and check the fare in the app. Tricycle TODA fares are not listed — look for the nearest TODA and ask locals.",
  'habal': 'For solo trips off the jeepney line, book Angkas in the app so the fare is shown before you ride.',
  'taxi': 'For door-to-door trips with luggage or at night, book Grab or iDOL Taxi. Check the fare in the app or on the meter.',
  'tricycle': 'LACVAY does not currently list tricycle TODA terminals or fares. For remote spots, book Angkas, Grab, or iDOL Taxi. You can also look for the nearest tricycle TODA and ask locals for directions.',
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  const match = Object.entries(MOCK_RESPONSES)
    .filter(([key]) => lower.includes(key))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1]
    ?? "I'm LACVAY AI, your Batangas City travel buddy! I can help with routes, fares, tourist spots, and restaurant recommendations. Try asking how to get to Monte Maria from SM Batangas.";
}

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

  try {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        origin,
        // Only attach GPS when From matches current location — otherwise named place (CLB) wins
        originLat: usingGps ? geo!.lat : undefined,
        originLng: usingGps ? geo!.lng : undefined,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { reply?: string; plan?: CommuteGuidePlan | null };
      return {
        id: generateId(),
        role: 'assistant',
        content: data.reply ?? getMockResponse(message),
        timestamp: new Date().toISOString(),
        plan: data.plan ?? null,
      };
    }
  } catch {
    // fall through to mock
  }

  return {
    id: generateId(),
    role: 'assistant',
    content: getMockResponse(message),
    timestamp: new Date().toISOString(),
    plan: null,
  };
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
