import { buildTransitBriefing, getRouteMatchesForPoints, type ChatLocationContext } from './transitContext.js';
import {
  buildCommuteGuidePlan,
  parseResolvedPoint,
  type CommuteGuidePlan,
} from './commuteGuidePlan.js';
import { geminiMaxOutputTokens } from './aiTokenLimits.js';
import { completeWithGroq } from './groqClient.js';
import { normalizeAiResponse } from './normalizeAiResponse.js';

const MOCK_RESPONSES: Record<string, string> = {
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'restaurant': 'Try Lomi King for authentic Batangas lomi, Café Laguna at SM for Filipino comfort food, or Batangas Seafood Bay for fresh grilled seafood.',
  'fare': "Jeepney fares follow LACVAY's documented matrix (standard and extended trips, with student/senior/PWD discounts). For places off the jeepney line, use Angkas, Grab, or iDOL Taxi and check the fare in the app. Tricycle TODA fares are not listed here — look for the nearest TODA and ask locals.",
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
  return (
    match?.[1] ??
    "I'm LACVAY AI, your Batangas City travel buddy! I can help with routes, fares, tourist spots, and restaurant recommendations."
  );
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

  const planSection = briefing.split(/SELECTED COMMUTE PLAN:|COMMUTE STEPS:/i)[1];
  if (planSection) {
    const stopAt = planSection.search(/\n[A-Z][A-Z &]+:/);
    const slice = stopAt >= 0 ? planSection.slice(0, stopAt) : planSection;
    const steps = slice
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^\d+\.\s+\*\*/.test(l));
    if (steps.length) {
      const header = origin && dest ? `**${origin} → ${dest}**\n\n` : '';
      return header + steps.join('\n');
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

const SYSTEM_INSTRUCTION = `You are LACVAY Transit Assistant for Batangas City jeepney commuters.

Output ONLY numbered commute steps. Follow SELECTED COMMUTE PLAN / COMMUTE STEPS in the briefing — it is already optimized (shortest walks between route lines, correct transfers).

DETAIL RULES (every step must be specific):
- **First mile (200–300 m when possible):** Say walk ~Xm to a **real street/road** where the route **passes**, **wait at the roadside**, and **flag down** the jeepney when the **signboard matches** (e.g. Dela Paz/Ilijan, Libjo/San Isidro). Mention tricycle/TNVS only if the briefing says the walk is >1.2 km.
- **Jeepney legs:** Route name + color if given, corridor (from ↔ to), **where to board**, **where to get off** (street/landmark/terminal), fare ₱X.
- **Transfers:** Step 1 — get off Route A at [street/landmark]. Step 2 — **Transfer Walk** ~X min (~Xm) to where **Route B** passes; wait and flag. Step 3 — board Route B. Use 2–3 jeepneys when the briefing does — cheaper than TNVS.
- **Last mile:** Short walk from alight point to destination with street name when known.

Format:
1. **Walk / Tricycle** — …
2. **Jeepney** — …
3. **Transfer Walk** — … (only if transfer)
4. **Jeepney** — …
N. **Walk** — …

Prefer **multi-jeepney transfers** over TNVS unless the traveler asked for Angkas/Grab/iDOL or the briefing says TNVS.

No preamble, no rejected-route essay, no markdown tables. Strictly directional.`;

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
    generationConfig: {
      maxOutputTokens: geminiMaxOutputTokens(),
      temperature: 0.3,
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

function isWeakCommuteReply(text: string): boolean {
  const numbered = text.split('\n').filter((line) => /^\s*\d+\.\s+\*\*/.test(line.trim()));
  return numbered.length < 2;
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
  const briefingReply = replyFromBriefing(briefing);
  const groqReply = await callGroq(message, briefing);
  const geminiReply = groqReply ? null : await callGemini(message, briefing);
  let modelReply = groqReply ?? geminiReply;
  if (modelReply && briefingReply && isWeakCommuteReply(modelReply)) {
    modelReply = briefingReply;
  }
  const reply = finalizeReply(
    modelReply ?? briefingReply ?? getMockResponse(message),
  );

  let plan: CommuteGuidePlan | null = null;
  try {
    const origin = parseResolvedPoint(briefing, 'ORIGIN');
    const destination = parseResolvedPoint(briefing, 'DESTINATION');
    if (origin && destination) {
      const matches = await getRouteMatchesForPoints(origin, destination);
      plan = buildCommuteGuidePlan({ briefing, reply, matches });
    }
  } catch (err) {
    console.warn('[aiService] Failed to build commute guide plan:', err);
  }

  return { reply, plan };
}
