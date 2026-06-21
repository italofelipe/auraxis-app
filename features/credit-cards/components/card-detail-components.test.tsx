import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { CardAppBar } from "@/features/credit-cards/components/card-app-bar";
import { CardEvolution } from "@/features/credit-cards/components/card-evolution";
import { CardLimitBlock } from "@/features/credit-cards/components/card-limit-block";
import {
  CardQuickActions,
  type CardQuickAction,
} from "@/features/credit-cards/components/card-quick-actions";
import { CardRecentTransactions } from "@/features/credit-cards/components/card-recent-transactions";
import { CardStickyCta } from "@/features/credit-cards/components/card-sticky-cta";
import { CardTopCategories } from "@/features/credit-cards/components/card-top-categories";
import { InvoiceGroupedItems } from "@/features/credit-cards/components/invoice-grouped-items";
import { InvoiceHero } from "@/features/credit-cards/components/invoice-hero";
import type { CategoryGroup } from "@/features/credit-cards/model/credit-card-aggregation";
import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import { resolveCardGradient } from "@/shared/theme";

const wrap = (node: React.ReactElement) =>
  render(<TestProviders>{node}</TestProviders>);

const gradient = resolveCardGradient({ id: "card-1", bank: "Inter", name: "Inter" });

const tx = (overrides: Partial<EnrichedTransaction> = {}): EnrichedTransaction => ({
  id: "tx-1",
  title: "Renner",
  amount: 938.57,
  purchaseDate: "2026-06-25",
  tagId: "tag-compras",
  creditCardId: "card-1",
  billMonth: "2026-06",
  isInstallment: false,
  installmentCount: null,
  installmentGroupId: null,
  status: "paid",
  ...overrides,
});

const category: CategoryGroup = {
  tagId: "tag-compras",
  name: "Compras",
  color: "#9B5DE5",
  total: 1311.64,
  count: 2,
  items: [tx(), tx({ id: "tx-2", title: "Apple", amount: 373.07 })],
};

describe("CardAppBar", () => {
  it("renderiza titulo, subtitulo e dispara voltar", () => {
    const onBack = jest.fn();
    const { getByText, getByTestId } = wrap(
      <CardAppBar title="Inter padrão" subtitle="Inter · mastercard" onBack={onBack} />,
    );
    expect(getByText("Inter padrão")).toBeTruthy();
    expect(getByText("Inter · mastercard")).toBeTruthy();
    fireEvent.press(getByTestId("card-app-bar-back"));
    expect(onBack).toHaveBeenCalled();
  });
});

