import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { SpendingPatternsCard } from "@/features/spending-patterns/components/spending-patterns-card";
import { useSpendingPatternsLatestQuery } from "@/features/spending-patterns/hooks/use-spending-patterns-latest-query";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock(
  "@/features/spending-patterns/hooks/use-spending-patterns-latest-query",
  () => ({
    useSpendingPatternsLatestQuery: jest.fn(),
  }),
);

const mockedQuery = jest.mocked(useSpendingPatternsLatestQuery);

const buildPattern = (overrides: Record<string, unknown> = {}) => ({
  description: "Gastos com delivery",
  frequency: "12x no mes",
  averageValue: 45.9,
  suggestedAction: "Defina um teto mensal",
  severity: "high",
  ...overrides,
});

const renderCard = () =>
  render(
    <TestProviders>
      <SpendingPatternsCard />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SpendingPatternsCard", () => {
  it("renderiza padroes e dispara criar orcamento", () => {
    mockedQuery.mockReturnValue({
      data: {
        patterns: [buildPattern()],
        generatedAt: "2026-06-10T03:00:00Z",
        periodLabel: "Ultimos 90 dias",
      },
      isLoading: false,
    } as never);

    const { getByText } = renderCard();
    expect(getByText("Gastos com delivery")).toBeTruthy();
    expect(getByText("Alta")).toBeTruthy();

    fireEvent.press(getByText("Criar orcamento"));
    expect(mockPush).toHaveBeenCalledWith("/orcamentos");
  });

  it("nao renderiza nada quando o cron ainda nao gerou analise", () => {
    mockedQuery.mockReturnValue({
      data: { patterns: [], generatedAt: null, periodLabel: null },
      isLoading: false,
    } as never);

    const { toJSON } = renderCard();
    expect(toJSON()).toBeNull();
  });

  it("nao renderiza nada quando ha analise mas zero padroes", () => {
    mockedQuery.mockReturnValue({
      data: {
        patterns: [],
        generatedAt: "2026-06-10T03:00:00Z",
        periodLabel: "Ultimos 90 dias",
      },
      isLoading: false,
    } as never);

    const { toJSON } = renderCard();
    expect(toJSON()).toBeNull();
  });

  it("limita a 3 padroes exibidos", () => {
    mockedQuery.mockReturnValue({
      data: {
        patterns: [
          buildPattern({ description: "p1" }),
          buildPattern({ description: "p2", severity: "medium" }),
          buildPattern({ description: "p3", severity: "low" }),
          buildPattern({ description: "p4", severity: "low" }),
        ],
        generatedAt: "2026-06-10T03:00:00Z",
        periodLabel: "Ultimos 90 dias",
      },
      isLoading: false,
    } as never);

    const { getByText, queryByText } = renderCard();
    expect(getByText("p1")).toBeTruthy();
    expect(getByText("p3")).toBeTruthy();
    expect(queryByText("p4")).toBeNull();
  });
});
