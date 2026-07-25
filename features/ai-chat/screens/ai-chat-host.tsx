import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Paragraph, Theme, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import type { AiChatErrorKind } from "@/features/ai-chat/contracts";
import { AiChatComposer } from "@/features/ai-chat/components/ai-chat-composer";
import { AiChatMessageList } from "@/features/ai-chat/components/ai-chat-message-list";
import {
  useAiChatController,
  type AiChatController,
} from "@/features/ai-chat/hooks/use-ai-chat-controller";
import { AppButton } from "@/shared/components/app-button";
import { useT } from "@/shared/i18n";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

const SHEET_RADIUS = 28;
const LAUNCHER_SIZE = 58;

interface ErrorBannerProps {
  readonly errorKind: AiChatErrorKind;
  readonly canRetry: boolean;
  readonly onRetry: () => void;
  readonly onDismiss: () => void;
  readonly onGrantConsent: () => void;
}

function ErrorBanner({
  errorKind,
  canRetry,
  onRetry,
  onDismiss,
  onGrantConsent,
}: ErrorBannerProps): ReactElement {
  const { t } = useT();

  return (
    <YStack
      gap="$2"
      borderRadius="$3"
      backgroundColor="$dangerSurface"
      padding="$3"
      accessibilityRole="alert"
      testID={`ai-chat-error-${errorKind}`}
    >
      <Paragraph color="$danger" fontFamily="$body" fontSize="$3">
        {t(`aiChat.errors.${errorKind}`)}
      </Paragraph>
      <XStack flexWrap="wrap" gap="$2">
        {canRetry ? (
          <AppButton size="sm" onPress={onRetry} testID="ai-chat-retry">
            {t("aiChat.actions.retry")}
          </AppButton>
        ) : null}
        {errorKind === "consent" ? (
          <AppButton
            size="sm"
            tone="secondary"
            onPress={onGrantConsent}
            testID="ai-chat-refresh-consent"
          >
            {t("aiChat.actions.grantAgain")}
          </AppButton>
        ) : null}
        <AppButton size="sm" tone="secondary" onPress={onDismiss}>
          {t("aiChat.actions.dismiss")}
        </AppButton>
      </XStack>
    </YStack>
  );
}

function PremiumGate({ onUpgrade }: { readonly onUpgrade: () => void }): ReactElement {
  const { t } = useT();

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      gap="$3"
      padding="$5"
      testID="ai-chat-premium-gate"
    >
      <MaterialCommunityIcons name="crown-outline" size={44} color="#16A8C4" />
      <Paragraph color="$color" fontFamily="$heading" fontSize="$7" textAlign="center">
        {t("aiChat.premiumTitle")}
      </Paragraph>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$4" textAlign="center">
        {t("aiChat.premiumBody")}
      </Paragraph>
      <AppButton onPress={onUpgrade} testID="ai-chat-upgrade">
        {t("aiChat.premiumCta")}
      </AppButton>
    </YStack>
  );
}

function ConsentGate({ controller }: { readonly controller: AiChatController }): ReactElement {
  const { t } = useT();

  if (!controller.isConsentHydrated) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$3"
        testID="ai-chat-consent-loading"
      >
        <ActivityIndicator size="large" />
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {t("aiChat.consentLoading")}
        </Paragraph>
      </YStack>
    );
  }

  return (
    <YStack flex={1} justifyContent="center" gap="$3" padding="$5" testID="ai-chat-consent-gate">
      <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
        {t("aiChat.consentTitle")}
      </Paragraph>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$4">
        {t("aiChat.consentBody")}
      </Paragraph>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        {t("aiChat.transparency")}
      </Paragraph>
      <Paragraph color="$subdued" fontFamily="$body" fontSize="$3">
        {t("aiChat.limits")}
      </Paragraph>
      {controller.consentErrorKind ? (
        <Paragraph
          color="$danger"
          fontFamily="$body"
          fontSize="$3"
          accessibilityRole="alert"
          testID="ai-chat-consent-error"
        >
          {t(`aiChat.errors.${controller.consentErrorKind}`)}
        </Paragraph>
      ) : null}
      <AppButton
        onPress={() => {
          void controller.grantConsent();
        }}
        disabled={controller.isGrantingConsent}
        testID="ai-chat-grant-consent"
      >
        {controller.isGrantingConsent ? t("aiChat.consentGranting") : t("aiChat.consentAction")}
      </AppButton>
    </YStack>
  );
}

