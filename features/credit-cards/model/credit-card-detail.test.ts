import type {
  CreditCard,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import type { Tag } from "@/features/tags/contracts";

import type { EnrichedTransaction } from "./card-transactions";
import {
  buildCreditCardDetailViewModel,
  type CreditCardDetailParams,
} from "./credit-card-detail";

const card: CreditCard = {
  id: "cc-1",
  name: "Inter padrão",
  brand: "mastercard",
  limitAmount: 25000,
  closingDay: 28,
  dueDay: 10,
  lastFourDigits: "4000",
  bank: "Inter",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
};

const tags: readonly Tag[] = [
  { id: "tag-compras", name: "Compras", color: "#9B5DE5", icon: null },
  { id: "tag-viagem", name: "Viagem", color: "#00BBF9", icon: null },
];

const buildTx = (
  overrides: Partial<EnrichedTransaction> = {},
): EnrichedTransaction => ({
  id: "tx-1",
  title: "Renner",
  amount: 100,
  purchaseDate: "2026-06-25",
  tagId: "tag-compras",
  creditCardId: "cc-1",
  billMonth: "2026-06",
  isInstallment: false,
  installmentCount: null,
  installmentGroupId: null,
  status: "paid",
  ...overrides,
});

const baseParams = (
  overrides: Partial<CreditCardDetailParams> = {},
): CreditCardDetailParams => ({
  card,
  transactions: [
    buildTx(),
    buildTx({ id: "tx-2", title: "Apple", amount: 50, purchaseDate: "2026-06-10" }),
    buildTx({
      id: "tx-3",
      title: "Latam",
      amount: 200,
      tagId: "tag-viagem",
      purchaseDate: "2026-06-16",
    }),
    buildTx({ id: "tx-old", amount: 999, billMonth: "2026-05" }),
  ],
  tags,
  utilization: null,
  month: "2026-06",
  windowMonths: 7,
  ...overrides,
});

const buildUtilization = (
  overrides: Partial<CreditCardUtilizationRecord> = {},
): CreditCardUtilizationRecord => ({
  cycle: {
    startDate: "2026-05-29",
    endDate: "2026-06-28",
    dueDate: "2026-07-10",
    status: "open",
  },
  committedAmount: 8144.01,
  availableAmount: 16855.99,
  limitAmount: 25000,
  utilizationPct: 33,
  ...overrides,
});

describe("buildCreditCardDetailViewModel — subtítulo", () => {
  it("junta emissor e bandeira", () => {
    expect(buildCreditCardDetailViewModel(baseParams()).subtitle).toBe(
      "Inter · mastercard",
    );
  });

  it("usa só a parte presente", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({ card: { ...card, brand: null } }),
    );
    expect(vm.subtitle).toBe("Inter");
  });

  it("cai para o rótulo genérico quando faltam ambos", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({ card: { ...card, brand: null, bank: null } }),
    );
    expect(vm.subtitle).toBe("Cartão de crédito");
  });
});

describe("buildCreditCardDetailViewModel — bloco de limite", () => {
  it("prefere os números oficiais de utilização", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({ utilization: buildUtilization() }),
    );
    expect(vm.limit.usedPct).toBe(33);
    expect(vm.limit.limitAmount).toBe(25000);
    expect(vm.limit.availableAmount).toBe(16855.99);
    expect(vm.limit.currentBillTotal).toBe(8144.01);
    expect(vm.currentBillTotal).toBe(8144.01);
  });

  it("deriva das transações quando não há utilização", () => {
    const vm = buildCreditCardDetailViewModel(baseParams());
    // 100 + 50 + 200 = 350 caem em junho.
    expect(vm.limit.currentBillTotal).toBe(350);
    expect(vm.limit.availableAmount).toBe(24650);
    expect(vm.limit.usedPct).toBeCloseTo((350 / 25000) * 100, 5);
  });

  it("deriva o uso quando o percentual oficial é nulo mas há limite", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({
        utilization: buildUtilization({
          utilizationPct: null,
          committedAmount: 5000,
          availableAmount: null,
        }),
      }),
    );
    expect(vm.limit.usedPct).toBeCloseTo((5000 / 25000) * 100, 5);
    expect(vm.limit.availableAmount).toBe(20000);
  });

  it("zera o uso quando não há limite", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({ card: { ...card, limitAmount: null } }),
    );
    expect(vm.limit.usedPct).toBe(0);
    expect(vm.limit.limitAmount).toBeNull();
    expect(vm.limit.availableAmount).toBeNull();
  });

  it("marca tom de perigo acima do limiar", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({ utilization: buildUtilization({ utilizationPct: 90 }) }),
    );
    expect(vm.limit.tone).toBe("danger");
  });

  it("mantém tom primário abaixo do limiar", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({ utilization: buildUtilization({ utilizationPct: 33 }) }),
    );
    expect(vm.limit.tone).toBe("primary");
  });

  it("clampa percentuais oficiais fora de [0,100]", () => {
    const vm = buildCreditCardDetailViewModel(
      baseParams({ utilization: buildUtilization({ utilizationPct: 140 }) }),
    );
    expect(vm.limit.usedPct).toBe(100);
  });
});

describe("buildCreditCardDetailViewModel — séries e listas", () => {
  it("monta a série de evolução com a janela pedida", () => {
    const vm = buildCreditCardDetailViewModel(baseParams({ windowMonths: 7 }));
    expect(vm.evolution).toHaveLength(7);
    expect(vm.evolution.at(-1)?.value).toBe(350); // junho
    expect(vm.evolution.at(-2)?.value).toBe(999); // maio
  });

  it("usa janela default de 7 meses", () => {
    const params = baseParams();
    delete (params as { windowMonths?: number }).windowMonths;
    const vm = buildCreditCardDetailViewModel(params);
    expect(vm.evolution).toHaveLength(7);
  });

  it("ordena categorias por total desc", () => {
    const vm = buildCreditCardDetailViewModel(baseParams());
    expect(vm.topCategories[0]?.name).toBe("Viagem"); // 200
    expect(vm.topCategories[1]?.name).toBe("Compras"); // 150
  });

  it("ordena lançamentos recentes do mais novo ao mais antigo", () => {
    const vm = buildCreditCardDetailViewModel(baseParams());
    expect(vm.recentTransactions.map((tx) => tx.id)).toEqual([
      "tx-1",
      "tx-3",
      "tx-2",
    ]);
  });

  it("resolve o gradiente da marca", () => {
    const vm = buildCreditCardDetailViewModel(baseParams());
    expect(vm.gradient.colors).toHaveLength(2);
  });
});
