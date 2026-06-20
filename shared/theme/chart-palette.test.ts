import {
  chartSeriesPalette,
  resolveSeriesColor,
} from "@/shared/theme/chart-palette";

describe("resolveSeriesColor", () => {
  it("retorna a cor da série pelo índice", () => {
    expect(resolveSeriesColor(0)).toBe(chartSeriesPalette[0]);
    expect(resolveSeriesColor(1)).toBe(chartSeriesPalette[1]);
  });

  it("dá a volta na paleta para índices além do tamanho", () => {
    expect(resolveSeriesColor(chartSeriesPalette.length)).toBe(chartSeriesPalette[0]);
  });

  it("trata índices negativos sem quebrar", () => {
    expect(chartSeriesPalette).toContain(resolveSeriesColor(-1));
  });
});
