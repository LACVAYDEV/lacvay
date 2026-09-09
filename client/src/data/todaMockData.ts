import type { TodaTerritory } from '@/types';

export const todaTerritories: TodaTerritory[] = [
  {
    id: 'toda-poblacion',
    name: 'Poblacion TODA',
    barangays: ['Poblacion', 'Kumintang Ibaba', 'Kumintang Ilaya'],
    terminalLocation: 'Poblacion Public Market trike stand',
    operatingHours: '5:00 AM – 9:00 PM daily',
    fareNote: '₱20–₱40 within barangay; fixed routes to SM & terminal',
  },
  {
    id: 'toda-capitolio',
    name: 'Capitolio–Balagtas TODA',
    barangays: ['Capitolio', 'Balagtas', 'Gulod Labac'],
    terminalLocation: 'Capitol Site near provincial capitol',
    operatingHours: '5:30 AM – 8:30 PM daily',
    fareNote: '₱20–₱50 depending on distance within territory',
  },
  {
    id: 'toda-alangilan',
    name: 'Alangilan TODA',
    barangays: ['Alangilan', 'Mabini', 'Calicanto'],
    terminalLocation: 'Alangilan crossing trike terminal',
    operatingHours: '6:00 AM – 8:00 PM daily',
    fareNote: '₱25–₱60; cannot cross into other TODA zones',
  },
  {
    id: 'toda-bolbok',
    name: 'Bolbok–Tabangao TODA',
    barangays: ['Bolbok', 'Tabangao Aplaya', 'Tabangao Dao'],
    terminalLocation: 'Bolbok highway trike line',
    operatingHours: '5:00 AM – 9:00 PM daily',
    fareNote: '₱20–₱45 short hops; terminal-to-barangay rates posted at stand',
  },
  {
    id: 'toda-cuta',
    name: 'Cuta–Libjo TODA',
    barangays: ['Cuta', 'Libjo', 'Haligue Kanluran'],
    terminalLocation: 'Grand Terminal south trike bay',
    operatingHours: '24 hours (limited after 10 PM)',
    fareNote: '₱20–₱55; connects terminal passengers to inner barangays',
  },
  {
    id: 'toda-pallocan',
    name: 'Pallocan West TODA',
    barangays: ['Pallocan West', 'Pallocan East', 'San Agustin'],
    terminalLocation: 'Pallocan church plaza trike queue',
    operatingHours: '5:30 AM – 8:00 PM daily',
    fareNote: '₱20–₱40 within zone; ask driver before boarding',
  },
];

export function findTodaByBarangay(query: string): TodaTerritory[] {
  const q = query.trim().toLowerCase();
  if (!q) return todaTerritories;
  return todaTerritories.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.barangays.some((b) => b.toLowerCase().includes(q)) ||
      t.terminalLocation.toLowerCase().includes(q),
  );
}
