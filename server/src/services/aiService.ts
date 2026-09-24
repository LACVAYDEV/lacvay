import { buildTransitBriefing, getRouteMatchesForPoints, type ChatLocationContext } from './transitContext.js';
import { buildCommuteGuidePlan, type CommuteGuidePlan } from './commuteGuidePlan.js';
import { completeWithGroq } from './groqClient.js';
import { normalizeAiResponse } from './normalizeAiResponse.js';

const MOCK_RESPONSES: Record<string, string> = {
  'sm batangas': 'From Batangas City Grand Terminal to SM City Batangas, the documented regular fare is ₱32 across two jeepney legs. From Batangas Pier to SM City Batangas, the regular fare is ₱14.',
  'monte maria': 'Take the Dela Paz/Ilijan - Batangas jeepney (signboard: Dela Paz, Ilijan, or Pagkilatan). Board at the Ilijan Jeepney Terminal on SM City Batangas parking/outskirts (or at San Isidro if you are already on that corridor). From CLB/city: jeepney to SM first, then Ilijan terminal. From Batangas Pier, Dela Paz/Ilijan does NOT pass beside the pier — take Sta. Clara/Pier to SM/Ilijan terminal first. Extended fare about ₱23 (discounted ₱19). Alight at Monte Maria — short walk usually enough. Do NOT board Libjo/San Isidro for Monte Maria or Alangilan–Batangas (goes north).',
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'restaurant': 'Try Lomi King for authentic Batangas lomi, Café Laguna at SM for Filipino comfort food, or Batangas Seafood Bay for fresh grilled seafood.',
  'fare': "Jeepney fares follow LACVAY's documented matrix (standard and extended trips, with student/senior/PWD discounts). For places off the jeepney line, use Angkas, Grab, or iDOL Taxi and check the fare in the app. Tricycle TODA fares are not listed here — look for the nearest TODA and ask locals.",
  'jeepney': 'Jeepneys are the main public transport in Batangas City. Look for route signboards at the Grand Terminal and major roads. Match the signboard to your destination corridor — Alangilan is north, Ilijan/Pagkilatan is south toward Monte Maria.',
  'tricycle': 'LACVAY does not currently list tricycle TODA terminals or fares. For barangays and spots away from jeepney routes, book Angkas, Grab, or iDOL Taxi. You can also look for the nearest tricycle TODA and ask locals for directions.',
  'motorcycle': 'For remote or off-route trips, book Angkas in the app. Wear a helmet and travel light. Grab or iDOL Taxi are better if you have luggage or are traveling as a group.',
  'habal': 'App-based motorcycle taxis such as Angkas are the practical option for solo trips off the jeepney line. Book in the app so the fare is shown before you ride.',
  'taxi': 'For door-to-door trips, especially with luggage or at night, book Grab or iDOL Taxi. Check the fare in the app or on the meter.',
  'angkas': 'Angkas is the TNVS motorcycle-taxi option for solo trips, including last-mile rides to places jeepneys do not reach. Book in the Angkas app.',
  'grab': 'Grab is the TNVS car/taxi option for door-to-door trips off the jeepney line. Book in the Grab app and confirm the drop-off pin.',
  'idol': 'iDOL Taxi is a Batangas metered-taxi option, useful for groups or luggage when the destination is away from jeepney routes.',
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  const match = Object.entries(MOCK_RESPONSES)
    .filter(([key]) => lower.includes(key))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1]
    ?? "I'm LACVAY AI, your Batangas City travel buddy! I can help with routes, fares, tourist spots, and restaurant recommendations. Try asking how to get to Monte Maria from SM Batangas.";
}

function extractNumberedSteps(briefing: string, sectionHeader: string): string[] {
  const block = briefing.split(sectionHeader)[1];
  if (!block) return [];
  const stopAt = block.search(/\n[A-Z][A-Z /]+:/);
  const slice = stopAt >= 0 ? block.slice(0, stopAt) : block.slice(0, 1200);
  return slice
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line));
}

/** Real street hint for common landmarks — keep in sync with REAL_STREET_ATLAS. */
function streetHintForPlace(label: string): string | null {
  const n = label.toLowerCase();
  if (/clb|colegio|sports coliseum|arrieta/.test(n)) return 'Arrieta Rd';
  if (/pier|ppa|port of batangas|batangas port/.test(n)) return 'Ferry Road / Pier access';
  if (/city hall|plaza mabini|basilica|burgos/.test(n)) return 'P. Burgos St';
  if (/evangelista/.test(n)) return 'A. Evangelista St';
  if (/grand terminal|alangilan|batstateu|pablo borbon/.test(n)) {
    return /grand terminal/.test(n) ? 'Diversion Rd / National Road (Grand Terminal area)' : 'National Road (Alangilan corridor)';
  }
  if (/sm city|sm batangas|ilijan terminal/.test(n)) return 'SM parking / PPA coastal side (Ilijan terminal)';
  if (/sto\.?\s*nino|santo nino|tabangao|monte maria|pagkilatan|ilijan|san isidro/.test(n)) {
    return 'Batangas–Tabangao–Lobo Road (N439)';
  }
  if (/rizal|citimart|bay mall|lawas/.test(n)) return 'Rizal Avenue';
  return null;
}

