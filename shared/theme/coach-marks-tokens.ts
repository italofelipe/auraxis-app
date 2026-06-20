/**
 * Tokens visuais do tour guiado (coach marks / spotlight) da área de Cartões.
 *
 * Os valores rgba/escurecimento vivem aqui — em `shared/theme/**`, fora do tema
 * resolvido do Tamagui — porque o overlay do tour é SEMPRE escuro em ambos os
 * temas (claro/escuro), assim como o hero e as faces dos cartões
 * (ver `on-dark-surface.ts`). Centralizar aqui mantém os componentes `.tsx`
 * 100% livres de cor/raio hardcoded e satisfaz a governança de estilos.
 */
export const coachMarks = {
  /** Escurecimento dos 4 painéis ao redor do recorte (e da tela em passos centrais). */
  dim: "rgba(7,18,22,0.72)",
  /** Anel branco de 2px ao redor do recorte (spotlight). */
  ring: "rgba(255,255,255,0.92)",
  /** Glow teal de marca projetado ao redor do anel do recorte. */
  glow: "rgba(14,99,118,0.35)",
  /** Raio dos cantos do recorte para alvos retangulares (cards, segmented, chips). */
  radiusGeneral: 16,
  /** Raio dos cantos do recorte para alvos redondos (FAB, toggle de tema). */
  radiusPill: 999,
} as const;

/** Chave de token visual do tour guiado. */
export type CoachMarksTokenKey = keyof typeof coachMarks;
