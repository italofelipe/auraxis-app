import {
  auraxisDefaultTheme,
  auraxisThemes,
} from "@/config/tamagui-theme";

describe("tamagui theme config", () => {
  it("defaults new runtime trees to the light Auraxis theme", () => {
    expect(auraxisDefaultTheme).toBe("auraxis_light");
    expect(auraxisThemes.auraxis).toBe(auraxisThemes.auraxis_light);
  });

  it("exposes semantic status colors as CONCRETE values (nunca referências $token — bug #543)", () => {
    expect(auraxisThemes.auraxis_light.warning).toBe("#B7791F");
    expect(auraxisThemes.auraxis_light.info).toBe("#2563EB");
    expect(auraxisThemes.auraxis_dark.warning).toBe("#ffb861");
    expect(auraxisThemes.auraxis_dark.info).toBe("#44d4ff");
    const allValues = [
      ...Object.values(auraxisThemes.auraxis_light),
      ...Object.values(auraxisThemes.auraxis_dark),
    ];
    expect(allValues.some((value) => String(value).startsWith("$"))).toBe(false);
  });
});
