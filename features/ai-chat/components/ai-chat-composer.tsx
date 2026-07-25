import { useCallback, useState, type ReactElement } from "react";

import { TextInput } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AI_CHAT_MAX_QUESTION_LENGTH } from "@/features/ai-chat/ai-chat-config";
import { AppButton } from "@/shared/components/app-button";
import { useT } from "@/shared/i18n";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

export interface AiChatComposerProps {
  readonly disabled: boolean;
  readonly onSubmit: (question: string) => void | Promise<void>;
}

export function AiChatComposer({ disabled, onSubmit }: AiChatComposerProps): ReactElement {
  const { t } = useT();
  const isDark = useResolvedTheme() === "auraxis_dark";
  const palette = isDark ? darkSemanticColors : lightSemanticColors;
  const [question, setQuestion] = useState("");
  const normalized = question.trim();
  const canSend = !disabled && normalized.length > 0;

  const submit = useCallback((): void => {
    if (!canSend) {
      return;
    }
    setQuestion("");
    void onSubmit(normalized);
  }, [canSend, normalized, onSubmit]);

  return (
    <YStack gap="$1">
      <XStack alignItems="flex-end" gap="$2">
        <TextInput
          multiline
          maxLength={AI_CHAT_MAX_QUESTION_LENGTH}
          value={question}
          onChangeText={setQuestion}
          editable={!disabled}
          placeholder={t("aiChat.composer.placeholder")}
          placeholderTextColor={palette.mutedForeground}
          accessibilityLabel={t("aiChat.composer.placeholder")}
          style={{
            flex: 1,
            minHeight: 48,
            maxHeight: 112,
            borderWidth: 1,
            borderColor: palette.border,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: palette.foreground,
            backgroundColor: palette.surfaceRaised,
            fontSize: 16,
            textAlignVertical: "top",
          }}
          testID="ai-chat-input"
        />
        <AppButton
          size="sm"
          onPress={submit}
          disabled={!canSend}
          accessibilityLabel={t("aiChat.composer.send")}
          testID="ai-chat-send"
        >
          {t("aiChat.composer.send")}
        </AppButton>
      </XStack>
      <Paragraph color="$subdued" fontFamily="$body" fontSize="$2" textAlign="right">
        {t("aiChat.composer.counter", {
          current: question.length,
          maximum: AI_CHAT_MAX_QUESTION_LENGTH,
        })}
      </Paragraph>
    </YStack>
  );
}
