import { render } from "@testing-library/react-native";
import type { UseQueryResult } from "@tanstack/react-query";

import WalletScreen from "@/app/(private)/carteira";
import { useWalletScreenController } from "@/features/wallet/hooks/use-wallet-screen-controller";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/features/wallet/hooks/use-wallet-screen-controller", () => ({
  useWalletScreenController: jest.fn(),
}));

const mockedUseWalletScreenController = jest.mocked(useWalletScreenController);

const buildQuery = <TData,>(
  overrides: Partial<UseQueryResult<TData, Error>>,
): UseQueryResult<TData, Error> =>
  ({
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    refetch: jest.fn(),
    status: "success",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    isEnabled: true,
    promise: Promise.resolve(undefined),
    ...overrides,
  }) as UseQueryResult<TData, Error>;

describe("WalletScreen", () => {
  afterEach(() => {
    mockedUseWalletScreenController.mockReset();
  });

  it("renderiza o resumo da carteira e os ativos da composicao canônica", () => {
    const entry = {
      id: "asset-1",
      name: "Tesouro Selic",
      value: 15000,
      estimatedValueOnCreateDate: null,
      ticker: null,
      quantity: null,
      assetClass: "fixed-income",
      annualRate: null,
      targetWithdrawDate: null,
      registerDate: "2026-01-01",
      shouldBeOnWallet: true,
    };
    mockedUseWalletScreenController.mockReturnValue({
      walletQuery: buildQuery({
        data: {
          total: 25000,
          items: [entry],
          returnedItems: 1,
          limit: 50,
          hasMore: false,
        },
      }) as ReturnType<typeof useWalletScreenController>["walletQuery"],
      total: 25000,
      liveTotal: null,
      assets: [
        {
          id: "asset-1",
          name: "Tesouro Selic",
          ticker: null,
          amount: 15000,
          liveAmount: null,
          liveChangePercent: null,
          allocation: 60,
          isQuoteLoading: false,
          hasQuoteError: false,
        },
      ],
      entries: [entry],
      formMode: { kind: "closed" },
      isSubmitting: false,
      submitError: null,
      deletingEntryId: null,
      liveQuotes: {
        byTicker: new Map(),
        liveTotal: null,
        hasAnyError: false,
        isFetching: false,
        refetch: jest.fn().mockResolvedValue(undefined),
      },
      isRefreshingQuotes: false,
      handleOpenCreate: jest.fn(),
      handleOpenEdit: jest.fn(),
      handleCloseForm: jest.fn(),
      handleSubmit: jest.fn().mockResolvedValue(undefined),
      handleDelete: jest.fn().mockResolvedValue(undefined),
      handleRefreshQuotes: jest.fn().mockResolvedValue(undefined),
      dismissSubmitError: jest.fn(),
    });

    const { getByText } = render(
      <TestProviders>
        <WalletScreen />
      </TestProviders>,
    );

    expect(getByText("Carteira")).toBeTruthy();
    expect(getByText("Tesouro Selic")).toBeTruthy();
  });
});
