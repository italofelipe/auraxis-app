import {
  categoryPalette,
  resolveCategoryColor,
} from "@/shared/theme/category-palette";

describe("resolveCategoryColor", () => {
  it("usa a cor real da tag quando é um hex válido", () => {
    expect(resolveCategoryColor({ id: "t1", color: "#123456" })).toBe("#123456");
    expect(resolveCategoryColor({ id: "t2", color: "#ABC" })).toBe("#ABC");
  });

  it("cai na paleta quando a cor é ausente ou inválida", () => {
    expect(categoryPalette).toContain(resolveCategoryColor({ id: "food", color: null }));
    expect(categoryPalette).toContain(resolveCategoryColor({ id: "food", color: "vermelho" }));
    expect(categoryPalette).toContain(resolveCategoryColor({ id: "food", color: "" }));
  });

  it("é determinístico para o mesmo id", () => {
    expect(resolveCategoryColor({ id: "viagem", color: null })).toBe(
      resolveCategoryColor({ id: "viagem", color: null }),
    );
  });

  it("distribui ids diferentes pela paleta", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const colors = new Set(ids.map((id) => resolveCategoryColor({ id, color: null })));
    expect(colors.size).toBeGreaterThan(1);
  });
});
