import {
  motionDurations,
  motionScales,
} from "@/config/design-tokens";

export const motionOpacity = {
  hidden: 0,
  visible: 1,
} as const;

/**
 * Curvas de easing canônicas (tuplas cubic-bezier), paridade com o web
 * (`--motion-ease-standard`, `--motion-ease-emphasized`). Consumir com
 * `Easing.bezier(...motionEasings.standard)` no Reanimated.
 */
export const motionEasings = {
  standard: [0.2, 0, 0, 1] as const,
  decelerate: [0, 0, 0, 1] as const,
  accelerate: [0.3, 0, 1, 1] as const,
  emphasized: [0.16, 1, 0.3, 1] as const,
} as const;

/** Atraso entre itens em revelações em cascata (stagger) de listas. */
export const motionStagger = 60;

/** Deslocamentos canônicos de entrada (em px) para reveals e sheets. */
export const motionTranslate = {
  revealY: 8,
  sheetY: 24,
} as const;

export type MotionEasingKey = keyof typeof motionEasings;

export { motionDurations, motionScales };
