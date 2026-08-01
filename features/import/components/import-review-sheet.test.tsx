import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { ImportFinishLaterModal } from "@/features/import/components/import-finish-later-modal";
import { ImportRejectedRowsNotice } from "@/features/import/components/import-rejected-rows-notice";
import { ImportReviewSheet } from "@/features/import/components/import-review-sheet";
import type { ImportTransactionDraft } from "@/features/import/contracts";
import type { ImportReviewCard } from "@/features/import/hooks/use-import-review";
import type { ImportScreenController } from "@/features/import/hooks/use-import-screen-controller";
import { initI18n } from "@/shared/i18n";

// Sem inicializar o i18n o `t()` devolve a chave, e o ponto destes testes e
// justamente travar os textos literais que o PO especificou.
beforeAll(async () => {
  await initI18n("pt");
});

const draft = (
  overrides: Partial<ImportTransactionDraft> = {},
): ImportTransactionDraft => ({
  id: "d1",
  date: "2026-05-01",
  description: "",
  amount: "25.50",
  type: "expense",
  category: "transporte",
  confidence: 0.9,
  isDuplicate: false,
  missingFields: ["description"],
  ...overrides,
});

const card = (overrides: Partial<ImportReviewCard> = {}): ImportReviewCard => ({
  draft: draft(),
  answers: {},
  isResolved: false,
  ...overrides,
});

const buildController = (
  overrides: Partial<ImportScreenController> = {},
): ImportScreenController =>
  ({
    phase: "review",
    file: null,
    detectResult: null,
    preview: null,
    currentMappingIndex: 0,
    currentMappingField: null,
    mappingFields: [],
    selectedImportCount: 1,
    totalPreviewCount: 1,
    duplicateCount: 0,
    rejectedRows: [],
    confirmationResult: null,
    error: null,
    isBusy: false,
    isFinishLaterOpen: false,
    review: {
      cards: [card()],
      currentIndex: 0,
      currentCard: card(),
      totalCount: 1,
      resolvedCount: 0,
      pendingCount: 1,
      isComplete: false,
      completions: {},
      answer: jest.fn(),
      goToNext: jest.fn(),
      goToPrevious: jest.fn(),
      reset: jest.fn(),
    },
    handlePickFile: jest.fn(),
    handleCancelMapping: jest.fn(),
    handlePreviousMappingField: jest.fn(),
    handleNextMappingField: jest.fn(),
    handleMappingChange: jest.fn(),
    handleConfirmMapping: jest.fn(),
    handleToggleTransaction: jest.fn(),
    handleConfirmImport: jest.fn(),
    handleCancelReview: jest.fn(),
    handleSubmitReview: jest.fn(),
    handleOpenFinishLater: jest.fn(),
    handleDismissFinishLater: jest.fn(),
    handleConfirmWithPlaceholders: jest.fn(),
    handleReset: jest.fn(),
    dismissError: jest.fn(),
    isTransactionSelected: jest.fn().mockReturnValue(true),
    ...overrides,
  }) as ImportScreenController;

const renderWithProviders = (ui: React.ReactElement): ReturnType<typeof render> =>
  render(<AppProviders>{ui}</AppProviders>);

describe("ImportReviewSheet", () => {
  it("mostra o titulo da especificacao, o contador e a explicacao do bloqueio", () => {
    const controller = buildController();
    const { getByTestId, getByText } = renderWithProviders(
      <ImportReviewSheet controller={controller} />,
    );

    expect(
      getByText(
        "Antes de prosseguir, precisamos conferir se as informações estão corretas",
      ),
    ).toBeTruthy();
    expect(getByTestId("import-review-progress")).toBeTruthy();
    // Bloqueio precisa de explicacao textual, nao so `disabled`.
    expect(getByTestId("import-review-blocked-hint")).toBeTruthy();
  });

  it("pergunta o titulo quando e o titulo que falta", () => {
    const controller = buildController();
    const { getByText } = renderWithProviders(
      <ImportReviewSheet controller={controller} />,
    );

    expect(getByText("Qual o título desta transação?")).toBeTruthy();
  });

  it("pergunta o valor quando e o valor que falta", () => {
    const amountCard = card({
      draft: draft({ description: "Farmacia", amount: "0", missingFields: ["amount"] }),
    });
    const controller = buildController({
      review: { ...buildController().review, cards: [amountCard], currentCard: amountCard },
    });
    const { getByText } = renderWithProviders(
      <ImportReviewSheet controller={controller} />,
    );

    expect(getByText("Qual o valor desta transação?")).toBeTruthy();
  });

  it("propaga a resposta digitada para o controller", () => {
    const controller = buildController();
    const { getByTestId } = renderWithProviders(
      <ImportReviewSheet controller={controller} />,
    );

    fireEvent.changeText(getByTestId("import-review-description-d1"), "Mercado");

    expect(controller.review.answer).toHaveBeenCalledWith("d1", "description", "Mercado");
  });

  it("libera a conclusao apenas quando nada mais falta", () => {
    const resolved = card({ isResolved: true, answers: { description: "Mercado" } });
    const controller = buildController({
      review: {
        ...buildController().review,
        cards: [resolved],
        currentCard: resolved,
        resolvedCount: 1,
        pendingCount: 0,
        isComplete: true,
      },
    });
    const { getByTestId, queryByTestId } = renderWithProviders(
      <ImportReviewSheet controller={controller} />,
    );

    expect(queryByTestId("import-review-blocked-hint")).toBeNull();

    fireEvent.press(getByTestId("import-review-submit"));

    expect(controller.handleSubmitReview).toHaveBeenCalled();
  });

  it("abre o segundo modal pelo terminar depois", () => {
    const controller = buildController();
    const { getByTestId } = renderWithProviders(
      <ImportReviewSheet controller={controller} />,
    );

    fireEvent.press(getByTestId("import-review-finish-later"));

    expect(controller.handleOpenFinishLater).toHaveBeenCalled();
  });
});

describe("ImportFinishLaterModal", () => {
  it("mostra o texto literal da especificacao e os dois desfechos", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId, getByText } = renderWithProviders(
      <ImportFinishLaterModal
        visible
        isBusy={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(
      getByText(
        "Caso queira terminar de cadastrar suas transações posteriormente nós vamos cadastrar os dados com informações genéricas que podem ser alteradas por você posteriormente",
      ),
    ).toBeTruthy();

    fireEvent.press(getByTestId("import-finish-later-confirm"));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.press(getByTestId("import-finish-later-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("ImportRejectedRowsNotice", () => {
  it("nao polui o caminho feliz", () => {
    const { queryByTestId } = renderWithProviders(<ImportRejectedRowsNotice rows={[]} />);

    expect(queryByTestId("import-rejected-rows")).toBeNull();
  });

  it("revela linha e motivo ao expandir", () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <ImportRejectedRowsNotice
        rows={[
          { lineNumber: 7, reason: "Data invalida" },
          { lineNumber: 12, reason: "Linha truncada" },
        ]}
      />,
    );

    expect(getByTestId("import-rejected-rows")).toBeTruthy();
    expect(queryByText("Data invalida")).toBeNull();

    fireEvent.press(getByTestId("import-rejected-rows-toggle"));

    expect(getByText("Data invalida")).toBeTruthy();
    expect(getByText("Linha truncada")).toBeTruthy();
  });
});
