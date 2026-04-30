/**
 * Formats a number as Brazilian Real currency with 2 decimals.
 * @param value Amount in BRL.
 * @returns Localized currency string.
 */
export const formatBrl = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Formats a decimal rate as a percentage with 2 decimals.
 * @param rate Decimal rate (e.g. 0.075).
 * @returns Localized percentage string (e.g. "7,50%").
 */
export const formatRatePercent = (rate: number): string =>
  `${(rate * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

/**
 * Formats a percentage value as the localized percent string.
 * @param percent Percentage value already in percent form (e.g. 7.5).
 * @returns Localized percentage string.
 */
export const formatPercent = (percent: number): string =>
  `${percent.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
