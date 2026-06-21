import {
  allCardsGradient,
  cardGradientPalette,
  resolveCardGradient,
} from "@/shared/theme/card-gradients";

describe("resolveCardGradient", () => {
  it("mapeia emissores conhecidos para a cor de marca", () => {
    expect(resolveCardGradient({ id: "1", bank: "Inter" }).colors[0]).toBe("#FF7A00");
    expect(resolveCardGradient({ id: "2", bank: "Nubank" }).colors[0]).toBe("#820AD1");
    expect(resolveCardGradient({ id: "3", bank: "Mercado Pago" }).colors[0]).toBe("#00A6E6");
  });

  it("ignora acentuação e caixa no nome do emissor", () => {
    expect(resolveCardGradient({ id: "4", bank: "NUBANK" }).colors[0]).toBe("#820AD1");
    expect(resolveCardGradient({ id: "5", bank: "  inter  " }).colors[0]).toBe("#FF7A00");
  });

  it("usa o nome do cartão quando não há banco", () => {
    expect(resolveCardGradient({ id: "6", name: "Nubank Ultravioleta" }).colors[0]).toBe("#820AD1");
  });

  it("emissor desconhecido recebe um gradiente estável da paleta", () => {
    const first = resolveCardGradient({ id: "card-xyz", bank: "Banco Qualquer" });
    const again = resolveCardGradient({ id: "card-xyz", bank: "Banco Qualquer" });
    expect(first).toEqual(again);
    expect(cardGradientPalette).toContainEqual(first);
  });

  it("retorna o formato esperado por expo-linear-gradient", () => {
    const gradient = resolveCardGradient({ id: "7", bank: "Inter" });
    expect(gradient.colors).toHaveLength(2);
    expect(gradient.start).toEqual({ x: 0, y: 0 });
    expect(gradient.end).toEqual({ x: 1, y: 1 });
  });

  it("expõe um gradiente agregado para 'Todos os cartões'", () => {
    expect(allCardsGradient.colors).toHaveLength(2);
  });
});
