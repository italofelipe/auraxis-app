import { act, renderHook } from "@testing-library/react-native";

import { useExpenseForm } from "@/features/credit-cards/hooks/use-expense-form";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

const mockMutateAsync = jest.fn<Promise<unknown>, [unknown]>();
const mockUpdateMutateAsync = jest.fn<Promise<unknown>, [unknown]>();

const buildTransaction = (
  override: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Mercado",
  amount: "120.50",
  type: "expense",
  dueDate: "2026-06-20",
  startDate: null,
  endDate: null,
  description: "Compra semanal",
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: "t-food",
  accountId: "ac-1",
  creditCardId: "cc-1",
  status: "pending",
  currency: "BRL",
  source: "manual",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: null,
  createdAt: null,
  updatedAt: null,
  ...override,
});

jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: () => ({
    data: {
      creditCards: [
        {
          id: "cc-1",
          name: "Inter",
          brand: "mastercard",
          limitAmount: 25000,
          closingDay: 5,
          dueDay: 10,
          lastFourDigits: "4000",
          bank: "Inter",
          description: null,
          benefits: [],
          validityDate: null,
          createdAt: null,
          updatedAt: null,
        },
      ],
    },
  }),
}));

jest.mock("@/features/tags/hooks/use-tags-query", () => ({
  useTagsQuery: () => ({
    data: { tags: [{ id: "t-food", name: "Alimentação", color: "#11A36B", icon: null }] },
  }),
}));

jest.mock("@/features/accounts/hooks/use-accounts-query", () => ({
  useAccountsQuery: () => ({
    data: {
      accounts: [
        {
          id: "ac-1",
          name: "Conta",
          accountType: "checking",
          institution: null,
          initialBalance: 0,
        },
      ],
    },
  }),
}));

jest.mock("@/features/transactions/hooks/use-transaction-mutations", () => ({
  useCreateTransactionMutation: () => ({
    mutateAsync: (command: unknown) => mockMutateAsync(command),
    isPending: false,
  }),
  useUpdateTransactionMutation: () => ({
    mutateAsync: (command: unknown) => mockUpdateMutateAsync(command),
    isPending: false,
  }),
}));

jest.mock("@/shared/feature-flags", () => ({
  isFeatureEnabled: () => true,
}));

beforeEach(() => {
  mockMutateAsync.mockReset();
  mockUpdateMutateAsync.mockReset();
  mockMutateAsync.mockResolvedValue(undefined);
  mockUpdateMutateAsync.mockResolvedValue(undefined);
});

const renderExpenseForm = (
  request?: Parameters<typeof useExpenseForm>[0],
) =>
  renderHook(() => useExpenseForm(request), {
    wrapper: createTestHookWrapper(),
  });

describe("useExpenseForm", () => {
  it("começa vazio e não pode submeter sem valor", () => {
    const { result } = renderExpenseForm();
    expect(result.current.amount).toBe(0);
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.creditCardId).toBeNull();
    expect(result.current.installmentsEnabled).toBe(true);
    expect(result.current.cards).toHaveLength(1);
    expect(result.current.tags).toHaveLength(1);
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.formMode).toBe("create");
    expect(result.current.description).toBe("");
  });

  it("habilita submit quando o valor é maior que zero", () => {
    const { result } = renderExpenseForm();
    act(() => result.current.setAmountText("120000")); // R$ 1.200,00 (POS)
    expect(result.current.amount).toBe(1200);
    expect(result.current.canSubmit).toBe(true);
  });

  it("monta a distribuição parcelada", () => {
    const { result } = renderExpenseForm();
    act(() => result.current.setAmountText("120000"));
    act(() => {
      result.current.selectCard("cc-1");
      result.current.setMode("parcelado");
      result.current.setInstallments(3);
    });
    expect(result.current.distribution).toHaveLength(3);
    expect(result.current.distribution.every((chip) => chip.value === 400)).toBe(true);
  });

  it("adiciona o chip de entrada quando há entrada", () => {
    const { result } = renderExpenseForm();
    act(() => result.current.setAmountText("120000"));
    act(() => {
      result.current.setMode("parcelado");
      result.current.setInstallments(3);
      result.current.toggleDownPayment(true);
      result.current.setDownPaymentText("30000"); // R$ 300,00
    });
    expect(result.current.distribution[0]?.isEntry).toBe(true);
    expect(result.current.distribution).toHaveLength(4);
  });

  it("preview da fatura: sem cartão pede definição; com cartão resolve o mês", () => {
    const { result } = renderExpenseForm();
    expect(result.current.faturaPreview.hasCard).toBe(false);
    act(() => result.current.selectCard("cc-1"));
    expect(result.current.faturaPreview.hasCard).toBe(true);
    expect(result.current.faturaPreview.billLabel).toMatch(/de \d{4}/);
    expect(result.current.faturaPreview.cardName).toBe("Inter");
  });

  it("submete uma única transação à vista", async () => {
    const { result } = renderExpenseForm();
    act(() => {
      result.current.setAmountText("50000"); // R$ 500
      result.current.setTitle("Mercado");
      result.current.setDescription("  compra do mês  ");
    });
    let outcome: { created: number; ok: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.submit();
    });
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ description: "compra do mês" }),
    );
    expect(outcome?.ok).toBe(true);
    expect(outcome?.created).toBe(1);
  });
});

