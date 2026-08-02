import { fireEvent, render } from "@testing-library/react-native";

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

const handleOpenCreate = jest.fn();

const buildController = (): TransactionsFeedController =>
  ({
    feedItems: [],
    handleOpenCreate,
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

describe("TransactionFeed — CTA de criar no estado vazio (#755)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsFeatureEnabled.mockReturnValue(false);
  });

  it("oferece criar transação e chama o controller", () => {
    const { getByText } = render(
      <AppProviders>
        <TransactionFeed controller={buildController()} />
      </AppProviders>,
    );

    fireEvent.press(getByText("Nova transação"));
    expect(handleOpenCreate).toHaveBeenCalledTimes(1);
  });

  it("não cita mais o botão central inexistente na tab bar", () => {
    const { queryByText, getByText } = render(
      <AppProviders>
        <TransactionFeed controller={buildController()} />
      </AppProviders>,
    );

    expect(queryByText(/botão central/i)).toBeNull();
    expect(
      getByText(
        "Toque em “Nova transação” para lançar um movimento ou troque o filtro para ver outros lançamentos.",
      ),
    ).toBeTruthy();
  });

  it("mantém criar como ação principal e o import como secundária", () => {
    mockedIsFeatureEnabled.mockImplementation(
      (key: string) => key === IMPORT_FEATURE_FLAG_KEY,
    );

    const { getByText } = render(
      <AppProviders>
        <TransactionFeed controller={buildController()} />
      </AppProviders>,
    );

    expect(getByText("Nova transação")).toBeTruthy();
    expect(getByText("Importar de uma planilha")).toBeTruthy();
  });
});
