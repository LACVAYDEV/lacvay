import { buildTransitBriefing, getRouteMatchesForPoints, type ChatLocationContext } from './transitContext.js';
import { buildCommuteGuidePlan, type CommuteGuidePlan } from './commuteGuidePlan.js';
import { completeWithGroq } from './groqClient.js';
import { normalizeAiResponse } from './normalizeAiResponse.js';

const MOCK_RESPONSES: Record<string, string> = {
  'sm batangas': 'From Batangas City Grand Terminal to SM City Batangas, the documented regular fare is ₱32 across two jeepney legs. From Batangas Pier to SM City Batangas, the regular fare is ₱14.',
  'monte maria': 'Take the Dela Paz/Ilijan - Batangas jeepney (signboard: Dela Paz, Ilijan, or Pagkilatan). Board at the Ilijan Jeepney Terminal on SM City Batangas parking/outskirts (or at San Isidro if you are already on that corridor). From CLB/city: jeepney to SM first, then Ilijan terminal. From Batangas Pier, Dela Paz/Ilijan does NOT pass beside the pier — take Sta. Clara/Pier to SM/Ilijan terminal first. Extended fare about ₱23 (discounted ₱19). Alight at Monte Maria — short walk usually enough. Do NOT board Libjo/San Isidro for Monte Maria or Alangilan–Batangas (goes north).',
  'tourist': 'Top spots near Batangas City include Taal Volcano, Basilica of the Immaculate Conception, Anilao for diving, and Laiya Beach for a weekend getaway.',
  'restaurant': 'Try Lomi King for authentic Batangas lomi, Café Laguna at SM for Filipino comfort food, or Batangas Seafood Bay for fresh grilled seafood.',
  'fare': 'Jeepney fares follow LACVAY’s documented matrix (standard and extended trips, with student/senior/PWD discounts). For places off the jeepney line, use Angkas, Grab, or iDOL Taxi and check the fare in the app. Tricycle TODA fares are not listed here — look for the nearest TODA and ask locals.',
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
  const tnvsBlock = briefing.match(/TRAVELER REQUESTED TNVS \(([^)]+)\)/);
  const origin = briefing.match(/RESOLVED ORIGIN: ([^\n(]+)/)?.[1]?.trim();
  let dest = briefing.match(/RESOLVED DESTINATION: ([^\n(]+)/)?.[1]?.trim();
  const destUnknown =
    !dest ||
    /^unknown/i.test(dest) ||
    /ask where they want to go/i.test(dest) ||
    dest === 'unknown';

  if (destUnknown) {
    return [
      'I still need a clear destination in Batangas City.',
      '',
      'For example: **BatStateU Pablo Borbon Main Campus**, Monte Maria, Grand Terminal, or SM City Batangas.',
      origin && !/^unknown/i.test(origin)
        ? `Assuming you start at **${origin}** — where do you want to go?`
        : 'Where do you want to go?',
    ].join('\n');
  }

  if (tnvsBlock && origin && dest) {
    const app = tnvsBlock[1];
    return [
      `**${origin} → ${dest}**`,
      '',
      `1. **Walk** to the pickup point at ${origin} (port exit / roadside where ${app} can stop).`,
      `2. **TNVS (${app})** — book in the ${app} app from ${origin} to ${dest}. Set the drop-off pin on the destination.`,
      `3. **Walk** to the entrance if the pin is on the street.`,
      '',
      `**Total:** ${app} fare shown in app before you confirm; roughly 5–15 min for short city trips.`,
    ].join('\n');
  }

  const shortTrip = briefing.match(/SHORT TRIP \(~([0-9.]+) km\): Prefer walking \(~(\d+) min\) from (.+?) to (.+?)\./);
  if (shortTrip && origin && dest) {
    const corridorSteps = extractNumberedSteps(briefing, 'KNOWN LOCAL ITINERARY');
    if (corridorSteps.length) {
      return [
        `**${origin} → ${dest}**`,
        '',
        ...corridorSteps,
        '',
        `**Total:** walk preferred (~${shortTrip[2]} min); jeepney ₱13 only if optional leg is used.`,
      ].join('\n');
    }
    return [
      `**${origin} → ${dest}**`,
      '',
      `1. **Walk** ~${shortTrip[2]} min (~${shortTrip[1]} km) from ${origin} to ${dest}.`,
      '',
      `**Total:** free (walk); ~${shortTrip[2]} min. Do not detour via SM City Batangas.`,
    ].join('\n');
  }

  const bestBlock = briefing.split('BEST PLAN VERDICT')[1];
  if (bestBlock && origin && dest && /Winner: DIRECT/i.test(bestBlock)) {
    const winner = bestBlock.match(/Winner: DIRECT — ([^.]+)/i)?.[1]?.trim();
    const planLine = bestBlock.match(/Plan: ([^\n]+)/i)?.[1]?.trim();
    if (winner) {
      const boardStreet = streetHintForPlace(origin);
      const alightStreet = streetHintForPlace(dest);
      return [
        `**${origin} → ${dest}**`,
        '',
        `1. **Walk** ~2–5 min${boardStreet ? ` on **${boardStreet}**` : ''} to the nearest stop on ${winner} near ${origin}.`,
        `2. **Jeepney** — ${winner}. ${planLine ? `(${planLine})` : 'One jeepney leg to the destination side.'}`,
        `   - Boarding: nearest stop${boardStreet ? ` on **${boardStreet}**` : ` near ${origin}`}`,
        `   - Alight: nearest stop${alightStreet ? ` on **${alightStreet}**` : ` near ${dest}`}`,
        `3. **Walk** from the alight stop to ${dest}${alightStreet ? ` (${alightStreet} area)` : ''}.`,
        '',
        '**Total:** jeepney fare per signboard (~₱13–23); confirm with the driver.',
      ].join('\n');
    }
  }

  const xferSteps = extractNumberedSteps(briefing, 'KNOWN COMMUTER TRANSFER');
  const corridorSteps = extractNumberedSteps(briefing, 'KNOWN LOCAL ITINERARY');
  const resolvedSteps = xferSteps.length ? xferSteps : corridorSteps;

  const directBlock = briefing.match(/DIRECT MATCH:[^\n]*\n([\s\S]*?)(?:\n[A-Z]|$)/);
  const directLines = directBlock?.[1]
    ?.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- ') && l.includes('route_name') === false && l.includes(' km from'))
    .slice(0, 3);

  if (resolvedSteps.length === 0 && (!directLines || directLines.length === 0)) {
    if (!origin || destUnknown) return null;
    return [
      `Here’s a commute plan for **${origin}** → **${dest}** using LACVAY route data:`,
      '',
      '1. **Walk** to the nearest jeepney stop on the route listed under NEAR ORIGIN in the briefing.',
      '2. **Jeepney** — board the matched corridor toward your destination side; confirm fare with the driver.',
      '3. **Walk** or **TNVS** (Angkas / Grab / iDOL Taxi) for any last mile off the jeepney line.',
      '',
      '**Total:** jeepney fare(s) per route signboard + optional TNVS in app.',
    ].join('\n');
  }

  const title =
    origin && dest && !destUnknown
      ? `Here’s a door-to-door plan for **${origin}** → **${dest}**:`
      : 'Here’s a door-to-door plan using LACVAY jeepney data:';

  const body: string[] = [];
  if (resolvedSteps.length) body.push(...resolvedSteps);
  else if (directLines?.length) {
    body.push('1. **Jeepney** — use the DIRECT MATCH route from the briefing:');
    for (const line of directLines) body.push(`   ${line}`);
  }

  return [
    title,
    '',
    ...body,
    '',
    'Fares can change — confirm with each jeepney driver. Multi-leg trips (walk, jeepney, TNVS) are normal — book Angkas, Grab, or iDOL Taxi for any TNVS leg.',
  ].join('\n');
}

const SYSTEM_INSTRUCTION = `You are the LACVAY AI Travel & Transit Assistant for Batangas City only.

When the user asks how to get somewhere, you MUST give a practical, numbered door-to-door plan using the TRANSIT BRIEFING in the user message.

Each numbered step is ONE leg. Label the mode clearly: **Walk**, **Jeepney**, **TNVS** (Angkas / Grab / iDOL Taxi), or a brief tricycle TODA tip (no invented fares).

Valid combinations — use as many legs as the briefing supports:
- Walk → Jeepney → Walk (destination)
- Walk → Jeepney → TNVS → Walk
- Walk → Jeepney → Walk → Jeepney → Walk (two routes: alight, walk to nearest stop on the second route, wait for passing jeepneys — routes rarely overlap)
- Walk → Jeepney → Walk → Jeepney → TNVS → Walk
- Walk → TNVS (when no jeepney serves the area)

For each **Jeepney** leg: signboard/color, boarding stop **with real street/landmark**, regular fare ₱, discounted fare if known, ETA, and where to alight **with real street/landmark**.
For each **Walk** leg: rough minutes **and the real street or landmark** (from REAL STREETS & ROADS in the briefing).
For each **TNVS** leg: which app (Angkas solo, Grab/iDOL for groups/luggage), book from which street/landmark.
End with one-line **Total**: sum known jeepney fares + note TNVS fare is in the app + estimated total time.

OUTPUT FORMAT (strict — every commute answer must look like this):
- One short title line (plain text, no table).
- Numbered steps only: \`1.\`, \`2.\`, \`3.\` — one step per leg. Start each with **Walk**, **Jeepney**, or **TNVS** in bold.
- Under each jeepney step use simple bullet lines (\`-\`) for: boarding stop (street + route), fare, ETA, alight point (street/landmark).
- Walk steps must name a street when the briefing has one (e.g. "Walk ~2 min on **Arrieta Rd** to the Balagtas stop").
- End with **Total:** on its own line.
- NEVER use markdown tables (no \`|\` pipe syntax), HTML tags (\`<br>\`), or JSON. Plain markdown only: bold, numbered list, bullets.

Rules:
- Read JEEPNEY ROUTING FOR THIS TRIP first. It includes ALL-ROUTES AUDIT (every jeepney scored) and BEST PLAN VERDICT — you MUST follow BEST PLAN VERDICT. Never invent a transfer when the verdict says DIRECT or WALK.
- Decision order (mandatory): (1) SHORT TRIP / walk if ≤1.2 km, (2) DIRECT MATCH / BEST PLAN DIRECT = one jeepney only, (3) transfer/hub only if BEST PLAN says transfer and ZERO routes are DIRECT, (4) jeepney + TNVS, (5) TNVS door-to-door.
- When DIRECT MATCH lists a route (e.g. Balagtas for CLB → Grand Terminal, or Dela Paz/Ilijan for San Isidro → Monte Maria), you MUST recommend that jeepney — UNLESS TRAVELER REQUESTED TNVS is in the briefing (user said "use Angkas", "Grab only", etc.). Then give door-to-door TNVS from origin to destination; jeepney is optional one-line alternative only.
- NEVER add Angkas/Grab as a separate leg after jeepney when the destination is already within ~0.2 km of the jeepney alight point — tell them to walk. Exception: traveler explicitly requested TNVS for the whole trip.
- San Isidro → Monte Maria: board Dela Paz/Ilijan - Batangas at San Isidro. Do NOT board Libjo/San Isidro - Batangas (goes to Batangas City, not Monte Maria) even though it stops closer to San Isidro Church.
- Monte Maria: Dela Paz/Ilijan jeepneys serve the shrine area. From SM / city proper / CLB: board at the **Ilijan Jeepney Terminal on SM City Batangas parking/outskirts** (not a random roadside transfer). Alight at the Monte Maria stop — a short walk is usually enough. Tricycle/TNVS is optional, not required unless the traveler prefers it.
- CLB / city proper → Monte Maria / Ilijan beaches: jeepney toward SM → alight at SM parking/outskirts Ilijan terminal → Dela Paz/Ilijan to destination. Do NOT recommend Tabangao→Dela Paz geometric roadside transfer when the SM Ilijan terminal hub is in the briefing.
- Jeepney routes are LOOPS. Board at the nearest stop on the matched route to the origin; alight at the nearest point on that same route to the destination. Do NOT default to Batangas City Grand Terminal, "city terminal", or Plaza Mabini unless that exact route name/corridor requires it.
- Use LIVE JEEPNEY ROUTES for official names, colors, and admin fares. Never invent a route color that is not in the briefing.
- If a route is marked "does not serve this trip", do NOT recommend it. Example: Alangilan–Batangas Yellow is a NORTH corridor and is wrong for Monte Maria / Ilijan (SOUTH coastal).
- If no DIRECT MATCH exists, build a multi-leg plan: TWO-JEEPNEY TRANSFER when listed, otherwise jeepney + TNVS, or TNVS only — combine modes freely.
- Two-jeepney trips: routes usually do NOT share the same road. Tell the traveler to alight from the first jeepney, walk to the closest stop on the second route corridor, and wait there for jeepneys to pass — do NOT describe this as "overlapping routes" or a shared terminal unless the briefing says so.
- San Isidro/Libjo → Alangilan or Grand Terminal: ride Libjo/San Isidro - Batangas, alight at Batangas City Hall, walk to Evangelista St, board Alangilan - Batangas. Do NOT alight at Alangilan junction or Alangilan Bridge — use City Hall → Evangelista per KNOWN COMMUTER TRANSFER in the briefing.
- Batangas Pier → Grand Terminal / Alangilan: two jeepneys — Sta. Clara/Pier from pier → City Hall → walk Evangelista St → Alangilan - Batangas → Grand Terminal. Sta. Clara/Pier does NOT pass near Grand Terminal (~2.6 km). Do NOT plan Sta. Clara + Grab/TNVS to the terminal when KNOWN COMMUTER TRANSFER or COMMUTER HUB PATTERN is in the briefing.
- CLB → Grand Terminal / BatStateU Pablo Borbon / Alangilan: Balagtas, Alangilan, or Sorosoro from CLB on **Arrieta Rd** — ONE jeepney. "Pablo Borbon" / "main campus" = BatStateU Pablo Borbon Main Campus (Alangilan corridor).
- NEVER invent street names. Especially NEVER write **"Alangilan St"** or **"Alangilan Street"** — that street does not exist as a CLB boarding landmark. **Alangilan** is a barangay and a jeepney route name (Alangilan - Batangas). Near CLB board on **Arrieta Rd**. In city proper, Alangilan jeepneys use **A. Evangelista Street** and **P. Herrera Street**, not "Alangilan St".
- Barangay Sto. Niño is inland (southeast of city proper). Do NOT send travelers there on Alangilan - Batangas (that goes NORTH). Use Tabangao / Libjo / Dela Paz on **Batangas–Tabangao–Lobo Road (N439)**. If RESOLVED ORIGIN is already Barangay Sto. Niño, the title must start with Sto. Niño — never invent a CLB → Sto. Niño plan unless origin is actually CLB.
- **Always use real street names from REAL STREETS & ROADS in the briefing** — they help travelers find the stop. Examples: Arrieta Rd (CLB), A. Evangelista St + P. Herrera St (Alangilan corridor), P. Burgos (City Hall), Rizal Avenue / D. Silang (poblacion), Batangas–Tabangao–Lobo Road (south coast). If a street is not in the briefing, say "nearest stop on [route signboard]" — do not invent a road.
- Clarifications like "main campus is in pablo borbon" ARE destination answers — resolve Pablo Borbon and give the full plan immediately. Never title a plan "→ unknown — ask where they want to go".
- When INFERRED COMMUTER HUB TRANSFER appears, use that two-jeepney pattern — the AI should infer City Hall → Evangelista → Alangilan for north/terminal trips when geometry supports it, without needing every OD pair hardcoded. NEVER use the hub transfer when DIRECT MATCH lists Balagtas/Alangilan/Sorosoro.
- Do NOT force a single jeepney when the briefing shows transfer or TNVS is needed.
- Prefer KNOWN LOCAL ITINERARY when present (documented corridors like SM → Monte Maria, CLB → Pier).
- CLB (Colegio ng Lungsod ng Batangas, Sports Coliseum / Arrieta Rd) is near the pier (~0.8 km), NOT near SM (~2.5 km). CLB → Pier: prefer walk ~10–12 min, or optional Sta. Clara/Pier jeepney boarded NEAR CLB — never walk to SM first.
- SHORT TRIP in the briefing (≤1.2 km): lead with Walk. Do not invent SM or Grand Terminal as a boarding stop when the origin is already near the destination.
- A destination name by itself (e.g. "monte maria", "Acosta Pastor Ancestral House") IS a commute request, not off-topic.
- If RESOLVED DESTINATION includes coordinates (lat/lng), LACVAY already knows where it is. You MUST give the full numbered door-to-door plan immediately. NEVER ask for address, nearest landmark, or "where is it".
- If RESOLVED DESTINATION is set without coordinates, still give the best plan you can from jeepney routes and TNVS — do not stall with only a question.
- If RESOLVED ORIGIN is set (including "from device GPS"), that is their starting point. Use the barangay/landmark name EXACTLY as written in RESOLVED ORIGIN. The plan title must use RESOLVED ORIGIN — never substitute another place.
- Three different places: **Barangay Sto. Niño** (inland barangay), **Monte Maria** (coastal shrine ~7 km away), **San Isidro** (Libjo area). Barangay Sto. Niño does NOT contain Monte Maria. Never ask "do you mean Monte Maria (Sto. Niño Chapel)?" — that wrongly implies Monte Maria is inside the barangay.
- Typo: "monte aria" / "monte marai" = **Monte Maria** (coastal shrine). Treat as a clear destination — give the plan immediately, no clarifying questions.
- If RESOLVED ORIGIN says Barangay Sto. Niño and destination is Monte Maria: title the plan "Barangay Sto. Niño → Monte Maria" and give the jeepney route. Do NOT mention Sto. Niño Chapel unless describing the separate coastal chapel near the shrine.
- Barangay Sto. Niño → Monte Maria: board Dela Paz/Ilijan or Tabangao jeepney toward the coastal route — NOT Libjo/San Isidro and NOT a plan starting from San Isidro Church.
- Batangas Pier → Monte Maria: Dela Paz/Ilijan does NOT pass beside the pier (~2.5 km away). Two jeepney legs: Sta. Clara/Pier - Batangas from the pier (~₱14) to SM City / Ilijan Jeepney Terminal, then Dela Paz/Ilijan - Batangas to Monte Maria (~₱23). Do NOT walk from the pier expecting Dela Paz/Ilijan. Do NOT use Libjo/San Isidro or Alangilan junction transfer.
- Generic Batangas City trips (any restaurant, museum, beach, barangay, or random POI with coordinates in the briefing): read GENERIC BATANGAS CITY ROUTING and JEEPNEY ROUTING FOR THIS TRIP. Always output a full numbered plan — never say you cannot help because the place is not a major terminal. Use DIRECT MATCH when listed; otherwise NEAR ORIGIN + transfer + NEAR DESTINATION or TNVS last mile.
- Pier → city proper (Acosta House, Museo, Plaza Mabini, Basilica): ONLY Sta. Clara/Pier - Batangas passes beside the pier for boarding. Sorosoro/Balagtas/Libjo are closer to downtown for alighting but do NOT pass the pier (~0.7–1 km away) — never say "board Sorosoro at the pier". Jeepney: Sta. Clara/Pier from pier → alight near destination → short walk. Angkas/Grab: door-to-door from pier when requested.
- "I want to use Angkas" / "via Grab" = door-to-door TNVS for the entire trip from RESOLVED ORIGIN to RESOLVED DESTINATION. Title still uses origin → destination. Steps: Walk to pickup point (if needed) → TNVS → Walk to entrance.
- RESOLVED DESTINATION with coordinates means LACVAY knows the place — give directions immediately for ANY Batangas City POI (Kape, Lolo's Place, Museo, beaches, etc.).
- When RESOLVED DESTINATION includes a category (restaurant, Beach, Cultural, Historical, Nature, Adventure), read the matching POI routing hint in the briefing — restaurants/cultural spots use city jeepneys + walk; beaches/adventure spots use south-coast Dela Paz/Ilijan (from pier: Sta. Clara → SM/Ilijan → Dela Paz, never Libjo at pier).
- If ALREADY AT MONTE MARIA AREA is in the briefing, the traveler is at the coastal chapel/shrine — give a short walk plan only.
- If origin was ASSUMED, start with one short line: "Assuming you are at SM City Batangas —" then the steps. Mention they can tell you a different starting point after the plan.
- Keep answers in clear English (short Filipino terms like "sakay" / "baba" are OK). Remind them jeepney fares can change and to verify with the driver. TNVS fares are in the provider app.
- Refuse only clearly unrelated topics (coding, politics, other cities). Never use the off-topic refusal for a Batangas place name.

If the user is clearly off-topic (not a Batangas place, fare, food, or commute question), reply: "I am the LACVAY Travel Assistant. I can help you explore and commute within Batangas City. Where would you like to go in Batangas today?"`;

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
