import { renderHook } from "@testing-library/react-native";

import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import { useCreditCardDetailScreenController } from "@/features/credit-cards/hooks/use-credit-card-detail-screen-controller";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ id: "cc-1" }),
}));

jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: jest.fn(),
}));
jest.mock("@/features/credit-cards/hooks/use-credit-card-utilization-query", () => ({
  useCreditCardUtilizationQuery: jest.fn(),
}));

const mockedUseCards = jest.mocked(useCreditCardsQuery);
const mockedUseUtilization = jest.mocked(useCreditCardUtilizationQuery);

const buildCard = (overrides: Record<string, unknown> = {}) => ({
  id: "cc-1",
  name: "Nubank",
  brand: "mastercard",
  limitAmount: 5000,
  closingDay: 10,
  dueDay: 17,
  lastFourDigits: "1234",
  bank: "Nu",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseCards.mockReturnValue({ data: { creditCards: [buildCard()] } } as never);
  mockedUseUtilization.mockReturnValue({ data: null } as never);
});

describe("useCreditCardDetailScreenController", () => {
  it("encontra o cartao e marca ciclo configurado", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.creditCard?.id).toBe("cc-1");
    expect(result.current.hasCycleConfig).toBe(true);
    expect(result.current.notFound).toBe(false);
  });

  it("habilita a query de utilizacao apenas com ciclo configurado", () => {
    renderHook(() => useCreditCardDetailScreenController({ creditCardId: "cc-1" }));
    expect(mockedUseUtilization).toHaveBeenCalledWith("cc-1", { enabled: true });
  });

  it("marca ciclo faltante quando closingDay ou dueDay sao nulos", () => {
    mockedUseCards.mockReturnValue({
      data: { creditCards: [buildCard({ closingDay: null })] },
    } as never);
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.hasCycleConfig).toBe(false);
    expect(mockedUseUtilization).toHaveBeenCalledWith("cc-1", { enabled: false });
  });

  it("marca notFound quando o cartao nao existe", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "missing" }),
    );
    expect(result.current.creditCard).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it("handleViewBill navega para a fatura", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    result.current.handleViewBill();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/cartoes/[id]/fatura",
      params: { id: "cc-1" },
    });
  });

  it("handleBack volta para a lista", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    result.current.handleBack();
    expect(mockBack).toHaveBeenCalled();
  });
});
