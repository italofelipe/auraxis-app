import { renderHook } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { resetAppShellStore, useAppShellStore } from "@/core/shell/app-shell-store";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";

const useColorSchemeSpy = jest.spyOn(ReactNative, "useColorScheme");

describe("useResolvedTheme", () => {
  beforeEach(() => {
    resetAppShellStore();
  });

  it("retorna auraxis_dark quando preferência é \"dark\"", () => {
    useAppShellStore.getState().setThemePreference("dark");
    useColorSchemeSpy.mockReturnValue("light");
    const { result } = renderHook(() => useResolvedTheme());
    expect(result.current).toBe("auraxis_dark");
  });

  it("retorna auraxis_light quando preferência é \"light\"", () => {
    useAppShellStore.getState().setThemePreference("light");
    useColorSchemeSpy.mockReturnValue("dark");
    const { result } = renderHook(() => useResolvedTheme());
    expect(result.current).toBe("auraxis_light");
  });

  it("em \"system\" segue o color scheme do device (light)", () => {
    useAppShellStore.getState().setThemePreference("system");
    useColorSchemeSpy.mockReturnValue("light");
    const { result } = renderHook(() => useResolvedTheme());
    expect(result.current).toBe("auraxis_light");
  });

  it("em \"system\" segue o color scheme do device (dark)", () => {
    useAppShellStore.getState().setThemePreference("system");
    useColorSchemeSpy.mockReturnValue("dark");
    const { result } = renderHook(() => useResolvedTheme());
    expect(result.current).toBe("auraxis_dark");
  });

  it("em \"system\" cai em dark quando o device retorna null", () => {
    useAppShellStore.getState().setThemePreference("system");
    useColorSchemeSpy.mockReturnValue(null);
    const { result } = renderHook(() => useResolvedTheme());
    expect(result.current).toBe("auraxis_dark");
  });
});
