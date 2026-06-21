import { renderHook } from "@testing-library/react-native";

import { selectFluidaVM } from "@/features/insights/mocks/fluida-vm";
import { useInsightSection } from "@/features/insights/hooks/use-insight-section";
import { isFeatureEnabled } from "@/shared/feature-flags";

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

beforeEach(() => {
  jest.clearAllMocks();
  mockedIsFeatureEnabled.mockReturnValue(true);
});

describe("useInsightSection", () => {
  it("gates on the app.insights.fluida flag", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useInsightSection("transactions"));

    expect(mockedIsFeatureEnabled).toHaveBeenCalledWith("app.insights.fluida");
    expect(result.current).toBeNull();
  });

  it("returns the compact recorte for the requested dimension when enabled", () => {
    const { result } = renderHook(() => useInsightSection("transactions"));
    const fullVM = selectFluidaVM({ dimension: "transactions", cadence: "daily" });

    expect(result.current).not.toBeNull();
    expect(result.current?.dimension).toBe("transactions");
    expect(result.current?.severity).toBe(fullVM.severity);
    expect(result.current?.title).toBe(fullVM.title);
    expect(result.current?.lead).toBe(fullVM.lead);
  });

  it("condenses the highlights to at most two (compact section)", () => {
    const { result } = renderHook(() => useInsightSection("transactions"));
    const fullVM = selectFluidaVM({ dimension: "transactions", cadence: "daily" });

    expect(fullVM.highlights.length).toBeGreaterThan(2);
    expect(result.current?.highlights).toHaveLength(2);
    expect(result.current?.highlights[0]).toEqual(fullVM.highlights[0]);
  });

  it("falls back to the general recorte for an unmapped dimension", () => {
    const { result } = renderHook(() => useInsightSection("wallet"));
    const generalVM = selectFluidaVM({ dimension: "general", cadence: "daily" });

    expect(result.current?.dimension).toBe("general");
    expect(result.current?.title).toBe(generalVM.title);
  });

  it("re-derives the recorte when the dimension changes", () => {
    const { result, rerender } = renderHook(
      ({ dimension }: { dimension: string }) => useInsightSection(dimension),
      { initialProps: { dimension: "goals" } },
    );

    expect(result.current?.dimension).toBe("goals");

    rerender({ dimension: "budgets" });

    expect(result.current?.dimension).toBe("budgets");
  });
});
