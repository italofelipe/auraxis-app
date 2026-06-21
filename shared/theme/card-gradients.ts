import { hashStringToIndex } from "@/shared/utils/hash";

/**
 * Stops de gradiente no formato consumido por `expo-linear-gradient`
 * (`colors` + `start`/`end`). Mesma forma dos `lightSemanticGradients`.
 */
export interface GradientStops {
  readonly colors: readonly [string, string];
  readonly start: { readonly x: number; readonly y: number };
  readonly end: { readonly x: number; readonly y: number };
}

const stops = (from: string, to: string): GradientStops => ({
  colors: [from, to],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

// Gradientes de marca do handoff. Iguais em claro/escuro — a face do cartão é
// sempre escura com texto branco, independente do tema do app.
const interGradient = stops("#FF7A00", "#FF5500");
const nubankGradient = stops("#820AD1", "#5B0A92");
const mercadoPagoGradient = stops("#00A6E6", "#0066CC");
const uniqueGradient = stops("#EC0000", "#B30000");
const tealGradient = stops("#0E6376", "#0A2F38");
const slateGradient = stops("#3A4A66", "#1F2940");
const indigoGradient = stops("#4B5BD6", "#2E3A99");

/**
 * Paleta de gradientes para emissores sem cor de marca conhecida. A escolha é
 * estável por id do cartão (ver `resolveCardGradient`).
 */
export const cardGradientPalette: readonly GradientStops[] = [
  tealGradient,
  slateGradient,
  indigoGradient,
  interGradient,
  nubankGradient,
  mercadoPagoGradient,
  uniqueGradient,
];

/** Gradiente do card agregado "Todos os cartões" (teal escuro do handoff). */
export const allCardsGradient: GradientStops = stops("#143B45", "#08222A");

/** Emissores conhecidos → gradiente de marca (chaves normalizadas). */
const KNOWN_ISSUERS: readonly (readonly [readonly string[], GradientStops])[] = [
  [["inter"], interGradient],
  [["nubank"], nubankGradient],
  [["mercado pago", "mercadopago"], mercadoPagoGradient],
  [["unique", "santander"], uniqueGradient],
];

// Marcas diacríticas combinantes (U+0300–U+036F), via code point para manter o
// fonte 100% ASCII.
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

const normalize = (value: string): string =>
  value.normalize("NFD").replace(DIACRITICS, "").trim().toLowerCase();

/** Entrada mínima para resolver o gradiente de um cartão. */
export interface CardGradientInput {
  readonly id: string;
  readonly bank?: string | null;
  readonly name?: string | null;
}

/**
 * Resolve o gradiente da face de um cartão: usa a cor de marca quando o emissor
 * é conhecido (banco ou nome), senão escolhe um gradiente estável da paleta.
 *
 * @param card Cartão (id obrigatório; banco/nome ajudam a identificar a marca).
 * @returns Stops de gradiente para `expo-linear-gradient`.
 */
export const resolveCardGradient = (card: CardGradientInput): GradientStops => {
  const haystack = normalize(`${card.bank ?? ""} ${card.name ?? ""}`);
  for (const [keys, gradient] of KNOWN_ISSUERS) {
    if (keys.some((key) => haystack.includes(key))) {
      return gradient;
    }
  }
  return (
    cardGradientPalette[hashStringToIndex(card.id, cardGradientPalette.length)] ??
    tealGradient
  );
};
