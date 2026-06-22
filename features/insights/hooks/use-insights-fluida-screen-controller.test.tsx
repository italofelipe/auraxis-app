import { act, renderHook } from "@testing-library/react-native";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { selectFluidaVM } from "@/features/insights/mocks/fluida-vm";
import { useInsightsFluidaScreenController } from "@/features/insights/hooks/use-insights-fluida-screen-controller";

jest.mock("@/core/shell/use-resolved-theme", () => ({
  useResolvedTheme: jest.fn(),
}));

const mockedUseResolvedTheme = jest.mocked(useResolvedTheme);
const setThemePreference = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseResolvedTheme.mockReturnValue("auraxis_light");
  jest
    .spyOn(useAppShellStore, "getState")
    .mockReturnValue({ setThemePreference } as never);
});

describe("useInsightsFluidaScreenController", () => {
  it("starts on the general dimension and the daily cadence", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.dimension).toBe("general");
    expect(result.current.cadence).toBe("daily");
  });

  it("starts on the dimension passed in (deep-link from a feature page)", () => {
    const { result } = renderHook(() =>
      useInsightsFluidaScreenController({ initialDimension: "transactions" }),
    );

    expect(result.current.dimension).toBe("transactions");
    expect(result.current.cadence).toBe("daily");
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "transactions", cadence: "daily" }),
    );
  });

  it("ignores an undefined initial dimension and keeps the general default", () => {
    const { result } = renderHook(() =>
      useInsightsFluidaScreenController({ initialDimension: undefined }),
    );

    expect(result.current.dimension).toBe("general");
  });

  it("still lets the user switch dimension after a deep-linked start", () => {
    const { result } = renderHook(() =>
      useInsightsFluidaScreenController({ initialDimension: "budgets" }),
    );

    expect(result.current.dimension).toBe("budgets");

    act(() => {
      result.current.selectDimension("goals");
    });

    expect(result.current.dimension).toBe("goals");
  });

  it("derives the full VM from the mock for the active dimension × cadence", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "daily" }),
    );
  });

  it("re-derives the VM when the dimension changes", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectDimension("transactions");
    });

    expect(result.current.dimension).toBe("transactions");
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "transactions", cadence: "daily" }),
    );
  });

  it("re-derives the VM when the cadence changes", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectCadence("weekly");
    });

    expect(result.current.cadence).toBe("weekly");
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "weekly" }),
    );
  });

  it("exposes comparative cards only on the general dimension", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.showCompare).toBe(true);
    expect(result.current.vm.retro.length).toBeGreaterThan(0);

    act(() => {
      result.current.selectDimension("transactions");
    });

    expect(result.current.showCompare).toBe(false);
  });

  it("keeps every beat coherent when cadence changes after a dimension change", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectDimension("transactions");
    });
    act(() => {
      result.current.selectCadence("weekly");
    });

    // No stale state: dimension + cadence both reflected, VM fully re-derived.
    expect(result.current.dimension).toBe("transactions");
    expect(result.current.cadence).toBe("weekly");
    expect(result.current.showCompare).toBe(false);
    expect(result.current.vm).toEqual(
      selectFluidaVM({ dimension: "transactions", cadence: "weekly" }),
    );
    expect(result.current.vm.retro).toHaveLength(0);
  });

  it("re-derives the chart series and compare flag together when switching back to general", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.selectCadence("weekly");
    });
    act(() => {
      result.current.selectDimension("budgets");
    });
    act(() => {
      result.current.selectDimension("general");
    });

    // Back on general at the weekly cadence: compare returns AND the weekly
    // series is the one exposed — nothing pinned from the daily/budgets path.
    expect(result.current.cadence).toBe("weekly");
    expect(result.current.showCompare).toBe(true);
    expect(result.current.vm.retro.length).toBeGreaterThan(0);
    expect(result.current.vm.series).toEqual(
      selectFluidaVM({ dimension: "general", cadence: "weekly" }).series,
    );
  });

  it("exposes the resolved colour scheme as a boolean isDark flag", () => {
    mockedUseResolvedTheme.mockReturnValue("auraxis_dark");

    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.isDark).toBe(true);
  });

  it("pins the opposite preference when the theme is toggled (light → dark)", () => {
    mockedUseResolvedTheme.mockReturnValue("auraxis_light");
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.toggleTheme();
    });

    expect(setThemePreference).toHaveBeenCalledWith("dark");
  });

  it("pins light when toggled away from a dark scheme (dark → light)", () => {
    mockedUseResolvedTheme.mockReturnValue("auraxis_dark");
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    act(() => {
      result.current.toggleTheme();
    });

    expect(setThemePreference).toHaveBeenCalledWith("light");
  });

  it("lists the five theme tabs in the canonical order with labels", () => {
    const { result } = renderHook(() => useInsightsFluidaScreenController());

    expect(result.current.dimensionTabs.map((tab) => tab.value)).toEqual([
      "general",
      "transactions",
      "goals",
      "budgets",
      "credit_cards",
    ]);
    result.current.dimensionTabs.forEach((tab) => {
      expect(tab.label.length).toBeGreaterThan(0);
    });
  });
});
