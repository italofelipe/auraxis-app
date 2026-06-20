import type { CreditCard } from "@/features/credit-cards/contracts";
import {
  enrichCardTransactions,
  resolveCardCycleForMonth,
} from "@/features/credit-cards/model/card-transactions";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { transactionFixture } from "@/features/transactions/mocks";

/**
 * Monta um TransactionRecord completo com defaults para os testes.
 *
 * @param partial Campos a sobrescrever.
 * @returns TransactionRecord completo.
 */
const tx = (partial: Partial<TransactionRecord>): TransactionRecord => ({
  ...transactionFixture,
  id: "tx-1",
  title: "Compra",
  amount: "100.00",
  type: "expense",
  dueDate: "2026-06-02",
  isInstallment: false,
  installmentCount: null,
  tagId: null,
  accountId: null,
  creditCardId: "cc-1",
  status: "pending",
  installmentGroupId: null,
  ...partial,
});

/**
 * Monta um CreditCard completo com defaults para os testes.
 *
 * @param partial Campos a sobrescrever.
 * @returns CreditCard completo.
 */
const card = (partial: Partial<CreditCard>): CreditCard => ({
  id: "cc-1",
  name: "Nubank",
  brand: "mastercard",
  limitAmount: 5000,
  closingDay: 3,
  dueDay: 10,
  lastFourDigits: null,
  bank: "Nubank",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
  ...partial,
});

describe("enrichCardTransactions", () => {
  it("descarta transações sem cartão", () => {
    const result = enrichCardTransactions(
      [tx({ id: "a", creditCardId: null }), tx({ id: "b", creditCardId: "cc-1" })],
      [card({})],
    );
    expect(result.map((t) => t.id)).toEqual(["b"]);
  });

  it("coage o valor monetário (string) para number", () => {
    const result = enrichCardTransactions([tx({ amount: "199.90" })], [card({})]);
    expect(result[0]?.amount).toBe(199.9);
  });

  it("usa zero quando o valor é inválido", () => {
    const result = enrichCardTransactions([tx({ amount: "abc" })], [card({})]);
    expect(result[0]?.amount).toBe(0);
  });

  it("resolve o billMonth a partir do ciclo do cartão", () => {
    const result = enrichCardTransactions(
      [tx({ dueDate: "2026-06-02", creditCardId: "cc-1" })],
      [card({ id: "cc-1", closingDay: 3, dueDay: 10 })],
    );
    expect(result[0]?.billMonth).toBe("2026-06");
  });

  it("deixa billMonth null quando o cartão não tem ciclo configurado", () => {
    const result = enrichCardTransactions(
      [tx({ creditCardId: "cc-1" })],
      [card({ id: "cc-1", closingDay: null, dueDay: null })],
    );
    expect(result[0]?.billMonth).toBeNull();
  });

  it("deixa billMonth null quando o cartão da transação não está na lista", () => {
    const result = enrichCardTransactions(
      [tx({ creditCardId: "cc-ausente" })],
      [card({ id: "cc-1" })],
    );
    expect(result[0]?.billMonth).toBeNull();
  });

  it("mapeia os campos camelCase do contrato do app", () => {
    const result = enrichCardTransactions(
      [
        tx({
          id: "tx-9",
          title: "Mercado",
          dueDate: "2026-06-02",
          tagId: "t-food",
          creditCardId: "cc-1",
          isInstallment: true,
          installmentCount: 3,
          installmentGroupId: "grp-1",
          status: "pending",
        }),
      ],
      [card({ id: "cc-1" })],
    );
    expect(result[0]).toMatchObject({
      id: "tx-9",
      title: "Mercado",
      purchaseDate: "2026-06-02",
      tagId: "t-food",
      creditCardId: "cc-1",
      isInstallment: true,
      installmentCount: 3,
      installmentGroupId: "grp-1",
      status: "pending",
    });
  });
});

describe("resolveCardCycleForMonth", () => {
  it("retorna um ciclo cujo billMonth bate com o mês informado", () => {
    const cycle = resolveCardCycleForMonth({ closingDay: 3, dueDay: 10 }, "2026-06");
    expect(cycle?.billMonth).toBe("2026-06");
    expect(cycle?.dueDate).toBe("2026-06-10");
  });

  it("retorna null quando o cartão não tem ciclo", () => {
    expect(
      resolveCardCycleForMonth({ closingDay: null, dueDay: null }, "2026-06"),
    ).toBeNull();
  });

  it("clampa o dia de fechamento ao último dia em meses curtos", () => {
    const cycle = resolveCardCycleForMonth({ closingDay: 31, dueDay: 10 }, "2026-02");
    expect(cycle?.billMonth).toBe("2026-02");
    expect(cycle?.closingDate).toBe("2026-02-28");
  });
});
