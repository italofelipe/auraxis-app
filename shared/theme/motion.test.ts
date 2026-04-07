import { motionDurations, motionOpacity, motionScales } from "@/shared/theme/motion";

describe("motion tokens", () => {
  it("mantem duracoes crescentes para as animacoes padrao", () => {
    expect(motionDurations.fast).toBeLessThan(motionDurations.normal);
    expect(motionDurations.normal).toBeLessThan(motionDurations.slow);
  });

  it("mantem escalas e opacidades dentro do intervalo esperado", () => {
    expect(motionScales.pressIn).toBeLessThan(1);
    expect(motionScales.pressOut).toBe(1);
    expect(motionOpacity.hidden).toBe(0);
    expect(motionOpacity.visible).toBe(1);
  });
});
