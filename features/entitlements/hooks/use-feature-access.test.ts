import { renderHook } from "@testing-library/react-native";

import { useFeatureAccess } from "./use-feature-access";
import { useEntitlementCheckQuery } from "@/features/entitlements/hooks/use-entitlement-check-query";

jest.mock("@/features/entitlements/hooks/use-entitlement-check-query", () => ({
  useEntitlementCheckQuery: jest.fn(),
}));

const mockedUseEntitlementCheckQuery = jest.mocked(useEntitlementCheckQuery);

describe("useFeatureAccess", () => {
  beforeEach(() => {
    mockedUseEntitlementCheckQuery.mockReset();
  });

  it("normaliza o resultado da query de entitlement", () => {
    mockedUseEntitlementCheckQuery.mockReturnValue({
      data: true,
      isPending: false,
    } as ReturnType<typeof useEntitlementCheckQuery>);

    const { result } = renderHook(() => useFeatureAccess("wallet_read"));

    expect(mockedUseEntitlementCheckQuery).toHaveBeenCalledWith("wallet_read", true);
    expect(result.current).toEqual({
      hasAccess: true,
      isLoading: false,
    });
  });

  it("permite desabilitar o check enquanto o runtime ainda nao esta pronto", () => {
    mockedUseEntitlementCheckQuery.mockReturnValue({
      data: undefined,
      isPending: true,
    } as ReturnType<typeof useEntitlementCheckQuery>);

    const { result } = renderHook(() => useFeatureAccess("wallet_read", false));

    expect(mockedUseEntitlementCheckQuery).toHaveBeenCalledWith("wallet_read", false);
    expect(result.current).toEqual({
      hasAccess: false,
      isLoading: true,
    });
  });
});
