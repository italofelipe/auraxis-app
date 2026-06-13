import {
  darkSemanticGlows,
  darkSemanticGradients,
  lightSemanticGlows,
  lightSemanticGradients,
} from "@/shared/theme";

// Garante que todo token novo da fundação (PR-0, épico #540) existe nos DOIS
// temas com o mesmo formato — evita um tema "ganhar" profundidade que o outro
// não tem e quebrar a decisão "ambos os temas impecáveis".
describe("paridade de tokens light/dark (PR-0 fundação)", () => {
  it("glows têm as mesmas chaves em light e dark", () => {
    expect(Object.keys(lightSemanticGlows).sort()).toEqual(
      Object.keys(darkSemanticGlows).sort(),
    );
  });

  it("gradientes têm as mesmas chaves em light e dark, cada um com 2+ stops", () => {
    expect(Object.keys(lightSemanticGradients).sort()).toEqual(
      Object.keys(darkSemanticGradients).sort(),
    );
    for (const gradient of Object.values(darkSemanticGradients)) {
      expect(gradient.colors.length).toBeGreaterThanOrEqual(2);
    }
    for (const gradient of Object.values(lightSemanticGradients)) {
      expect(gradient.colors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("glow de marca usa a cor primária do tema (não a sombra preta padrão)", () => {
    expect(lightSemanticGlows.brand.shadowColor).not.toBe("#000000");
    expect(darkSemanticGlows.brand.shadowColor).not.toBe("#000000");
    expect(lightSemanticGlows.brand.shadowColor).not.toBe(
      darkSemanticGlows.brand.shadowColor,
    );
  });
});
