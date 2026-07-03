import {
  SPLASH_PARTICLE_COUNT,
  SPLASH_WORDMARK,
  buildSplashParticles,
  createSeededRandom,
  wordmarkLetterDelay,
} from "@/core/shell/splash-scene";

describe("createSeededRandom", () => {
  it("e deterministico por seed e sempre em [0, 1)", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    for (let i = 0; i < 25; i += 1) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("produz sequencias diferentes para seeds diferentes", () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });
});

describe("buildSplashParticles", () => {
  it("gera a quantidade pedida, deterministica e dentro dos limites", () => {
    const size = { width: 400, height: 800 };
    const first = buildSplashParticles(SPLASH_PARTICLE_COUNT, size);
    const second = buildSplashParticles(SPLASH_PARTICLE_COUNT, size);

    expect(first).toHaveLength(SPLASH_PARTICLE_COUNT);
    expect(first).toEqual(second);

    for (const particle of first) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(400);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(800);
      expect(particle.size).toBeGreaterThan(0);
      expect(particle.durationMs).toBeGreaterThan(0);
      expect(particle.delayMs).toBeGreaterThanOrEqual(0);
      expect(particle.driftY).toBeGreaterThan(0);
      expect(particle.maxOpacity).toBeGreaterThan(0);
      expect(particle.maxOpacity).toBeLessThanOrEqual(1);
    }
  });

  it("varia o layout conforme a seed", () => {
    const a = buildSplashParticles(8, { width: 400, height: 800 }, 1);
    const b = buildSplashParticles(8, { width: 400, height: 800 }, 2);
    expect(a).not.toEqual(b);
  });
});

describe("wordmarkLetterDelay", () => {
  it("cresce monotonicamente com o indice", () => {
    expect(wordmarkLetterDelay(0)).toBeLessThan(wordmarkLetterDelay(1));
    expect(wordmarkLetterDelay(2)).toBeLessThan(wordmarkLetterDelay(5));
  });

  it("nunca retorna atraso negativo", () => {
    expect(wordmarkLetterDelay(-4)).toBeGreaterThanOrEqual(0);
    expect(wordmarkLetterDelay(-4)).toBe(wordmarkLetterDelay(0));
  });
});

describe("SPLASH_WORDMARK", () => {
  it("e a marca Auraxis", () => {
    expect(SPLASH_WORDMARK).toBe("Auraxis");
  });
});
