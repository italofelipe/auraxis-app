import { useEffect, useRef, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, type ScrollView as ScrollViewHandle } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import type { AiChatMessage } from "@/features/ai-chat/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { useT } from "@/shared/i18n";

export interface AiChatMessageListProps {
  readonly messages: readonly AiChatMessage[];
  readonly isSending: boolean;
  readonly onPickExample: (question: string) => void;
}

const EXAMPLE_KEYS = [
  "aiChat.examples.food",
  "aiChat.examples.largest",
  "aiChat.examples.goal",
] as const;

function EmptyChat({ onPickExample }: Pick<AiChatMessageListProps, "onPickExample">): ReactElement {
  const { t } = useT();

  return (
    <YStack gap="$3" paddingVertical="$3" testID="ai-chat-empty-state">
      <YStack alignItems="center" gap="$2">
        <MaterialCommunityIcons name="star-four-points-outline" size={32} color="#16A8C4" />
        <Paragraph color="$color" fontFamily="$heading" fontSize="$6" textAlign="center">
          {t("aiChat.emptyTitle")}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3" textAlign="center">
          {t("aiChat.emptyBody")}
        </Paragraph>
      </YStack>
      <YStack gap="$2">
        {EXAMPLE_KEYS.map((key) => {
          const question = t(key);
          return (
            <AppButton
              key={key}
              tone="secondary"
              size="sm"
              onPress={() => onPickExample(question)}
              testID={`ai-chat-example-${key.split(".").at(-1)}`}
            >
              {question}
            </AppButton>
          );
        })}
      </YStack>
    </YStack>
  );
}

function MessageBubble({ message }: { readonly message: AiChatMessage }): ReactElement {
  const { t } = useT();
  const isUser = message.role === "user";

  return (
    <YStack
      alignSelf={isUser ? "flex-end" : "flex-start"}
      maxWidth="88%"
      gap="$1"
      testID={`ai-chat-message-${message.role}`}
    >
      <Paragraph
        color="$muted"
        fontFamily="$body"
        fontSize="$2"
        textAlign={isUser ? "right" : "left"}
      >
        {t(`aiChat.messageLabels.${message.role}`)}
      </Paragraph>
      <YStack
        backgroundColor={isUser ? "$primary" : "$surfaceRaised"}
        borderColor={isUser ? "$primary" : "$borderColor"}
        borderWidth={1}
        borderRadius="$4"
        paddingHorizontal="$3"
        paddingVertical="$2"
        gap="$2"
      >
        <Paragraph
          color={isUser ? "$actionPrimaryForeground" : "$color"}
          fontFamily="$body"
          fontSize="$4"
        >
          {message.content}
        </Paragraph>
        {!isUser && message.periodLabel ? (
          <AppBadge tone="default">{message.periodLabel}</AppBadge>
        ) : null}
      </YStack>
    </YStack>
  );
}

/**
 * Accessible session transcript. No message content is persisted or emitted to
 * analytics; it lives only in the private layout's memory.
 */
export function AiChatMessageList({
  messages,
  isSending,
  onPickExample,
}: AiChatMessageListProps): ReactElement {
  const { t } = useT();
  const scrollRef = useRef<ScrollViewHandle>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [isSending, messages]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      testID="ai-chat-transcript"
    >
      {messages.length === 0 ? (
        <EmptyChat onPickExample={onPickExample} />
      ) : (
        <YStack gap="$3">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </YStack>
      )}
      {isSending ? (
        <XStack
          alignItems="center"
          gap="$2"
          paddingTop="$3"
          accessibilityLiveRegion="polite"
          testID="ai-chat-sending"
        >
          <ActivityIndicator size="small" />
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {t("aiChat.composer.sending")}
          </Paragraph>
        </XStack>
      ) : null}
    </ScrollView>
  );
}
