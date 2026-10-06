function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Offline / fallback Monte Maria guide — matches live planner corridors. */
export function buildMonteMariaCommuteReply(originLabel: string): string {
  const o = norm(originLabel || 'sm batangas');
  const title = `**${originLabel || 'Your location'} → Monte Maria**`;

  if (/clb|colegio|arrieta|sports coliseum/.test(o)) {
    return [
      title,
      '',
      '1. **Walk** — From CLB, walk ~200–300 m on **Arrieta Rd** to the nearest point where city jeepneys pass. Wait at the **roadside curb** and flag a jeepney toward **SM / coastal road** (Libjo/San Isidro, Tabangao, or Capitolio corridor — **not** Alangilan northbound).',
      '2. **Jeepney** — Ride toward **SM City Batangas / Ilijan Jeepney Terminal** (PPA coastal side). Alight at the **Ilijan terminal loading area**. Fare: about ₱13–₱15.',
      '3. **Transfer Walk** — Walk ~3–5 min (~200–300 m) along the terminal access to the **Dela Paz/Ilijan** queue. Wait roadside; flag signboard **Dela Paz, Ilijan, Pagkilatan, or Monte Maria**.',
      '4. **Jeepney** — Board **Dela Paz/Ilijan – Batangas**. Stay on the **Batangas–Tabangao–Lobo Rd (N439)**. Alight at the **Monte Maria / Pagkilatan** stop on the coastal route. Extended fare about **₱23** (discounted ~₱19). ~30–45 min total jeepney time.',
      '5. **Walk** — Short inland walk (~200–400 m) from the highway stop to **Monte Maria Shrine**.',
      '',
      '**Do not** board **Libjo/San Isidro – Batangas City** or **Alangilan – Batangas** for this trip (northbound). TNVS optional for long first mile only.',
    ].join('\n');
  }

  if (/pier|ppa|port|batangas port/.test(o)) {
    return [
      title,
      '',
      '1. **Walk** — ~200 m to the **Sta. Clara/Pier** jeepney stop on **Ferry Road**.',
      '2. **Jeepney** — Board **Sta. Clara/Pier – Batangas**. Alight at **SM City Batangas / Ilijan Jeepney Terminal** on the coastal road (~₱14). **Do not** walk to Dela Paz/Ilijan from the pier — it does not pass beside the port.',
      '3. **Transfer Walk** — ~200–300 m to the **Dela Paz/Ilijan** terminal queue; wait and flag matching signboard.',
      '4. **Jeepney** — **Dela Paz/Ilijan – Batangas** to **Monte Maria / Pagkilatan**. Extended fare ~**₱23**.',
      '5. **Walk** — Short walk to the shrine from the coastal stop.',
    ].join('\n');
  }

  if (/san isidro|isidro labrador|libjo/.test(o)) {
    return [
      title,
      '',
      '1. **Walk** — ~100–250 m to the **roadside stop** near **San Isidro Labrador Church** where the southbound corridor passes.',
      '2. **Jeepney** — If **Dela Paz/Ilijan – Batangas** passes your stop, board and alight at **Monte Maria / Pagkilatan** (~₱23 extended). Otherwise ride a corridor jeepney toward **SM Ilijan terminal**, transfer, then **Dela Paz/Ilijan** as below.',
      '3. **Walk** — ~200–300 m inland from the highway stop to **Monte Maria Shrine**.',
      '',
      '**Do not** board **Libjo/San Isidro – Batangas City** (heads to city proper, not Monte Maria).',
    ].join('\n');
  }

  if (/sm|ilijan terminal|ilijan/.test(o)) {
    return [
      title,
      '',
      '1. **Walk** — ~150–300 m to **Ilijan Jeepney Terminal** (SM Batangas parking / PPA coastal side).',
      '2. **Jeepney** — Wait roadside; flag **Dela Paz/Ilijan – Batangas** (signboard: Dela Paz, Ilijan, Pagkilatan, Monte Maria). Alight at **Monte Maria / Pagkilatan**. Extended fare ~**₱23** (~30–45 min).',
      '3. **Walk** — ~200–400 m inland to the shrine.',
    ].join('\n');
  }

  return [
    title,
    '',
    '1. **Walk** — Walk ~200–300 m to the nearest **roadside** point where a jeepney on your corridor passes; **wait at the curb** and **flag down** the matching signboard.',
    '2. **Jeepney** — Ride toward **SM / Ilijan Jeepney Terminal** if you are in the city proper, then board **Dela Paz/Ilijan – Batangas** on **N439**.',
    '3. **Jeepney** — Alight at **Monte Maria / Pagkilatan**; extended fare about **₱23**.',
    '4. **Walk** — Short walk to **Monte Maria Shrine**.',
    '',
    'Tip: Set **From** in the chat header (e.g. CLB, Pier, SM) for an exact optimized plan and map trace.',
  ].join('\n');
}

function originFromCommuteQuestion(message: string, originHint?: string): string {
  const fromMatch = message.match(/\bfrom\s+([^?]+?)\s+to\s+/i);
  if (fromMatch?.[1]?.trim()) return fromMatch[1].trim();
  return originHint?.trim() || 'SM Batangas';
}

export function getEnhancedMockResponse(message: string, originHint?: string): string | null {
  const lower = message.toLowerCase();
  const origin = originFromCommuteQuestion(message, originHint);

  if (/monte maria|montemaria|monte mari|mnte maria/.test(lower)) {
    return buildMonteMariaCommuteReply(origin);
  }

  return null;
}