function ChatContent({ controller }: { readonly controller: AiChatController }): ReactElement {
  const { t } = useT();

  return (
    <>
      <AiChatMessageList
        messages={controller.messages}
        isSending={controller.isSending}
        onPickExample={(question) => {
          void controller.ask(question);
        }}
      />
      <YStack borderTopWidth={1} borderTopColor="$borderColor" padding="$3" gap="$2">
        {controller.errorKind ? (
          <ErrorBanner
            errorKind={controller.errorKind}
            canRetry={controller.canRetry}
            onRetry={() => {
              void controller.retry();
            }}
            onDismiss={controller.dismissError}
            onGrantConsent={() => {
              void controller.grantConsent();
            }}
          />
        ) : null}
        <AiChatComposer disabled={controller.isSending} onSubmit={controller.ask} />
        <Paragraph color="$subdued" fontFamily="$body" fontSize="$2" textAlign="center">
          {t("aiChat.disclaimer")}
        </Paragraph>
      </YStack>
    </>
  );
}

function ChatSheetHeader({ onClose }: { readonly onClose: () => void }): ReactElement {
  const { t } = useT();

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      gap="$3"
      padding="$4"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <XStack alignItems="center" gap="$3" flex={1}>
        <YStack
          width={38}
          height={38}
          borderRadius={19}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$surfaceRaised"
        >
          <MaterialCommunityIcons name="star-four-points-outline" size={21} color="#16A8C4" />
        </YStack>
        <YStack flex={1}>
          <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
            {t("aiChat.title")}
          </Paragraph>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {t("aiChat.subtitle")}
          </Paragraph>
        </YStack>
      </XStack>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("aiChat.close")}
        hitSlop={10}
        testID="ai-chat-close"
      >
        <MaterialCommunityIcons name="close" size={25} color="#7A8793" />
      </Pressable>
    </XStack>
  );
}

function ChatSheetBody({
  controller,
  onUpgrade,
}: {
  readonly controller: AiChatController;
  readonly onUpgrade: () => void;
}): ReactElement {
  if (controller.isPremiumLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" testID="ai-chat-premium-loading">
        <ActivityIndicator size="large" />
      </YStack>
    );
  }
  if (!controller.hasPremiumAccess) {
    return <PremiumGate onUpgrade={onUpgrade} />;
  }
  if (!controller.hasConsent) {
    return <ConsentGate controller={controller} />;
  }
  return <ChatContent controller={controller} />;
}

function ChatSheet({
  controller,
  onUpgrade,
  backgroundColor,
}: {
  readonly controller: AiChatController;
  readonly onUpgrade: () => void;
  readonly backgroundColor: string;
}): ReactElement {
  const { t } = useT();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.modalRoot}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={controller.close}
          accessibilityRole="button"
          accessibilityLabel={t("aiChat.close")}
        />
        <View style={styles.sheetContainer}>
          <YStack
            height="100%"
            backgroundColor={backgroundColor}
            borderTopLeftRadius={SHEET_RADIUS}
            borderTopRightRadius={SHEET_RADIUS}
            paddingBottom={Math.max(insets.bottom, 12)}
            overflow="hidden"
            testID="ai-chat-sheet"
          >
            <ChatSheetHeader onClose={controller.close} />
            <ChatSheetBody controller={controller} onUpgrade={onUpgrade} />
          </YStack>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Global private-layout host for the AI assistant. The floating entry point is
 * available from every authenticated tab and disappears instantly via feature
 * flag, without a native store release.
 */
export function AiChatHost(): ReactElement | null {
  const { t } = useT();
  const isDark = useResolvedTheme() === "auraxis_dark";
  const palette = isDark ? darkSemanticColors : lightSemanticColors;
  const router = useRouter();
  const controller = useAiChatController();

  if (!controller.isEnabled) {
    return null;
  }

  const openPremium = (): void => {
    controller.close();
    router.push(appRoutes.private.subscription);
  };

  return (
    <>
      {!controller.isOpen ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Pressable
            onPress={controller.open}
            accessibilityRole="button"
            accessibilityLabel={t("aiChat.launcher")}
            style={({ pressed }) => [
              styles.launcher,
              {
                backgroundColor: palette.primary,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
            testID="ai-chat-launcher"
          >
            <MaterialCommunityIcons name="star-four-points-outline" size={27} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}
      <Modal
        visible={controller.isOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={controller.close}
      >
        <Theme
          forceClassName
          name={isDark ? "auraxis_dark" : "auraxis_light"}
        >
          <ChatSheet
            controller={controller}
            onUpgrade={openPremium}
            backgroundColor={palette.background}
          />
        </Theme>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.56)",
  },
  sheetContainer: {
    width: "100%",
    height: "90%",
  },
  launcher: {
    position: "absolute",
    right: 18,
    bottom: 104,
    width: LAUNCHER_SIZE,
    height: LAUNCHER_SIZE,
    borderRadius: LAUNCHER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 9,
  },
});
