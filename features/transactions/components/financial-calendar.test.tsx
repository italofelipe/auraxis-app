import { fireEvent, render } from "@testing-library/react-native";

import { FinancialCalendar } from "@/features/transactions/components/financial-calendar";
import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

const tx = (id: string, dueDate: string, type: "income" | "expense"): never =>
  ({ id, title: `tx-${id}`, amount: "10", type, dueDate, status: "paid" }) as never;

describe("FinancialCalendar", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  it("renders the current month title", () => {
    const monthLabel = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
    }).format(new Date());
    const { getByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} />
      </TestProviders>,
    );
    // Titles use Portuguese capitalised month names (Janeiro, Fevereiro, etc.).
    const expected = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    expect(getByText(new RegExp(expected))).toBeTruthy();
  });

  it("renders weekday header", () => {
    const { getByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} />
      </TestProviders>,
    );
    expect(getByText("Dom")).toBeTruthy();
    expect(getByText("Sex")).toBeTruthy();
  });

  it("steps to previous month on prev arrow press", () => {
    const { getByLabelText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} />
      </TestProviders>,
    );
    const prev = getByLabelText("Mês anterior");
    expect(prev).toBeTruthy();
    fireEvent.press(prev);
  });

  it("renders day cells without crashing for transactions list", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[tx("1", today, "income")]} />
      </TestProviders>,
    );
    expect(getAllByLabelText(today).length).toBeGreaterThan(0);
  });

  it("steps to next month on next arrow press", () => {
    const { getByLabelText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} />
      </TestProviders>,
    );
    fireEvent.press(getByLabelText("Próximo mês"));
  });

  it("opens day detail sheet when a day is tapped", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText, getByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[tx("1", today, "income")]} />
      </TestProviders>,
    );
    const dayCell = getAllByLabelText(today)[0]!;
    fireEvent.press(dayCell);
    expect(getByText("Movimentacoes do dia")).toBeTruthy();
  });

  it("renders empty state copy for a day without transactions", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText, getByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} />
      </TestProviders>,
    );
    const dayCell = getAllByLabelText(today)[0]!;
    fireEvent.press(dayCell);
    expect(getByText("Nenhuma movimentacao neste dia.")).toBeTruthy();
  });

  it("dismisses the day sheet on close", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText, getByText, queryByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} />
      </TestProviders>,
    );
    fireEvent.press(getAllByLabelText(today)[0]!);
    fireEvent.press(getByText("Fechar"));
    expect(queryByText("Nenhuma movimentacao neste dia.")).toBeNull();
  });
});
