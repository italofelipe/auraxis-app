/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { TxCard } from "@/features/transactions/components/tx-card";
import { TxCategoryBreakdown } from "@/features/transactions/components/tx-category-breakdown";
import { TxHero } from "@/features/transactions/components/tx-hero";
import { TxModeToggle } from "@/features/transactions/components/tx-mode-toggle";
import {
  TxCategoryChip,
  TxInvoiceChip,
  TxStatusChip,
} from "@/features/transactions/components/tx-chips";
import type { CategoryBar, TransactionFeedItem } from "@/features/transactions/model/transactions-feed";
import { initI18n } from "@/shared/i18n";

// Mocka o ReanimatedSwipeable: renderiza as right actions + os children, para
// exercitar tap/Pagar/Excluir sem o wrapper nativo (mesmo padrão do row).
jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const ReactInner = require("react");
  const { View } = require("react-native");
  const Swipeable = ({
    children,
    renderRightActions,
  }: {
    readonly children: React.ReactNode;
    readonly renderRightActions?: (
      progress: unknown,
      translation: unknown,
      methods: { close: () => void },
    ) => React.ReactNode;
  }): React.ReactNode =>
    ReactInner.createElement(
      View,
      null,
      renderRightActions
        ? renderRightActions({ value: 0 }, { value: 0 }, { close: () => undefined })
        : null,
      children,
    );
  return { __esModule: true, default: Swipeable };
});

const wrap = (node: React.ReactElement) =>
  render(<TestProviders>{node}</TestProviders>);

const kpis = { income: 27675.37, expense: 19906.3, result: 7769.07, count: 10 };

const item: TransactionFeedItem = {
  id: "tx-1",
  title: "Impostos",
  description: "Impostos do salário gringo",
  amount: 2000,
  type: "expense",
  status: "pending",
  isRecurring: true,
  isInstallment: false,
  categoryName: "Impostos",
  categoryColor: "#E5484D",
  categoryIcon: "tax",
  relativeDate: "em 9 dias",
  dateDisplay: "em 9 dias",
  signedDisplay: "− R$ 2.000,00",
  percentOfFlow: 10,
  invoiceBadgeMonth: "jul/26",
};

const incomeItem: TransactionFeedItem = {
  ...item,
  id: "tx-2",
  title: "Salário gringo",
  type: "income",
  status: "paid",
  signedDisplay: "+ R$ 27.675,37",
  categoryColor: "#11A36B",
  percentOfFlow: 100,
  invoiceBadgeMonth: null,
};

const bars: readonly CategoryBar[] = [
  { tagId: "t1", name: "Cartão", color: "#FF8A3D", total: 11000 },
  { tagId: "t2", name: "Financiamento", color: "#0E6376", total: 2650 },
];

beforeAll(async () => {
  await initI18n("pt");
});

describe("TxHero", () => {
  it("mostra título, período + contagem e o resultado", () => {
    const { getByText, getByTestId } = wrap(
      <TxHero
        periodLabel="Junho de 2026"
        kpis={kpis}
        isDark={false}
        onToggleTheme={jest.fn()}
        onToggleCalendar={jest.fn()}
        calendarActive={false}
      />,
    );
    expect(getByText("Transações")).toBeTruthy();
    expect(getByText("Junho de 2026 · 10 lançamentos")).toBeTruthy();
    expect(getByTestId("tx-hero-result")).toBeTruthy();
  });

  it("dispara os toggles de tema e calendário", () => {
    const onToggleTheme = jest.fn();
    const onToggleCalendar = jest.fn();
    const { getByTestId } = wrap(
      <TxHero
        periodLabel="Junho de 2026"
        kpis={kpis}
        isDark={false}
        onToggleTheme={onToggleTheme}
        onToggleCalendar={onToggleCalendar}
        calendarActive={false}
      />,
    );
    fireEvent.press(getByTestId("tx-hero-theme-toggle"));
    fireEvent.press(getByTestId("tx-hero-calendar-toggle"));
    expect(onToggleTheme).toHaveBeenCalled();
    expect(onToggleCalendar).toHaveBeenCalled();
  });
});

describe("TxModeToggle", () => {
  it("dispara onChange ao tocar em Analítico", () => {
    const onChange = jest.fn();
    const { getByTestId } = wrap(
      <TxModeToggle value="facil" onChange={onChange} />,
    );
    fireEvent.press(getByTestId("tx-mode-toggle-analitico"));
    expect(onChange).toHaveBeenCalledWith("analitico");
  });
});

describe("TxCard", () => {
  it("renderiza título, valor e abre ações ao tocar", () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = wrap(
      <TxCard
        item={item}
        analytic={false}
        onPress={onPress}
        onMarkPaid={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText("Impostos")).toBeTruthy();
    expect(getByText("− R$ 2.000,00")).toBeTruthy();
    fireEvent.press(getByTestId("tx-card-tx-1"));
    expect(onPress).toHaveBeenCalledWith("tx-1");
  });

  it("no modo Analítico mostra categoria e % do gasto", () => {
    const { getByText } = wrap(
      <TxCard
        item={item}
        analytic
        onPress={jest.fn()}
        onMarkPaid={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText("Recorrente")).toBeTruthy();
    expect(getByText("10% do gasto")).toBeTruthy();
  });

  it("receita paga mostra 'Recebido' e % do total", () => {
    const { getByText } = wrap(
      <TxCard
        item={incomeItem}
        analytic
        onPress={jest.fn()}
        onMarkPaid={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText("Recebido")).toBeTruthy();
    expect(getByText("100% do total")).toBeTruthy();
  });

  it("mostra o selo de fatura quando o lançamento de cartão veio de outro mês", () => {
    const { getByText } = wrap(
      <TxCard
        item={item}
        analytic={false}
        onPress={jest.fn()}
        onMarkPaid={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(getByText("fatura jul/26")).toBeTruthy();
  });

  it("não mostra o selo de fatura quando invoiceBadgeMonth é null", () => {
    const { queryByTestId } = wrap(
      <TxCard
        item={incomeItem}
        analytic={false}
        onPress={jest.fn()}
        onMarkPaid={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(queryByTestId("tx-invoice-chip")).toBeNull();
  });
});

describe("TxCategoryBreakdown", () => {
  it("renderiza o título e as categorias", () => {
    const { getByText } = wrap(<TxCategoryBreakdown categories={bars} />);
    expect(getByText("Gastos por categoria")).toBeTruthy();
    expect(getByText("Cartão")).toBeTruthy();
  });

  it("mostra aviso quando não há categorias", () => {
    const { getByText } = wrap(<TxCategoryBreakdown categories={[]} />);
    expect(getByText("Sem gastos categorizados neste mês.")).toBeTruthy();
  });
});

describe("tx-chips", () => {
  it("TxStatusChip mostra o rótulo do status", () => {
    const { getByText } = wrap(<TxStatusChip status="overdue" type="expense" />);
    expect(getByText("Vencido")).toBeTruthy();
  });

  it("TxCategoryChip renderiza sem erro", () => {
    const { toJSON } = wrap(
      <TxCategoryChip color="#E5484D" icon="tax" name="Impostos" />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("TxInvoiceChip compõe o rótulo 'fatura {mmm/aa}' via i18n", () => {
    const { getByText, getByTestId } = wrap(<TxInvoiceChip month="jul/26" />);
    expect(getByTestId("tx-invoice-chip")).toBeTruthy();
    expect(getByText("fatura jul/26")).toBeTruthy();
  });
});
