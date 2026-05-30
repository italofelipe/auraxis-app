import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { AppProviders } from "@/core/providers/app-providers";

jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: jest.fn(),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: jest.fn(),
}));

const mockedUseCreditCardsQuery = jest.mocked(useCreditCardsQuery);
const mockedIsFeatureEnabled = jest.mocked(isFeatureEnabled);

const renderForm = (onSubmit = jest.fn()) => {
  const rendered = render(
    <AppProviders>
      <TransactionForm
        isSubmitting={false}
        submitError={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        onDismissError={jest.fn()}
      />
    </AppProviders>,
  );
  return { ...rendered, onSubmit };
};

describe("TransactionForm installments", () => {
  beforeEach(() => {
    mockedIsFeatureEnabled.mockReturnValue(true);
    mockedUseCreditCardsQuery.mockReturnValue({
      data: {
        creditCards: [
          {
            id: "018f3a22-6ec3-7dc2-a93a-1bbdecb02000",
            name: "Nubank",
            brand: "mastercard",
            limitAmount: 5000,
            closingDay: 20,
            dueDay: 27,
            lastFourDigits: "1234",
            bank: "Nubank",
            description: null,
            benefits: [],
            validityDate: null,
            createdAt: null,
            updatedAt: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
  });

  it("exibe cartoes apenas para despesa quando flag esta habilitada", () => {
    const { getByText, queryByText } = renderForm();

    expect(getByText("Nubank final 1234")).toBeTruthy();

    fireEvent.press(getByText("Receita"));

    expect(queryByText("Nubank final 1234")).toBeNull();
  });

  it("habilita parcelamento apos selecionar cartao e submete os campos novos", async () => {
    const { getByText, getByLabelText, onSubmit } = renderForm();

    fireEvent.changeText(getByLabelText("Titulo"), "Notebook");
    // Cents-first entry: digits shift in from the right, so R$ 1.200,00 is
    // typed as "120000" (12000 cents → 1200,00).
    fireEvent.changeText(getByLabelText("Valor (R$)"), "120000");
    fireEvent.changeText(getByLabelText("Data"), "2026-05-17");
    fireEvent.press(getByText("Nubank final 1234"));
    fireEvent(getByLabelText("Compra parcelada"), "onCheckedChange", true);
    fireEvent.changeText(getByLabelText("Quantidade de parcelas"), "12");
    fireEvent.press(getByText("Criar transacao"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Notebook",
          creditCardId: "018f3a22-6ec3-7dc2-a93a-1bbdecb02000",
          isInstallment: true,
          installmentCount: 12,
        }),
      );
    });
    expect(getByText("12x de R$ 100,00")).toBeTruthy();
  });

  it("revela campos de recorrencia e submete cadencia ao ativar o toggle", async () => {
    const { getByText, getByLabelText, queryByLabelText, onSubmit } = renderForm();

    // Sub-fields hidden until recurring is enabled.
    expect(queryByLabelText("Inicio")).toBeNull();

    fireEvent.changeText(getByLabelText("Titulo"), "Aluguel");
    fireEvent.changeText(getByLabelText("Valor (R$)"), "120000");
    fireEvent.changeText(getByLabelText("Data"), "2026-05-05");
    fireEvent(getByLabelText("Transacao recorrente"), "onCheckedChange", true);

    fireEvent.press(getByText("Semana"));
    fireEvent.changeText(getByLabelText("A cada (intervalo)"), "2");
    fireEvent.changeText(getByLabelText("Inicio"), "2026-05-05");
    fireEvent.changeText(getByLabelText("Fim"), "2026-08-05");
    fireEvent.press(getByText("Criar transacao"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          isRecurring: true,
          recurrenceUnit: "week",
          recurrenceInterval: 2,
          startDate: "2026-05-05",
          endDate: "2026-08-05",
        }),
      );
    });
  });

  it("nao renderiza selecao de cartao quando flag de parcelamento esta desligada", () => {
    mockedIsFeatureEnabled.mockReturnValue(false);

    const { queryByText } = renderForm();

    expect(queryByText("Nubank final 1234")).toBeNull();
  });
});
