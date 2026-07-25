import { fireEvent, render } from "@testing-library/react-native";

import { FinancialCalendar } from "@/features/transactions/components/financial-calendar";
import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

const tx = (id: string, dueDate: string, type: "income" | "expense"): never =>
  ({ id, title: `tx-${id}`, amount: "10", type, dueDate, status: "paid" }) as never;

const currentPage = (): { readonly year: number; readonly month: number } => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

describe("FinancialCalendar", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  it("does not render an internal duplicated month header", () => {
    const { queryByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} {...currentPage()} />
      </TestProviders>,
    );
    expect(queryByText(/de 2026/)).toBeNull();
  });

  it("renders weekday header", () => {
    const { getByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} {...currentPage()} />
      </TestProviders>,
    );
    expect(getByText("Dom")).toBeTruthy();
    expect(getByText("Sex")).toBeTruthy();
  });

  it("renders day cells without crashing for transactions list", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText } = render(
      <TestProviders>
        <FinancialCalendar
          transactions={[tx("1", today, "income")]}
          {...currentPage()}
        />
      </TestProviders>,
    );
    expect(getAllByLabelText(today).length).toBeGreaterThan(0);
  });

  it("opens day detail sheet when a day is tapped", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText, getByText } = render(
      <TestProviders>
        <FinancialCalendar
          transactions={[tx("1", today, "income")]}
          {...currentPage()}
        />
      </TestProviders>,
    );
    const dayCell = getAllByLabelText(today)[0]!;
    fireEvent.press(dayCell);
    expect(getByText("Movimentações do dia")).toBeTruthy();
    expect(getByText("Recebido")).toBeTruthy();
  });

  it("renders empty state copy for a day without transactions", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText, getByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} {...currentPage()} />
      </TestProviders>,
    );
    const dayCell = getAllByLabelText(today)[0]!;
    fireEvent.press(dayCell);
    expect(getByText("Nenhuma movimentação neste dia.")).toBeTruthy();
  });

  it("dismisses the day sheet on close", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { getAllByLabelText, getByLabelText, queryByText } = render(
      <TestProviders>
        <FinancialCalendar transactions={[]} {...currentPage()} />
      </TestProviders>,
    );
    fireEvent.press(getAllByLabelText(today)[0]!);
    fireEvent.press(getByLabelText("Fechar"));
    expect(queryByText("Nenhuma movimentação neste dia.")).toBeNull();
  });
});
