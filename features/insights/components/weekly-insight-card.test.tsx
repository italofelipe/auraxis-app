import { fireEvent, render } from "@testing-library/react-native";

import type { UserInsight } from "@/features/insights/contracts";
import { WeeklyInsightCard } from "@/features/insights/components/weekly-insight-card";
import { TestProviders } from "@/shared/testing/test-providers";

const insightFixture: UserInsight = {
  id: "ins-1",
  content: "Voce reduziu gastos variaveis sem cortar lazer.",
  keyMetric: "Voce economizou R$ 320 nesta semana",
  periodStart: "2026-05-04T00:00:00.000Z",
  periodEnd: "2026-05-10T23:59:59.000Z",
  status: "delivered",
  generatedAt: "2026-05-11T09:00:00.000Z",
  readAt: null,
};

describe("WeeklyInsightCard", () => {
  it("renderiza loading em altura fixa", () => {
    const { getByTestId } = render(
      <TestProviders>
        <WeeklyInsightCard
          insight={null}
          isLoading
          isNew={false}
          onMarkAsRead={jest.fn()}
        />
      </TestProviders>,
    );

    expect(getByTestId("weekly-insight-loading")).toBeTruthy();
  });

  it("renderiza placeholder quando nao ha insight", () => {
    const { getByText } = render(
      <TestProviders>
        <WeeklyInsightCard
          insight={null}
          isLoading={false}
          isNew={false}
          onMarkAsRead={jest.fn()}
        />
      </TestProviders>,
    );

    expect(getByText("Seu insight semanal esta sendo preparado")).toBeTruthy();
  });

  it("destaca insight novo e marca como lido ao expandir", () => {
    const markAsRead = jest.fn();
    const { getByText, queryByText } = render(
      <TestProviders>
        <WeeklyInsightCard
          insight={insightFixture}
          isLoading={false}
          isNew
          onMarkAsRead={markAsRead}
        />
      </TestProviders>,
    );

    expect(getByText("NOVO")).toBeTruthy();
    expect(getByText("Voce economizou R$ 320 nesta semana")).toBeTruthy();
    expect(queryByText("Voce reduziu gastos variaveis sem cortar lazer.")).toBeNull();

    fireEvent.press(getByText("Ver mais"));

    expect(markAsRead).toHaveBeenCalledWith("ins-1");
    expect(getByText("Voce reduziu gastos variaveis sem cortar lazer.")).toBeTruthy();
  });
});