function replyFromBriefing(briefing: string): string | null {
  const origin = briefing.match(/RESOLVED ORIGIN:\s*([^\n(]+)/)?.[1]?.trim();
  const dest = briefing.match(/RESOLVED DESTINATION:\s*([^\n(]+)/)?.[1]?.trim();
  const destUnknown =
    !dest ||
    /^unknown/i.test(dest) ||
    /ask where they want to go/i.test(dest) ||
    dest === 'unknown';

  if (destUnknown) {
    return [
      'Where would you like to go in Batangas City?',
      '',
      origin && !/^unknown/i.test(origin)
        ? `Starting from **${origin}** — where do you want to head to?`
        : 'Please tell me your destination in Batangas City.',
    ].join('\n');
  }

  // Extract clean numbered steps from SELECTED COMMUTE PLAN
  const planSection = briefing.split(/SELECTED COMMUTE PLAN:|COMMUTE STEPS:/i)[1];
  if (planSection) {
    const steps = planSection
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^\d+\.\s+\*\*/.test(l));
    if (steps.length) {
      return steps.join('\n');
    }
  }

  const tnvsBlock = briefing.match(/TRAVELER REQUESTED TNVS \(([^)]+)\)/);
  if (tnvsBlock && origin && dest) {
    const app = tnvsBlock[1];
    return [
      `1. **Walk / Tricycle** — Walk to the nearest pickup point at ${origin}.`,
      `2. **TNVS** — Book ${app} door-to-door from ${origin} to ${dest}. Fare shown in app.`,
      `3. **Walk** — Short walk to the entrance of ${dest}.`,
    ].join('\n');
  }

  return null;
}

const SYSTEM_INSTRUCTION = `You are LACVAY Transit Assistant. Output ONLY clean, numbered commute steps following this rule:

When a direct single jeepney is unavailable, prioritize a TWO- OR THREE-JEEPNEY TRANSFER over TNVS. Local commuters prefer transferring between jeepneys because fares are substantially cheaper (₱13–₱15 per leg vs. ₱100+ for TNVS).

Format your response as sequential, numbered steps matching the route requirements:
- For Direct Trips:
  1. **Walk / Tricycle** — [First-mile access to stop]
  2. **Jeepney** — Board [Route 1] ([Color]). Alight at [Stop]. Fare: ₱[Amount].
  3. **Walk** — [Final walk to destination]

- For Transfer Trips (Two or More Jeepneys):
  1. **Walk / Tricycle** — [First-mile access to first stop]
  2. **Jeepney** — Board [Route 1] ([Color]). Alight at [Transfer Hub / Landmark, e.g., City Hall, Evangelista, or SM Ilijan Terminal]. Fare: ₱[Amount].
  3. **Transfer Walk** — Walk ~[X] min to [Next Route Stop / Street].
  4. **Jeepney** — Board [Route 2] ([Color]). Alight at [Next Transfer Hub or near Destination]. Fare: ₱[Amount].
  (If a 3rd jeepney is required, continue with 5. **Transfer Walk** and 6. **Jeepney**, etc.)
  N. **Walk** — [Short final walk to destination]

DO NOT explain why other routes were rejected. DO NOT add conversational preamble or unnecessary travel warnings. Keep it strictly directional.`;

function geminiModelCandidates(): string[] {
  const preferred = (process.env.GEMINI_MODEL ?? '').trim();
  const fallbacks = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash',
  ];
  return [...new Set([preferred, ...fallbacks].filter(Boolean))];
}

async function callGemini(message: string, briefing: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [{
      role: 'user',
      parts: [{
        text: `TRAVELER QUESTION:\n${message}\n\n---\nTRANSIT BRIEFING (source of truth; do not ignore):\n${briefing}`,
      }],
    }],
  };

  for (const model of geminiModelCandidates()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Gemini ${model} returned status ${res.status}:`, errorText);
        continue;
      }
      const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text?.trim()) return text;
    } catch (error) {
      console.error(`Failed to call Gemini ${model}:`, error);
    }
  }

  return null;
}

async function callGroq(message: string, briefing: string): Promise<string | null> {
  return completeWithGroq(
    SYSTEM_INSTRUCTION,
    `TRAVELER QUESTION:\n${message}\n\n---\nTRANSIT BRIEFING (source of truth; do not ignore):\n${briefing}`,
  );
}

function finalizeReply(text: string): string {
  return normalizeAiResponse(text);
}

export interface ChatAiResult {
  reply: string;
  plan: CommuteGuidePlan | null;
}

export async function chatWithAI(
  message: string,
  location: ChatLocationContext = {},
): Promise<ChatAiResult> {
  const briefing = await buildTransitBriefing(message, location);
  const groqReply = await callGroq(message, briefing);
  const geminiReply = groqReply ? null : await callGemini(message, briefing);
  const reply = finalizeReply(
    groqReply ?? geminiReply ?? replyFromBriefing(briefing) ?? getMockResponse(message),
  );

  let plan: CommuteGuidePlan | null = null;
  try {
    const originMatch = briefing.match(
      /RESOLVED ORIGIN:\s*([^\n(]+?)\s*\((\d+\.\d+)\s*,\s*(\d+\.\d+)\)/,
    );
    const destMatch = briefing.match(
      /RESOLVED DESTINATION:\s*([^\n(]+?)\s*\((\d+\.\d+)\s*,\s*(\d+\.\d+)\)/,
    );
    if (originMatch && destMatch && !/^unknown/i.test(destMatch[1].trim())) {
      const origin = {
        label: originMatch[1].trim(),
        lat: Number(originMatch[2]),
        lng: Number(originMatch[3]),
      };
      const destination = {
        label: destMatch[1].trim(),
        lat: Number(destMatch[2]),
        lng: Number(destMatch[3]),
      };
      const matches = await getRouteMatchesForPoints(origin, destination);
      plan = buildCommuteGuidePlan({ briefing, reply, matches });
    }
  } catch (err) {
    console.warn('[aiService] Failed to build commute guide plan:', err);
  }

  return { reply, plan };
}
