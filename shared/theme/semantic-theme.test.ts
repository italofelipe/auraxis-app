import {
  darkSemanticColors,
  lightSemanticColors,
  semanticColors,
} from "@/shared/theme/semantic-theme";

describe("semantic theme tokens", () => {
  it("maps dark mode to the canonical DS v3 Market Pulse palette", () => {
    expect(darkSemanticColors).toMatchObject({
      background: "#05070d",
      surface: "#121a2a",
      surfaceRaised: "#172338",
      foreground: "#f1f5ff",
      mutedForeground: "#94a3bf",
      primary: "#44d4ff",
      secondary: "#8b7dff",
      success: "#42e8a9",
      danger: "#ff6f79",
      warning: "#ffb861",
      info: "#44d4ff",
    });
  });

  it("keeps light mode identical to the web canonical light palette (semantic.ts)", () => {
    expect(lightSemanticColors).toMatchObject({
      background: "#F4F8FB",
      surface: "#ffffff",
      surfaceRaised: "#F8FBFF",
      foreground: "#0A1628",
      mutedForeground: "#5D6F89",
      primary: "#087FA7",
      secondary: "#6F62E2",
      success: "#087F5B",
      danger: "#C2414D",
      warning: "#B7791F",
      info: "#2563EB",
    });
  });

  it("uses the light semantic palette as the backwards-compatible default", () => {
    expect(semanticColors).toBe(lightSemanticColors);
  });
});
