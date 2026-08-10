import { fireEvent, render } from "@testing-library/react-native";

import type { SubscriptionState } from "@/features/subscription/contracts";
import {
  useSubscriptionScreenController,
  type SubscriptionScreenController,
} from "@/features/subscription/hooks/use-subscription-screen-controller";
import { SubscriptionScreen } from "@/features/subscription/screens/subscription-screen";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("@/features/subscription/hooks/use-subscription-screen-controller", () => ({
  useSubscriptionScreenController: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockedUseController = jest.mocked(useSubscriptionScreenController);

const buildSubscription = (
  override: Partial<SubscriptionState> = {},
): SubscriptionState => ({
  id: "sub-1",
  userId: "user-1",
  planCode: "premium",
  offerCode: "premium-monthly",
  status: "active",
  billingCycle: "monthly",
  provider: "asaas",
  providerSubscriptionId: "bill-1",
  trialEndsAt: null,
  currentPeriodStart: "2026-07-01T00:00:00Z",
  currentPeriodEnd: "2026-08-01T12:00:00Z",
  canceledAt: null,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  ...override,
});

const buildQuery = <TData,>(data: TData) => ({
  data,
  error: null,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn().mockResolvedValue(undefined),
});

const buildController = (
  overrides: Partial<SubscriptionScreenController> = {},
): SubscriptionScreenController => {
  const subscription = buildSubscription();
  return {
    subscriptionQuery: buildQuery(subscription) as never,
    plansQuery: buildQuery([]) as never,
    subscription,
    presentations: [],
    trialOffer: null,
    isStartingCheckout: false,
    isStartingTrial: false,
    isCancelingSubscription: false,
    isCancelConfirmationOpen: false,
    checkoutError: null,
    trialError: null,
    cancelError: null,
    managementError: null,
    lastCheckoutOutcome: null,
    lastCanceledSubscription: null,
    managementAction: {
      mode: "api",
      label: "Cancelar assinatura",
      description:
        "O cancelamento interrompe a renovacao e preserva o acesso ja contratado.",
      url: null,
    },
    handleSubscribe: jest.fn().mockResolvedValue(undefined),
    handleStartTrial: jest.fn().mockResolvedValue(undefined),
    handleManageSubscription: jest.fn().mockResolvedValue(undefined),
    handleCancelSubscription: jest.fn().mockResolvedValue(undefined),
    closeCancelConfirmation: jest.fn(),
    dismissCheckoutError: jest.fn(),
    dismissTrialError: jest.fn(),
    dismissManagementError: jest.fn(),
    dismissCancellationFeedback: jest.fn(),
    ...overrides,
  };
};

const renderScreen = (
  controller: SubscriptionScreenController,
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue(controller);
  return render(
    <TestProviders>
      <SubscriptionScreen />
    </TestProviders>,
  );
};

describe("SubscriptionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mostra cancelamento para provider gerenciado pela API", () => {
    const controller = buildController();
    const { getByText, getByTestId } = renderScreen(controller);

    expect(getByText("Ativa")).toBeTruthy();
    expect(getByText("Cancelar assinatura")).toBeTruthy();
    fireEvent.press(getByTestId("manage-subscription-button"));

    expect(controller.handleManageSubscription).toHaveBeenCalledTimes(1);
  });

  it("explica e confirma o efeito antes de cancelar", () => {
    const controller = buildController({
      isCancelConfirmationOpen: true,
    });
    const { getByText, getByTestId } = renderScreen(controller);

    expect(getByText("Cancelar assinatura?")).toBeTruthy();
    expect(getByText(/Seu acesso continua ate 01\/08\/2026/)).toBeTruthy();
    fireEvent.press(getByTestId("confirm-subscription-cancel"));

    expect(controller.handleCancelSubscription).toHaveBeenCalledTimes(1);
  });

  it("exibe erro recuperavel e retry dentro da confirmacao", () => {
    const controller = buildController({
      isCancelConfirmationOpen: true,
      cancelError: new Error("billing unavailable"),
    });
    const { getByText } = renderScreen(controller);

    expect(getByText("Nao foi possivel cancelar a assinatura")).toBeTruthy();
    fireEvent.press(getByText("Tentar novamente"));

    expect(controller.handleCancelSubscription).toHaveBeenCalledTimes(1);
  });

  it("bloqueia as acoes enquanto o cancelamento esta em andamento", () => {
    const controller = buildController({
      isCancelConfirmationOpen: true,
      isCancelingSubscription: true,
    });
    const { getByText, getByTestId } = renderScreen(controller);

    expect(getByText("Cancelando...")).toBeTruthy();
    expect(getByTestId("confirm-subscription-cancel").props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
    expect(getByTestId("keep-subscription").props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it("mostra a gestao do provider de loja sem oferecer cancelamento pela API", () => {
    const subscription = buildSubscription({ provider: "app_store" });
    const controller = buildController({
      subscription,
      subscriptionQuery: buildQuery(subscription) as never,
      managementAction: {
        mode: "app-store",
        label: "Gerenciar na App Store",
        description:
          "A Apple controla a renovacao e o cancelamento desta assinatura.",
        url: "https://apps.apple.com/account/subscriptions",
      },
    });
    const { getByText, queryByText } = renderScreen(controller);

    expect(getByText("Gerenciar na App Store")).toBeTruthy();
    expect(queryByText("Cancelar assinatura")).toBeNull();
  });

  it("confirma o cancelamento concluido e a data final de acesso", () => {
    const canceledSubscription = buildSubscription({
      status: "canceled",
      canceledAt: "2026-07-23T22:00:00Z",
    });
    const controller = buildController({
      subscription: canceledSubscription,
      subscriptionQuery: buildQuery(canceledSubscription) as never,
      managementAction: null,
      lastCanceledSubscription: canceledSubscription,
    });
    const { getAllByText, getByText, queryByTestId } = renderScreen(controller);

    expect(getByText("Cancelada")).toBeTruthy();
    expect(getAllByText(/Acesso continua ate 01\/08\/2026/i).length).toBeGreaterThan(
      0,
    );
    expect(queryByTestId("manage-subscription-button")).toBeNull();
    fireEvent.press(getByText("Entendi"));

    expect(controller.dismissCancellationFeedback).toHaveBeenCalledTimes(1);
  });
});
