/**
 * Lógica pura da cena de splash animada (issue #642): geração determinística
 * das partículas de fundo e cadência do reveal do wordmark. Mantida separada do
 * componente para ser testável sem renderizar a árvore Reanimated/SVG.
 */

/** Palavra-marca revelada abaixo da logo, letra a letra. */
export const SPLASH_WORDMARK = "Auraxis";

/** Quantidade de partículas ("motes") que flutuam atrás da logo. */
export const SPLASH_PARTICLE_COUNT = 16;

/** Atraso base (ms) antes da primeira letra do wordmark aparecer. */
export const WORDMARK_BASE_DELAY_MS = 420;

/** Passo (ms) do stagger entre letras consecutivas do wordmark. */
export const WORDMARK_STEP_MS = 55;

/** Semente padrão do layout de partículas — fixa para um visual estável. */
export const SPLASH_PARTICLE_SEED = 0xa11a5;

/**
 * PRNG determinístico (mulberry32). Dado o mesmo `seed`, produz sempre a mesma
 * sequência em `[0, 1)`. Usado para posicionar partículas de forma estável
 * (mesmo layout a cada boot) e testável.
 *
 * @param seed Semente inteira.
 * @returns Função que retorna o próximo número pseudoaleatório em `[0, 1)`.
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Especificação de uma partícula flutuante da cena. */
export interface SplashParticle {
  readonly key: string;
  /** Posição horizontal absoluta (px). */
  readonly x: number;
  /** Posição vertical absoluta (px). */
  readonly y: number;
  /** Diâmetro do "mote" (px). */
  readonly size: number;
  /** Atraso inicial da animação (ms). */
  readonly delayMs: number;
  /** Duração de um ciclo de subida/fade (ms). */
  readonly durationMs: number;
  /** Deslocamento vertical (px) da deriva para cima. */
  readonly driftY: number;
  /** Opacidade máxima no auge do ciclo (0–1). */
  readonly maxOpacity: number;
}

/** Dimensões da área onde as partículas são distribuídas. */
export interface SplashSceneSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Gera as partículas espalhadas pela tela com tamanhos, atrasos, durações e
 * derivas variados — de forma determinística para um dado `seed`.
 *
 * @param count Número de partículas.
 * @param size Dimensões da área (`width`/`height` em px).
 * @param seed Semente do layout (default {@link SPLASH_PARTICLE_SEED}).
 * @returns Lista de partículas.
 */
export function buildSplashParticles(
  count: number,
  size: SplashSceneSize,
  seed: number = SPLASH_PARTICLE_SEED,
): SplashParticle[] {
  const rand = createSeededRandom(seed);
  const particles: SplashParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    particles.push({
      key: `splash-particle-${i}`,
      x: rand() * size.width,
      y: rand() * size.height,
      size: 2 + rand() * 4,
      delayMs: Math.round(rand() * 900),
      durationMs: 2200 + Math.round(rand() * 1800),
      driftY: 24 + rand() * 48,
      maxOpacity: 0.18 + rand() * 0.3,
    });
  }
  return particles;
}

/**
 * Atraso (ms) do reveal da letra na posição `index`, em cascata.
 *
 * @param index Posição da letra (0-based).
 * @param base Atraso da primeira letra (default {@link WORDMARK_BASE_DELAY_MS}).
 * @param step Passo entre letras (default {@link WORDMARK_STEP_MS}).
 * @returns Atraso não-negativo em ms.
 */
export function wordmarkLetterDelay(
  index: number,
  base: number = WORDMARK_BASE_DELAY_MS,
  step: number = WORDMARK_STEP_MS,
): number {
  return base + Math.max(0, index) * step;
}
