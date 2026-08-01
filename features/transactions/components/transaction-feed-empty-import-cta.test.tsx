import { render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { IMPORT_FEATURE_FLAG_KEY } from "@/features/import/import-config";
import { TransactionFeed } from "@/features/transactions/components/transaction-feed-list";
import type { TransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { initI18n } from "@/shared/i18n";

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

beforeAll(async () => {
  await initI18n("pt");
});

const buildController = (): TransactionsFeedController =>
  ({
    feedItems: [],
    viewMode: "facil",
    setViewMode: jest.fn(),
    periodLabel: "Julho de 2026",
    goToPreviousMonth: jest.fn(),
    goToNextMonth: jest.fn(),
    hasActiveFilters: false,
    categoryBars: [],
    payingTransactionId: null,
    duplicatingTransactionId: null,
    deletingTransactionId: null,
    handleMarkPaid: jest.fn(),
    handleDelete: jest.fn(),
    transactionsQuery: {
      isLoading: false,
      isError: false,
      data: { transactions: [] },
    },
  }) as unknown as TransactionsFeedController;

describe("TransactionFeed — CTA de import no estado vazio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("oferece o import quando a flag esta ligada", () => {
    mockedIsFeatureEnabled.mockImplementation(
      (key: string) => key === IMPORT_FEATURE_FLAG_KEY,
    );

    const { getByText } = render(
      <AppProviders>
        <TransactionFeed controller={buildController()} />
      </AppProviders>,
    );

    // Feed vazio e onde esta quem tem o historico so na planilha (#749).
    expect(getByText("Importar de uma planilha")).toBeTruthy();
  });

  it("nao oferece o import com a flag desligada", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);

    const { queryByText } = render(
      <AppProviders>
        <TransactionFeed controller={buildController()} />
      </AppProviders>,
    );

    expect(queryByText("Importar de uma planilha")).toBeNull();
  });
});
