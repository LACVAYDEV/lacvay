import type { CommuteGuideLeg, CommuteGuidePlan, GuideLegMode } from '@/types';

/** Known Batangas landmarks for client-side map fallback when API plan is missing. */
const KNOWN: Record<string, { label: string; lat: number; lng: number; aliases: string[] }> = {
  clb: {
    label: 'Colegio ng Lungsod ng Batangas (CLB)',
    lat: 13.7539,
    lng: 121.05,
    aliases: ['clb', 'colegio ng lungsod', 'sports coliseum', 'arrieta'],
  },
  stoNino: {
    label: 'Barangay Sto. Niño',
    lat: 13.699,
    lng: 121.0941,
    aliases: ['sto nino', 'santo nino', 'barangay sto', 'brgy sto'],
  },
  sm: {
    label: 'SM City Batangas',
    lat: 13.7594,
    lng: 121.0722,
    aliases: ['sm batangas', 'sm city', 'sm city batangas'],
  },
  pier: {
    label: 'Batangas Pier',
    lat: 13.754,
    lng: 121.043,
    aliases: ['pier', 'batangas pier', 'batangas port', 'ppa'],
  },
  monteMaria: {
    label: 'Monte Maria',
    lat: 13.6422,
    lng: 121.0465,
    aliases: ['monte maria', 'montemaria'],
  },
  grandTerminal: {
    label: 'Batangas City Grand Terminal',
    lat: 13.7818,
    lng: 121.0543,
    aliases: ['grand terminal', 'city terminal'],
  },
  pabloBorbon: {
    label: 'BatStateU Pablo Borbon Main Campus (Alangilan)',
    lat: 13.786,
    lng: 121.074,
    aliases: ['pablo borbon', 'batstateu', 'alangilan', 'main campus'],
  },
  basilica: {
    label: 'Minor Basilica',
    lat: 13.7565,
    lng: 121.0583,
    aliases: ['basilica', 'plaza mabini'],
  },
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findKnown(text: string) {
  const n = normalize(text);
  let best: (typeof KNOWN)[string] | null = null;
  let bestLen = 0;
  for (const place of Object.values(KNOWN)) {
    for (const alias of place.aliases) {
      const a = normalize(alias);
      if (n.includes(a) && a.length >= bestLen) {
        best = place;
        bestLen = a.length;
      }
    }
  }
  return best;
}

function detectMode(line: string): GuideLegMode | null {
  if (/\bwalk\b/i.test(line)) return 'walk';
  if (/\bjeepney\b/i.test(line)) return 'jeepney';
  if (/\btnvs\b|\bangkas\b|\bgrab\b|\bidol\b/i.test(line)) return 'tnvs';
  return null;
}

/** True when the assistant reply looks like a numbered commute itinerary. */
export function looksLikeCommuteReply(content: string): boolean {
  const hasSteps = /^\s*\d+[.)]\s+/m.test(content);
  const hasModes = /\b(Walk|Jeepney|TNVS|Angkas|Grab)\b/i.test(content);
  const hasArrow = /→|->|to\b/i.test(content);
  return (hasSteps && hasModes) || (hasModes && hasArrow && content.length > 80);
}

/**
 * Build a map-ready plan from reply text when the API did not attach `plan`.
 * Uses known landmark coordinates so the Commute Guide page still opens.
 */
export function buildFallbackCommutePlan(
  content: string,
  originHint?: string,
): CommuteGuidePlan | null {
  const arrow =
    content.match(/\*\*([^*]+?)\s*→\s*([^*]+?)\*\*/) ||
    content.match(/([^\n→]+?)\s*→\s*([^\n]+)/);
  const originText = arrow?.[1]?.replace(/[*#]/g, '').trim() || originHint || '';
  const destText = arrow?.[2]?.replace(/[*#]/g, '').trim() || '';

  const originKnown = findKnown(originText) || (originHint ? findKnown(originHint) : null);
  const destKnown = findKnown(destText) || findKnown(content);

  if (!originKnown && !destKnown) return null;

  const origin = originKnown
    ? { label: originKnown.label, lat: originKnown.lat, lng: originKnown.lng }
    : {
        label: originText || 'Origin',
        lat: 13.7565,
        lng: 121.0583,
      };
  const destination = destKnown
    ? { label: destKnown.label, lat: destKnown.lat, lng: destKnown.lng }
    : originKnown && destText
      ? { label: destText.slice(0, 60), lat: origin.lat + 0.01, lng: origin.lng + 0.01 }
      : {
          label: destText || 'Destination',
          lat: 13.7565,
          lng: 121.0583,
        };

  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const legs: CommuteGuideLeg[] = [];
  let order = 1;
  for (const line of lines) {
    const num = line.match(/^\d+[.)]\s+(.+)/);
    if (!num) continue;
    const mode = detectMode(num[1]) ?? detectMode(line);
    if (!mode) continue;
    const description = num[1].replace(/[*_]/g, '').trim();
    const t0 = (order - 1) / Math.max(3, order + 1);
    const t1 = order / Math.max(3, order + 1);
    legs.push({
      order: order++,
      mode,
      title: mode === 'walk' ? 'Walk' : mode === 'jeepney' ? 'Jeepney' : 'TNVS',
      description,
      path: [
        [
          origin.lat + (destination.lat - origin.lat) * t0,
          origin.lng + (destination.lng - origin.lng) * t0,
        ],
        [
          origin.lat + (destination.lat - origin.lat) * t1,
          origin.lng + (destination.lng - origin.lng) * t1,
        ],
      ],
    });
  }

  if (!legs.length) {
    legs.push({
      order: 1,
      mode: 'walk',
      title: 'Walk',
      description: `From ${origin.label} toward ${destination.label}`,
      path: [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
    });
  }

  return {
    title: `${origin.label} → ${destination.label}`,
    origin,
    destination,
    planType: 'from_reply',
    legs,
    totalMinutes: null,
    totalFareRegular: null,
    totalFareDiscounted: null,
    sourceReply: content,
  };
}
