/**
 * Normalizes a raw reading-time value into a positive whole number of
 * minutes. Non-finite, zero or negative inputs fall back to a 1-minute
 * floor; fractional values are rounded up so a "2.1 min" estimate never
 * reads as "2 min" of content the user cannot finish.
 *
 * @param readMinutes Raw reading time (possibly fractional or invalid).
 * @returns Whole-minute reading time, at least 1.
 */
export const normalizeReadMinutes = (readMinutes: number): number => {
  if (!Number.isFinite(readMinutes) || readMinutes <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(readMinutes));
};

/**
 * Formats a reading time as the badge label used in the lead, e.g.
 * "15 min de leitura". Input is normalized first via
 * {@link normalizeReadMinutes}.
 *
 * @param readMinutes Reading time in minutes.
 * @returns Localised "{n} min de leitura" label.
 */
export const formatReadTime = (readMinutes: number): string => {
  return `${normalizeReadMinutes(readMinutes)} min de leitura`;
};
