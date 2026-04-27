import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { initI18n } from "@/shared/i18n";

import { TurnstileChallenge } from "./turnstile-challenge";

jest.mock("react-native-webview", () => {
  const ReactInner = jest.requireActual("react");
  const ReactNative = jest.requireActual("react-native");
  return {
    __esModule: true,
    WebView: ReactInner.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      ReactInner.createElement(ReactNative.View, {
        ...props,
        ref,
        testID: (props.testID as string | undefined) ?? "webview",
      }),
    ),
  };
});

const setSiteKey = (value: string | undefined): void => {
  if (value === undefined) {
    delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
  } else {
    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = value;
  }
};

const buildBridgeEvent = (payload: object) => ({
  nativeEvent: { data: JSON.stringify(payload) },
});

describe("TurnstileChallenge", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    setSiteKey(undefined);
  });

  it("renderiza nada quando site key esta ausente", () => {
    const { toJSON } = render(
      <AppProviders>
        <TurnstileChallenge onToken={jest.fn()} />
      </AppProviders>,
    );
    expect(toJSON()).toBeNull();
  });

  it("dispara onToken ao receber mensagem token", () => {
    setSiteKey("0x4AAAAAAAprodKey");
    const onToken = jest.fn();
    const { getByTestId } = render(
      <AppProviders>
        <TurnstileChallenge onToken={onToken} testID="turnstile-test" />
      </AppProviders>,
    );

    const webview = getByTestId("webview");
    fireEvent(
      webview,
      "message",
      buildBridgeEvent({ type: "token", token: "abc-123" }),
    );

    expect(onToken).toHaveBeenCalledWith("abc-123");
  });

  it("dispara onExpired quando token expira", () => {
    setSiteKey("0x4AAAAAAAprodKey");
    const onExpired = jest.fn();
    const { getByTestId } = render(
      <AppProviders>
        <TurnstileChallenge
          onToken={jest.fn()}
          onExpired={onExpired}
          testID="turnstile-test"
        />
      </AppProviders>,
    );

    fireEvent(
      getByTestId("webview"),
      "message",
      buildBridgeEvent({ type: "expired" }),
    );

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("dispara onError em mensagens de erro", () => {
    setSiteKey("0x4AAAAAAAprodKey");
    const onError = jest.fn();
    const { getByTestId } = render(
      <AppProviders>
        <TurnstileChallenge
          onToken={jest.fn()}
          onError={onError}
          testID="turnstile-test"
        />
      </AppProviders>,
    );

    fireEvent(
      getByTestId("webview"),
      "message",
      buildBridgeEvent({ type: "error", message: "network" }),
    );

    expect(onError).toHaveBeenCalledWith("network");
  });

  it("ignora mensagens com payload mal-formado", () => {
    setSiteKey("0x4AAAAAAAprodKey");
    const onToken = jest.fn();
    const { getByTestId } = render(
      <AppProviders>
        <TurnstileChallenge onToken={onToken} testID="turnstile-test" />
      </AppProviders>,
    );

    fireEvent(getByTestId("webview"), "message", {
      nativeEvent: { data: "not-json" },
    });

    expect(onToken).not.toHaveBeenCalled();
  });
});
