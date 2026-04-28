import { render } from "@testing-library/react-native";

import { DashboardComparisonCard } from "@/features/dashboard/components/dashboard-comparison-card";
import { TestProviders } from "@/shared/testing/test-providers";

import { initI18n } from "@/shared/i18n";

describe("DashboardComparisonCard", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  it("renders the metric value when provided", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Saldo"
          value={1500}
          delta={null}
          percent={null}
          testID="card"
        />
      </TestProviders>,
    );
    expect(getByText("Saldo")).toBeTruthy();
  });

  it("renders the no-baseline copy when delta and percent are null", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Saldo"
          value={0}
          delta={null}
          percent={null}
        />
      </TestProviders>,
    );
    expect(getByText("Sem comparacao disponivel.")).toBeTruthy();
  });

  it("renders comparison copy when delta and percent are present", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Receitas"
          value={3000}
          delta={500}
          percent={0.2}
        />
      </TestProviders>,
    );
    expect(getByText(/vs mes anterior/)).toBeTruthy();
  });

  it("flips colour semantics when positiveIsGood is false", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Despesas"
          value={1200}
          delta={300}
          percent={0.33}
          positiveIsGood={false}
        />
      </TestProviders>,
    );
    expect(getByText("Despesas")).toBeTruthy();
  });

  it("renders down-trend with negative delta", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Despesas"
          value={1000}
          delta={-200}
          percent={-0.16}
          positiveIsGood={false}
        />
      </TestProviders>,
    );
    expect(getByText("Despesas")).toBeTruthy();
  });

  it("renders flat direction when delta is zero", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Saldo"
          value={500}
          delta={0}
          percent={0}
        />
      </TestProviders>,
    );
    expect(getByText("Saldo")).toBeTruthy();
  });

  it("formats infinity percentages with arrow sentinels", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Receitas"
          value={500}
          delta={500}
          percent={Number.POSITIVE_INFINITY}
        />
      </TestProviders>,
    );
    expect(getByText(/↑ ∞/)).toBeTruthy();
  });

  it("formats negative infinity with descending sentinel", () => {
    const { getByText } = render(
      <TestProviders>
        <DashboardComparisonCard
          title="Saldo"
          value={-500}
          delta={-500}
          percent={Number.NEGATIVE_INFINITY}
        />
      </TestProviders>,
    );
    expect(getByText(/↓ ∞/)).toBeTruthy();
  });
});
