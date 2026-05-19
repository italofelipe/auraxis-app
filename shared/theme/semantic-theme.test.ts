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

  it("keeps light mode on DS v3 accents with high-contrast native surfaces", () => {
    expect(lightSemanticColors).toMatchObject({
      background: "#f8fbff",
      surface: "#ffffff",
      surfaceRaised: "#eef4fb",
      foreground: "#0a0f1a",
      mutedForeground: "#2d4466",
      primary: "#1598be",
      secondary: "#594fc2",
      success: "#169b6b",
      danger: "#c53f4a",
      warning: "#c68431",
      info: "#1598be",
    });
  });

  it("uses the light semantic palette as the backwards-compatible default", () => {
    expect(semanticColors).toBe(lightSemanticColors);
  });
});