describe("useExpenseForm — edição", () => {
  it("hidrata modo edição a partir da transação", () => {
    const transaction = buildTransaction({
      title: "Farmácia",
      amount: "89.90",
      dueDate: "2026-06-22",
      description: "Remédio",
      status: "paid",
    });

    const { result } = renderExpenseForm({ mode: "edit", transaction });

    expect(result.current.formMode).toBe("edit");
    expect(result.current.title).toBe("Farmácia");
    expect(result.current.amountText).toBe("89.90");
    expect(result.current.purchaseDate).toBe("2026-06-22");
    expect(result.current.creditCardId).toBe("cc-1");
    expect(result.current.tagId).toBe("t-food");
    expect(result.current.accountId).toBe("ac-1");
    expect(result.current.status).toBe("paid");
    expect(result.current.description).toBe("Remédio");
    expect(result.current.canSubmit).toBe(true);
  });

  it("salva edição usando update sem criar nova transação", async () => {
    const transaction = buildTransaction();
    const { result } = renderExpenseForm({ mode: "edit", transaction });

    act(() => {
      result.current.setTitle("Mercado atualizado");
      result.current.setAmountText("130.75");
      result.current.setDescription("  compra ajustada  ");
    });

    let outcome: { created: number; ok: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.submit();
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      transactionId: "tx-1",
      payload: expect.objectContaining({
        title: "Mercado atualizado",
        amount: "130.75",
        type: "expense",
        dueDate: "2026-06-20",
        description: "compra ajustada",
        creditCardId: "cc-1",
        tagId: "t-food",
        accountId: "ac-1",
        status: "pending",
      }),
    });
    expect(outcome).toEqual({ created: 0, ok: true, error: null });
  });

  it("submete duas transações quando há entrada (entrada + financiado)", async () => {
    const { result } = renderExpenseForm();
    act(() => {
      result.current.setAmountText("120000");
      result.current.setMode("parcelado");
      result.current.setInstallments(3);
      result.current.toggleDownPayment(true);
      result.current.setDownPaymentText("30000");
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(mockMutateAsync).toHaveBeenCalledTimes(2);
  });

  it("reporta falha parcial: entrada criada, financiado falha", async () => {
    mockMutateAsync
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("boom"));
    const { result } = renderExpenseForm();
    act(() => {
      result.current.setAmountText("120000");
      result.current.setMode("parcelado");
      result.current.setInstallments(3);
      result.current.toggleDownPayment(true);
      result.current.setDownPaymentText("30000");
    });
    let outcome: { created: number; ok: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.submit();
    });
    expect(outcome?.ok).toBe(false);
    expect(outcome?.created).toBe(1);
    expect(result.current.submitError).toBeInstanceOf(Error);
  });
});
