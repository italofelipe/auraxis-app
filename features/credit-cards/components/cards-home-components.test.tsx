import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { AllCardsCard } from "@/features/credit-cards/components/all-cards-card";
import { AnaliticoView } from "@/features/credit-cards/components/analitico-view";
import { CardCarousel } from "@/features/credit-cards/components/card-carousel";
import { CardFace } from "@/features/credit-cards/components/card-face";
import { CardsSegmented } from "@/features/credit-cards/components/cards-segmented";
import { FaturasView } from "@/features/credit-cards/components/faturas-view";
import { InvoiceSummaryCard } from "@/features/credit-cards/components/invoice-summary-card";
import { MonthChips } from "@/features/credit-cards/components/month-chips";
import { OndeFoiGasto } from "@/features/credit-cards/components/onde-foi-gasto";
import type { CreditCard } from "@/features/credit-cards/contracts";
import type { AnalyticsViewModel } from "@/features/credit-cards/model/credit-card-analytics";
import type { StatementViewModel } from "@/features/credit-cards/model/credit-card-statement";

const card: CreditCard = {
  id: "card-1",
  name: "Inter Mastercard",
  brand: "mastercard",
  limitAmount: 5000,
  closingDay: 10,
  dueDay: 17,
  lastFourDigits: "1234",
  bank: "Inter",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
};

const categories: StatementViewModel["categories"] = [
  {
    tagId: "t1",
    name: "Compras",
    color: "#9B5DE5",
    total: 3486.55,
    count: 2,
    items: [
      {
        id: "tx-1",
        title: "Renner",
        amount: 938.57,
        purchaseDate: "2026-06-25",
        tagId: "t1",
        creditCardId: "card-1",
        billMonth: "2026-06",
        isInstallment: false,
        installmentCount: null,
        installmentGroupId: null,
        status: "posted",
      },
    ],
  },
];

const faturas: StatementViewModel = {
  month: "2026-06",
  monthLabel: "junho de 2026",
  cardId: null,
  total: 8144.01,
  itemCount: 12,
  status: { label: "Aberta", tone: "open" },
  closingDate: "2026-06-30",
  dueDate: "2026-07-10",
  categories,
  monthlyTrend: [],
  utilizationPct: 42,
  limitAmount: 5000,
  railTotals: [{ cardId: "card-1", name: "Inter Mastercard", total: 8144.01 }],
  allCardsTotal: 8144.01,
};

const analitico: AnalyticsViewModel = {
  month: "2026-06",
  cardId: null,
  kpis: {
    billTotal: 8144.01,
    variation: { delta: 200, pct: 2.5 },
    topCategory: { name: "Compras", color: "#9B5DE5", total: 3486.55 },
    limitUsedPct: 42,
  },
  monthlySeries: {
    months: ["2026-05", "2026-06"],
    series: [{ cardId: "card-1", name: "Inter", values: [7900, 8144.01] }],
  },
  categories,
  cardTotals: [{ cardId: "card-1", name: "Inter Mastercard", total: 8144.01 }],
  topTransactions: [],
  topRows: [
    {
      id: "tx-1",
      title: "Renner",
      amount: 938.57,
      isInstallment: false,
      installmentCount: null,
      purchaseDate: "2026-06-25",
      categoryName: "Compras",
      categoryColor: "#9B5DE5",
      cardName: "Inter Mastercard",
    },
  ],
};

const wrap = (node: React.ReactElement) =>
  render(<TestProviders>{node}</TestProviders>);

