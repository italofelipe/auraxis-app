import {
  auraxisDefaultTheme,
  auraxisThemes,
} from "@/config/tamagui-theme";

describe("tamagui theme config", () => {
  it("defaults new runtime trees to the light Auraxis theme", () => {
    expect(auraxisDefaultTheme).toBe("auraxis_light");
    expect(auraxisThemes.auraxis).toBe(auraxisThemes.auraxis_light);
  });

  it("exposes semantic status tokens for both light and dark modes", () => {
    expect(auraxisThemes.auraxis_light.warning).toBe("$warningLight");
    expect(auraxisThemes.auraxis_light.info).toBe("$infoLight");
    expect(auraxisThemes.auraxis_dark.warning).toBe("$warningDark");
    expect(auraxisThemes.auraxis_dark.info).toBe("$infoDark");
  });
});
