import {
  dismissBrowser,
  openAuthSessionAsync,
  openBrowserAsync,
  WebBrowserPresentationStyle,
  type WebBrowserAuthSessionResult,
} from "expo-web-browser";
import { Platform } from "react-native";

import { buildCheckoutReturnUrl } from "@/core/navigation/deep-linking";
import type { CheckoutSession } from "@/features/subscription/contracts";

export type HostedCheckoutResultType =
  | "success"
  | "cancel"
  | "dismiss"
  | "opened"
  | "locked";

export interface HostedCheckoutResult {
  readonly type: HostedCheckoutResultType;
  readonly returnUrl: string;
}

interface HostedCheckoutDependencies {
  readonly openAuthSessionAsync: typeof openAuthSessionAsync;
  readonly openBrowserAsync: typeof openBrowserAsync;
  readonly dismissBrowser: typeof dismissBrowser;
}

const normalizeAuthSessionResult = (
  result: WebBrowserAuthSessionResult,
): HostedCheckoutResultType => {
  if (
    result.type === "success" ||
    result.type === "cancel" ||
    result.type === "dismiss" ||
    result.type === "locked"
  ) {
    return result.type;
  }

  return "dismiss";
};

const defaultDependencies: HostedCheckoutDependencies = {
  openAuthSessionAsync,
  openBrowserAsync,
  dismissBrowser,
};

export const createHostedCheckoutService = (
  dependencies: HostedCheckoutDependencies = defaultDependencies,
) => {
  return {
    openCheckout: async (
      checkoutSession: CheckoutSession,
    ): Promise<HostedCheckoutResult> => {
      if (!checkoutSession.checkoutUrl) {
        throw new Error("Checkout session without checkout URL.");
      }

      const returnUrl = buildCheckoutReturnUrl();

      if (Platform.OS === "web") {
        await dependencies.openBrowserAsync(checkoutSession.checkoutUrl, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });

        return {
          type: "opened",
          returnUrl,
        };
      }

      try {
        const result = await dependencies.openAuthSessionAsync(
          checkoutSession.checkoutUrl,
          returnUrl,
        );

        return {
          type: normalizeAuthSessionResult(result),
          returnUrl,
        };
      } catch {
        await dependencies.openBrowserAsync(checkoutSession.checkoutUrl, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });

        return {
          type: "opened",
          returnUrl,
        };
      }
    },
    dismissCheckout: async (): Promise<void> => {
      await dependencies.dismissBrowser();
    },
  };
};

export const hostedCheckoutService = createHostedCheckoutService();
