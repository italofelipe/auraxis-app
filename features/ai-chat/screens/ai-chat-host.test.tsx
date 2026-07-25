import { fireEvent, render } from "@testing-library/react-native";

import { useRouter } from "expo-router";

import { AiChatHost } from "@/features/ai-chat/screens/ai-chat-host";
import {
  useAiChatController,
  type AiChatController,
} from "@/features/ai-chat/hooks/use-ai-chat-controller";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));
jest.mock("@/features/ai-chat/hooks/use-ai-chat-controller", () => ({
  useAiChatController: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 20, left: 0 }),
}));
jest.mock("@/shared/i18n", () => ({
  useT: () => ({
    t: (key: string) => key,
  }),
}));

const mockedUseController = jest.mocked(useAiChatController);
const mockedUseRouter = jest.mocked(useRouter);
const routerPush = jest.fn();

const renderHost = () =>
  render(
    <TestProviders>
      <AiChatHost />
    </TestProviders>,
  );

const createController = (overrides: Partial<AiChatController> = {}): AiChatController => ({
  isEnabled: true,
  isOpen: false,
  isPremiumLoading: false,
  hasPremiumAccess: true,
  isConsentHydrated: true,
  hasConsent: true,
  isGrantingConsent: false,
  consentErrorKind: null,
  messages: [],
  isSending: false,
  errorKind: null,
  canRetry: false,
  open: jest.fn(),
  close: jest.fn(),
  ask: jest.fn().mockResolvedValue(undefined),
  retry: jest.fn().mockResolvedValue(undefined),
  dismissError: jest.fn(),
  grantConsent: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("AiChatHost", () => {
  beforeEach(() => {
    mockedUseRouter.mockReturnValue({
      push: routerPush,
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => false),
    } as never);
  });

  it("não renderiza entrada quando o kill switch está desligado", () => {
    mockedUseController.mockReturnValue(createController({ isEnabled: false }));

    const { queryByTestId } = renderHost();

    expect(queryByTestId("ai-chat-launcher")).toBeNull();
  });

  it("abre o assistente pela entrada persistente", () => {
    const controller = createController();
    mockedUseController.mockReturnValue(controller);
    const { getByTestId } = renderHost();

    fireEvent.press(getByTestId("ai-chat-launcher"));

    expect(controller.open).toHaveBeenCalledTimes(1);
  });

  it("mostra paywall e encaminha para assinatura", () => {
    const controller = createController({
      isOpen: true,
      hasPremiumAccess: false,
    });
    mockedUseController.mockReturnValue(controller);
    const { getByTestId } = renderHost();

    expect(getByTestId("ai-chat-premium-gate")).toBeTruthy();
    fireEvent.press(getByTestId("ai-chat-upgrade"));

    expect(controller.close).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith("/assinatura");
  });

  it("exige consentimento remoto antes de habilitar o composer", () => {
    const controller = createController({
      isOpen: true,
      hasConsent: false,
    });
    mockedUseController.mockReturnValue(controller);
    const { getByTestId, queryByTestId } = renderHost();

    expect(getByTestId("ai-chat-consent-gate")).toBeTruthy();
    expect(queryByTestId("ai-chat-input")).toBeNull();
    fireEvent.press(getByTestId("ai-chat-grant-consent"));

    expect(controller.grantConsent).toHaveBeenCalledTimes(1);
  });

  it("renderiza transcript, envia pergunta e oferece retry de falha transitória", () => {
    const controller = createController({
      isOpen: true,
      messages: [
        {
          id: "message-1",
          role: "assistant",
          content: "Seu maior gasto foi mercado.",
          createdAt: "2026-07-24T20:00:00Z",
          periodLabel: "julho/2026",
        },
      ],
      errorKind: "server",
      canRetry: true,
    });
    mockedUseController.mockReturnValue(controller);
    const { getByTestId, getByText } = renderHost();

    expect(getByText("Seu maior gasto foi mercado.")).toBeTruthy();
    expect(getByText("julho/2026")).toBeTruthy();
    fireEvent.changeText(getByTestId("ai-chat-input"), "Minha meta?");
    fireEvent.press(getByTestId("ai-chat-send"));
    fireEvent.press(getByTestId("ai-chat-retry"));

    expect(controller.ask).toHaveBeenCalledWith("Minha meta?");
    expect(controller.retry).toHaveBeenCalledTimes(1);
  });

  it("mostra carregamentos de entitlement e consentimento", () => {
    mockedUseController.mockReturnValue(
      createController({
        isOpen: true,
        isPremiumLoading: true,
      }),
    );
    const first = renderHost();
    expect(first.getByTestId("ai-chat-premium-loading")).toBeTruthy();
    first.unmount();

    mockedUseController.mockReturnValue(
      createController({
        isOpen: true,
        hasConsent: false,
        isConsentHydrated: false,
      }),
    );
    const second = renderHost();
    expect(second.getByTestId("ai-chat-consent-loading")).toBeTruthy();
  });
});
