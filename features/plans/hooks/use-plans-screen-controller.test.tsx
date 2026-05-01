import { act, renderHook } from "@testing-library/react-native";

import { useBillingPlansQuery } from "@/features/subscription/hooks/use-billing-plans-query";
import { useSessionStore } from "@/core/session/session-store";
import { usePlansScreenController } from "@/features/plans/hooks/use-plans-screen-controller";
import type { BillingPlan } from "@/features/subscription/contracts";

const mockReplaceFn = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplaceFn,
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
}));

jest.mock("@/features/subscription/hooks/use-billing-plans-query", () => ({
  useBillingPlansQuery: jest.fn(),
}));

jest.mock("@/core/session/session-store", () => ({
  useSessionStore: jest.fn(),
}));

const mockedUseBillingPlansQuery = jest.mocked(useBillingPlansQuery);
const mockedUseSessionStore = jest.mocked(useSessionStore);

const buildPlan = (overrides: Partial<BillingPlan> = {}): BillingPlan => ({
  slug: "premium-monthly",
  planCode: "premium",
  tier: "premium",
  billingCycle: "monthly",
  displayName: "Premium",
  description: "Premium features",
  priceCents: 3990,
  currency: "BRL",
  trialDays: 0,
  checkoutEnabled: true,
  highlighted: true,
  ...overrides,
});

const FREE_PLAN = buildPlan({
  slug: "free",
  planCode: "free",
  tier: "free",
  billingCycle: null,
  displayName: "Free",
  description: "Free tier",
  priceCents: 0,
  highlighted: false,
});

const PREMIUM_MONTHLY = buildPlan({
  slug: "premium-monthly",
  billingCycle: "monthly",
  priceCents: 3990,
});

const PREMIUM_ANNUAL = buildPlan({
  slug: "premium-annual",
  billingCycle: "annual",
  priceCents: 38400,
});

const setQueryState = (
  state: Partial<ReturnType<typeof useBillingPlansQuery>>,
): void => {
  mockedUseBillingPlansQuery.mockReturnValue(state as never);
};

const setSession = (isAuthenticated: boolean): void => {
  mockedUseSessionStore.mockImplementation(((
    selector: (s: { isAuthenticated: boolean }) => unknown,
  ) => selector({ isAuthenticated })) as unknown as typeof useSessionStore);
};

describe("usePlansScreenController", () => {
  beforeEach(() => {
    mockReplaceFn.mockReset();
    setSession(false);
    setQueryState({
      data: [FREE_PLAN, PREMIUM_MONTHLY, PREMIUM_ANNUAL],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("collapses per-cycle plans into one tier per row", () => {
    const { result } = renderHook(() => usePlansScreenController());
    expect(result.current.tiers).toHaveLength(2);
    const premium = result.current.tiers.find((t) => t.tier === "premium")!;
    expect(premium.priceMonthlyCents).toBe(3990);
    expect(premium.priceAnnualCents).toBe(38400);
    expect(premium.hasMonthly).toBe(true);
    expect(premium.hasAnnual).toBe(true);
  });

  it("starts with monthly cycle and toggles to annual", () => {
    const { result } = renderHook(() => usePlansScreenController());
    expect(result.current.billingCycle).toBe("monthly");
    act(() => {
      result.current.toggleCycle();
    });
    expect(result.current.billingCycle).toBe("annual");
    act(() => {
      result.current.toggleCycle();
    });
    expect(result.current.billingCycle).toBe("monthly");
  });

  it("computes the annual discount percent vs monthly", () => {
    const { result } = renderHook(() => usePlansScreenController());
    expect(result.current.annualDiscountPercent).toBeGreaterThan(0);
    expect(result.current.annualDiscountPercent).toBeLessThanOrEqual(50);
  });

  it("returns 0% discount when premium has no annual price", () => {
    setQueryState({
      data: [FREE_PLAN, PREMIUM_MONTHLY],
      isLoading: false,
      isError: false,
      error: null,
    });
    const { result } = renderHook(() => usePlansScreenController());
    expect(result.current.annualDiscountPercent).toBe(0);
  });

  it("returns the canonical seven-row feature comparison", () => {
    const { result } = renderHook(() => usePlansScreenController());
    expect(result.current.featureRows).toHaveLength(7);
    expect(result.current.featureRows.map((r) => r.key)).toEqual([
      "transactions",
      "goals",
      "basicReports",
      "advancedReports",
      "simulations",
      "sharedEntries",
      "support",
    ]);
  });

  it("free CTA routes anonymous users to /register", () => {
    const { result } = renderHook(() => usePlansScreenController());
    act(() => {
      result.current.handleSelectFreeTier();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/register");
  });

  it("free CTA routes authenticated users to /dashboard", () => {
    setSession(true);
    const { result } = renderHook(() => usePlansScreenController());
    act(() => {
      result.current.handleSelectFreeTier();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/dashboard");
  });

  it("premium CTA routes anonymous users to /register", () => {
    const { result } = renderHook(() => usePlansScreenController());
    act(() => {
      result.current.handleSelectPremiumTier();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/register");
  });

  it("premium CTA routes authenticated users to /assinatura", () => {
    setSession(true);
    const { result } = renderHook(() => usePlansScreenController());
    act(() => {
      result.current.handleSelectPremiumTier();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/assinatura");
  });

  it("returns empty tier list when API returns nothing", () => {
    setQueryState({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });
    const { result } = renderHook(() => usePlansScreenController());
    expect(result.current.tiers).toHaveLength(0);
  });

  it("reflects loading and error states from the query", () => {
    setQueryState({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    let hookResult = renderHook(() => usePlansScreenController()).result;
    expect(hookResult.current.isLoading).toBe(true);

    const apiError = new Error("offline");
    setQueryState({
      data: undefined,
      isLoading: false,
      isError: true,
      error: apiError as never,
    });
    hookResult = renderHook(() => usePlansScreenController()).result;
    expect(hookResult.current.isError).toBe(true);
    expect(hookResult.current.error).toBe(apiError);
  });
});
