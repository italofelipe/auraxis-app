import { render } from "@testing-library/react-native";

import { CreditCardCard } from "@/features/credit-cards/components/credit-card-card";
import type {
  CreditCard,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/features/credit-cards/hooks/use-credit-card-utilization-query", () => ({
  useCreditCardUtilizationQuery: jest.fn(),
}));

const mockedUseUtilization = jest.mocked(useCreditCardUtilizationQuery);

const cardFixture: CreditCard = {
  id: "card-1",
  name: "Nubank Ultravioleta",
  brand: "mastercard",
  limitAmount: 5000,
  closingDay: 10,
  dueDay: 20,
  lastFourDigits: "1234",
  bank: "Nubank",
  description: "Cartao principal das despesas mensais",
  benefits: ["Cashback 1%", "Sala VIP"],
  validityDate: "2029-12-01",
  createdAt: "2026-05-01T00:00:00Z",
  updatedAt: "2026-05-02T00:00:00Z",
};

const buildUtilization = (
  utilizationPct: number,
): CreditCardUtilizationRecord => ({
  cycle: {
    startDate: "2026-04-11",
    endDate: "2026-05-10",
    dueDate: "2026-05-20",
    status: "open",
  },
  committedAmount: (utilizationPct / 100) * 5000,
  availableAmount: 5000 - (utilizationPct / 100) * 5000,
  limitAmount: 5000,
  utilizationPct,
});

const renderCard = (utilizationPct: number) => {
  mockedUseUtilization.mockReturnValue({
    data: buildUtilization(utilizationPct),
    isLoading: false,
    isError: false,
  } as never);

  return render(
    <TestProviders>
      <CreditCardCard
        creditCard={cardFixture}
        isDeleting={false}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onViewDetails={jest.fn()}
        onViewBill={jest.fn()}
      />
    </TestProviders>,
  );
};

describe("CreditCardCard", () => {
  it.each([0, 50, 80, 100, 125])(
    "mantem snapshot de utilizacao em %s%%",
    (utilizationPct) => {
      const { toJSON, getByText } = renderCard(utilizationPct);

      expect(getByText(new RegExp(`Utilizado: ${utilizationPct}%`, "u"))).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    },
  );

  it("desabilita fatura quando ciclo nao esta configurado", () => {
    mockedUseUtilization.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as never);
    const { getByText } = render(
      <TestProviders>
        <CreditCardCard
          creditCard={{ ...cardFixture, closingDay: null }}
          isDeleting={false}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onViewDetails={jest.fn()}
        onViewBill={jest.fn()}
        />
      </TestProviders>,
    );

    expect(
      getByText("Configure fechamento e vencimento para calcular a fatura."),
    ).toBeTruthy();
  });
});
