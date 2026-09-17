/**
 * Utility functions for structured time and automatic open/close status evaluation.
 */

/**
 * Formats a 24-hour time string ("08:00" or "17:30") to 12-hour format ("8:00 AM", "5:30 PM").
 */
export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Creates a formatted opening hours string (e.g. "8:00 AM – 5:00 PM") from open and close times.
 */
export function formatOpeningHours(openTime?: string, closeTime?: string): string {
  if (!openTime && !closeTime) return '';
  if (openTime && !closeTime) return `Opens at ${formatTime12h(openTime)}`;
  if (!openTime && closeTime) return `Closes at ${formatTime12h(closeTime)}`;
  if (openTime === closeTime) return 'Open 24 hours';
  return `${formatTime12h(openTime)} – ${formatTime12h(closeTime)}`;
}

/**
 * Evaluates whether an establishment is currently open based on its opening and closing hours
 * compared to current local time.
 * Correctly handles standard daytime shifts (e.g. 08:00 to 21:00) and overnight shifts (e.g. 18:00 to 02:00).
 */
export function isCurrentlyOpenNow(openTime?: string, closeTime?: string): boolean {
  if (!openTime || !closeTime) return true;
  if (openTime === closeTime) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openTime.split(':').map((v) => parseInt(v, 10));
  const [closeH, closeM] = closeTime.split(':').map((v) => parseInt(v, 10));

  if (isNaN(openH) || isNaN(closeH)) return true;

  const startMinutes = openH * 60 + (openM || 0);
  const endMinutes = closeH * 60 + (closeM || 0);

  if (startMinutes < endMinutes) {
    // Normal day shift (e.g. 08:00 -> 21:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight shift (e.g. 18:00 -> 02:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
