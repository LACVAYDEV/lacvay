/**
 * Sanity-check mobile chart width budget (no browser required).
 * Real UI uses the same grid: repeat(7, minmax(0, 1fr)).
 */
const CARD_WIDTH = 320;
const CARD_PADDING = 12 * 2;
const INNER_PADDING = 4 * 2;
const GRID_GAPS = 6; // gap-px × 6
const CONTENT_WIDTH = CARD_WIDTH - CARD_PADDING - INNER_PADDING - GRID_GAPS;
const COL_WIDTH = CONTENT_WIDTH / 7;
const BAR_WIDTH = COL_WIDTH * 0.72;
const MIN_LABEL = 7; // 7px font "Wed"

if (COL_WIDTH < MIN_LABEL || BAR_WIDTH > COL_WIDTH) {
  console.error('Chart column too narrow:', { COL_WIDTH, BAR_WIDTH });
  process.exit(1);
}

if (CONTENT_WIDTH + CARD_PADDING + INNER_PADDING + GRID_GAPS > CARD_WIDTH) {
  console.error('Chart exceeds card width');
  process.exit(1);
}

console.log('Chart width budget OK:', {
  cardWidth: CARD_WIDTH,
  columnWidthPx: COL_WIDTH.toFixed(1),
  barWidthPx: BAR_WIDTH.toFixed(1),
});