describe("CardQuickActions", () => {
  it("renderiza acoes e dispara o handler ao tocar", () => {
    const onPress = jest.fn();
    const actions: readonly CardQuickAction[] = [
      { key: "launch", icon: "credit-card-plus-outline", label: "Lançar", onPress },
    ];
    const { getByTestId, getByText } = wrap(<CardQuickActions actions={actions} />);
    expect(getByText("Lançar")).toBeTruthy();
    fireEvent.press(getByTestId("card-quick-action-launch"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("CardLimitBlock", () => {
  it("renderiza as tres linhas do limite", () => {
    const { getByText } = wrap(
      <CardLimitBlock
        limit={{
          usedPct: 33,
          limitAmount: 25000,
          availableAmount: 16855.99,
          currentBillTotal: 8144.01,
          tone: "primary",
        }}
      />,
    );
    expect(getByText("Limite total")).toBeTruthy();
    expect(getByText("Disponível")).toBeTruthy();
    expect(getByText("Fatura atual")).toBeTruthy();
    expect(getByText("33%")).toBeTruthy();
  });

  it("mostra travessao quando faltam valores de limite", () => {
    const { getByText } = wrap(
      <CardLimitBlock
        limit={{
          usedPct: 0,
          limitAmount: null,
          availableAmount: null,
          currentBillTotal: 0,
          tone: "primary",
        }}
      />,
    );
    expect(getByText("0%")).toBeTruthy();
  });
});

describe("CardEvolution", () => {
  it("renderiza o grafico quando ha dados", () => {
    const { getByText } = wrap(
      <CardEvolution
        points={[
          { label: "Mai", value: 100 },
          { label: "Jun", value: 8144.01 },
        ]}
        color={gradient.colors[0]}
      />,
    );
    expect(getByText("Evolução da fatura")).toBeTruthy();
    expect(getByText("2 meses")).toBeTruthy();
  });

  it("nao renderiza nada sem dados", () => {
    const { toJSON } = wrap(
      <CardEvolution
        points={[
          { label: "Mai", value: 0 },
          { label: "Jun", value: 0 },
        ]}
        color={gradient.colors[0]}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});

describe("CardTopCategories", () => {
  it("renderiza categorias", () => {
    const { getByText } = wrap(<CardTopCategories categories={[category]} />);
    expect(getByText("Top categorias")).toBeTruthy();
    expect(getByText("Compras")).toBeTruthy();
  });

  it("mostra aviso quando vazio", () => {
    const { getByText } = wrap(<CardTopCategories categories={[]} />);
    expect(getByText("Sem gastos categorizados neste mês.")).toBeTruthy();
  });
});

describe("CardRecentTransactions", () => {
  it("renderiza itens e dispara ver fatura", () => {
    const onSee = jest.fn();
    const { getByText, getByTestId } = wrap(
      <CardRecentTransactions transactions={[tx()]} onSeeInvoice={onSee} />,
    );
    expect(getByText("Lançamentos recentes")).toBeTruthy();
    expect(getByText("Renner")).toBeTruthy();
    fireEvent.press(getByTestId("card-recent-see-invoice"));
    expect(onSee).toHaveBeenCalled();
  });

  it("mostra aviso quando vazio", () => {
    const { getByText } = wrap(
      <CardRecentTransactions transactions={[]} onSeeInvoice={jest.fn()} />,
    );
    expect(getByText("Sem lançamentos neste mês.")).toBeTruthy();
  });
});

describe("CardStickyCta", () => {
  it("renderiza o rotulo e dispara o handler", () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = wrap(
      <CardStickyCta label="Ver fatura completa" onPress={onPress} testID="cta" />,
    );
    expect(getByText("Ver fatura completa")).toBeTruthy();
    fireEvent.press(getByTestId("cta"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("InvoiceHero", () => {
  it("renderiza mes, total, status e navega", () => {
    const onPrev = jest.fn();
    const onNext = jest.fn();
    const { getByText, getByTestId } = wrap(
      <InvoiceHero
        gradient={gradient}
        monthLabel="junho de 2026"
        total={8144.01}
        status={{ label: "Aberta", tone: "open" }}
        dueDateLabel="10/07"
        onPreviousMonth={onPrev}
        onNextMonth={onNext}
      />,
    );
    expect(getByText("junho de 2026")).toBeTruthy();
    expect(getByText("Aberta")).toBeTruthy();
    expect(getByText(/vence dia 10\/07/u)).toBeTruthy();
    fireEvent.press(getByTestId("invoice-hero-prev"));
    fireEvent.press(getByTestId("invoice-hero-next"));
    expect(onPrev).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });
});

describe("InvoiceGroupedItems", () => {
  it("renderiza cabecalho de categoria e itens", () => {
    const { getByText } = wrap(<InvoiceGroupedItems groups={[category]} />);
    expect(getByText("Itens da fatura")).toBeTruthy();
    expect(getByText("Compras")).toBeTruthy();
    expect(getByText("Renner")).toBeTruthy();
    expect(getByText("Apple")).toBeTruthy();
  });

  it("mostra aviso quando vazio", () => {
    const { getByText } = wrap(<InvoiceGroupedItems groups={[]} />);
    expect(getByText("Sem lançamentos nesta fatura.")).toBeTruthy();
  });
});