describe("CardFace", () => {
  it("renderiza nome, final mascarado e dispara onPress", () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = wrap(
      <CardFace
        card={card}
        currentBillTotal={1234.5}
        usagePct={40}
        onPress={onPress}
        testID="face"
      />,
    );
    expect(getByText("Inter Mastercard")).toBeTruthy();
    expect(getByText("•••• 1234")).toBeTruthy();
    fireEvent.press(getByTestId("face"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("AllCardsCard", () => {
  it("renderiza título e contagem de cartões", () => {
    const { getByText } = wrap(
      <AllCardsCard total={8144.01} cardCount={3} selected />,
    );
    expect(getByText("Todos os cartões")).toBeTruthy();
    expect(getByText("3 cartões")).toBeTruthy();
  });
});

describe("CardCarousel", () => {
  it("renderiza o card agregado e seleciona ao tocar", () => {
    const onSelect = jest.fn();
    const { getByTestId } = wrap(
      <CardCarousel
        cards={[card]}
        selectedCardId={null}
        onSelectCard={onSelect}
        consolidatedTotal={8144.01}
        monthTotalsByCard={{ "card-1": 8144.01 }}
      />,
    );
    fireEvent.press(getByTestId("card-carousel-card-card-1"));
    expect(onSelect).toHaveBeenCalledWith("card-1");
  });
});

describe("CardsSegmented", () => {
  it("dispara onChange ao tocar em um segmento", () => {
    const onChange = jest.fn();
    const { getByTestId } = wrap(
      <CardsSegmented value="faturas" onChange={onChange} />,
    );
    fireEvent.press(getByTestId("cards-segmented-analitico"));
    expect(onChange).toHaveBeenCalledWith("analitico");
  });
});

describe("MonthChips", () => {
  it("dispara onSelect com o mês tocado", () => {
    const onSelect = jest.fn();
    const { getByTestId } = wrap(
      <MonthChips
        months={[
          { month: "2026-06", shortLabel: "jun", label: "junho de 2026", isCurrent: true },
        ]}
        selectedMonth="2026-06"
        onSelect={onSelect}
      />,
    );
    fireEvent.press(getByTestId("month-chip-2026-06"));
    expect(onSelect).toHaveBeenCalledWith("2026-06");
  });
});

describe("InvoiceSummaryCard", () => {
  it("mostra mês, status e vencimento, e abre ao tocar", () => {
    const onOpen = jest.fn();
    const { getByText, getByTestId } = wrap(
      <InvoiceSummaryCard
        eyebrow="Fatura consolidada"
        monthLabel="junho de 2026"
        total={8144.01}
        status={{ label: "Aberta", tone: "open" }}
        dueDate="2026-07-10"
        itemCount={12}
        onOpenInvoice={onOpen}
      />,
    );
    expect(getByText("Fatura de junho de 2026")).toBeTruthy();
    expect(getByText("Aberta")).toBeTruthy();
    expect(getByText(/vence dia 10/u)).toBeTruthy();
    fireEvent.press(getByTestId("invoice-summary-card"));
    expect(onOpen).toHaveBeenCalled();
  });
});

describe("OndeFoiGasto", () => {
  it("renderiza categorias", () => {
    const { getByText } = wrap(<OndeFoiGasto categories={categories} />);
    expect(getByText("Onde foi gasto")).toBeTruthy();
    expect(getByText("Compras")).toBeTruthy();
  });

  it("mostra aviso quando vazio", () => {
    const { getByText } = wrap(<OndeFoiGasto categories={[]} />);
    expect(getByText("Sem gastos categorizados neste mês.")).toBeTruthy();
  });
});

describe("FaturasView", () => {
  it("compõe resumo, categorias e itens", () => {
    const { getByText } = wrap(
      <FaturasView
        faturas={faturas}
        eyebrow="Fatura consolidada"
        onOpenInvoice={jest.fn()}
      />,
    );
    expect(getByText("Fatura de junho de 2026")).toBeTruthy();
    expect(getByText("Itens da fatura")).toBeTruthy();
    expect(getByText("Renner")).toBeTruthy();
  });
});

describe("AnaliticoView", () => {
  it("renderiza KPIs, gráficos e maiores lançamentos", () => {
    const { getByText } = wrap(
      <AnaliticoView analitico={analitico} monthShortLabel="jun" />,
    );
    expect(getByText("Fatura do mês")).toBeTruthy();
    expect(getByText("Gastos por categoria")).toBeTruthy();
    expect(getByText("Gastos por cartão")).toBeTruthy();
    expect(getByText("Maiores lançamentos")).toBeTruthy();
  });
});
