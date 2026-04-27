import { useCallback, useMemo, useState, type ReactElement } from "react";

import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { Paragraph, YStack } from "tamagui";

import { resolveTurnstilePolicy } from "@/core/security/turnstile-config";
import { authLogger } from "@/core/telemetry/domain-loggers";
import { useT } from "@/shared/i18n";

const CHALLENGE_HEIGHT = 80;

type ChallengeStatus = "loading" | "ready" | "solved" | "errored";

interface TurnstileBridgeMessage {
  readonly type: "ready" | "token" | "expired" | "error";
  readonly token?: string;
  readonly message?: string;
}

const buildHtml = (siteKey: string): string => {
  // The widget reports outcomes by posting a JSON payload back to the
  // ReactNative bridge. We deliberately return *only* the message
  // shape — never the raw widget response — so the host has a stable
  // contract that survives Cloudflare API changes.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; }
    #wrap { display: flex; align-items: center; justify-content: center; padding: 4px; }
  </style>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <div id="wrap">
    <div id="ts" class="cf-turnstile" data-sitekey="${siteKey}" data-callback="onTokenSolved" data-error-callback="onTokenError" data-expired-callback="onTokenExpired"></div>
  </div>
  <script>
    function postBridge(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    window.onTokenSolved = function (token) {
      postBridge({ type: 'token', token: token });
    };
    window.onTokenError = function (code) {
      postBridge({ type: 'error', message: String(code || 'turnstile_error') });
    };
    window.onTokenExpired = function () {
      postBridge({ type: 'expired' });
    };
    window.addEventListener('load', function () {
      postBridge({ type: 'ready' });
    });
  </script>
</body>
</html>`;
};

export interface TurnstileChallengeProps {
  /** Fired exactly once per successful solve. */
  readonly onToken: (token: string) => void;
  readonly onError?: (message: string) => void;
  readonly onExpired?: () => void;
  readonly testID?: string;
}

/**
 * Cloudflare Turnstile widget rendered inside a WebView.
 *
 * The widget script lives at challenges.cloudflare.com — the only
 * external origin we trust here. The bridge message protocol is
 * fixed (`ready` | `token` | `error` | `expired`) so the surface
 * area stays small and reviewable.
 *
 * When no site key is configured (dev / preview without secrets)
 * the component renders nothing and does not invoke `onToken` —
 * the auth screen falls back to a non-blocking flow.
 *
 * @param props onToken / onError / onExpired callbacks.
 * @returns A WebView-backed challenge surface, or `null` when no
 *          site key is configured.
 */
export function TurnstileChallenge({
  onToken,
  onError,
  onExpired,
  testID,
}: TurnstileChallengeProps): ReactElement | null {
  const { t } = useT();
  const policy = useMemo(() => resolveTurnstilePolicy(), []);
  const [status, setStatus] = useState<ChallengeStatus>("loading");

  const handleMessage = useCallback(
    (event: WebViewMessageEvent): void => {
      const parsed = parseBridgeMessage(event.nativeEvent.data);
      if (!parsed) {
        return;
      }
      dispatchBridgeMessage(parsed, {
        setStatus,
        onToken,
        onExpired,
        onError,
      });
    },
    [onError, onExpired, onToken],
  );

  if (!policy.enabled || policy.siteKey === null) {
    return null;
  }

  return (
    <YStack
      gap="$2"
      height={CHALLENGE_HEIGHT}
      testID={testID ?? "turnstile-challenge"}
    >
      <WebView
        originWhitelist={["https://challenges.cloudflare.com", "about:blank"]}
        source={{ html: buildHtml(policy.siteKey) }}
        onMessage={handleMessage}
        style={webviewStyle}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        cacheEnabled={false}
        accessibilityLabel="Cloudflare Turnstile"
      />
      {policy.isTestKey ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          {t("auth.captcha.testKeyHint")}
        </Paragraph>
      ) : null}
      {status === "errored" ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {t("auth.captcha.error")}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

const webviewStyle = {
  backgroundColor: "transparent",
  height: CHALLENGE_HEIGHT,
} as const;

const parseBridgeMessage = (raw: string): TurnstileBridgeMessage | null => {
  try {
    const parsed = JSON.parse(raw) as TurnstileBridgeMessage;
    if (!parsed || typeof parsed.type !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

interface BridgeHandlers {
  readonly setStatus: (status: ChallengeStatus) => void;
  readonly onToken: (token: string) => void;
  readonly onExpired?: () => void;
  readonly onError?: (message: string) => void;
}

const dispatchBridgeMessage = (
  parsed: TurnstileBridgeMessage,
  handlers: BridgeHandlers,
): void => {
  if (parsed.type === "ready") {
    handlers.setStatus("ready");
    return;
  }
  if (parsed.type === "token" && typeof parsed.token === "string") {
    handlers.setStatus("solved");
    handlers.onToken(parsed.token);
    return;
  }
  if (parsed.type === "expired") {
    handlers.setStatus("ready");
    handlers.onExpired?.();
    return;
  }
  if (parsed.type === "error") {
    handlers.setStatus("errored");
    const message = parsed.message ?? "turnstile_error";
    authLogger.log("auth.session_invalidated", {
      level: "warn",
      context: { reason: `turnstile_${message}` },
    });
    handlers.onError?.(message);
  }
};
