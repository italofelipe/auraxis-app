import { useMemo, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import {
  passwordStrengthAnalyzer,
  type PasswordStrengthAnalyzer,
  type PasswordStrengthLevel,
} from "@/features/auth/services/password-strength-analyzer";

const TOTAL_BARS = 4;

const LEVEL_TONE: Record<PasswordStrengthLevel, "muted" | "danger" | "primary" | "success"> = {
  empty: "muted",
  weak: "danger",
  fair: "primary",
  good: "primary",
  strong: "success",
};

const TONE_COLOR: Record<"muted" | "danger" | "primary" | "success", string> = {
  muted: "$borderColor",
  danger: "$danger",
  primary: "$primary",
  success: "$success",
};

export interface PasswordStrengthMeterProps {
  readonly password: string;
  readonly analyzer?: PasswordStrengthAnalyzer;
  readonly testID?: string;
}

/**
 * Visual feedback for password strength backed by the policy analyzer.
 *
 * @param props - Password text, optional analyzer override (DI for tests).
 * @returns A small bars-and-summary indicator with missing criteria chips.
 */
export function PasswordStrengthMeter({
  password,
  analyzer = passwordStrengthAnalyzer,
  testID,
}: PasswordStrengthMeterProps): ReactElement {
  const assessment = useMemo(() => analyzer.analyze(password), [analyzer, password]);
  const tone = LEVEL_TONE[assessment.level];
  const fillColor = TONE_COLOR[tone];

  return (
    <YStack gap="$2" testID={testID}>
      <XStack gap="$2" accessibilityLabel={`Forca da senha: ${assessment.summary}`}>
        {Array.from({ length: TOTAL_BARS }).map((_, index) => {
          const isFilled = index < assessment.score;
          return (
            <YStack
              key={`bar-${index.toString()}`}
              flex={1}
              height={6}
              borderRadius="$1"
              backgroundColor={isFilled ? fillColor : "$borderColor"}
            />
          );
        })}
      </XStack>
      <Paragraph color={tone === "muted" ? "$muted" : "$color"} fontFamily="$body" fontSize="$2">
        {assessment.summary}
      </Paragraph>
      {assessment.missingLabels.length > 0 ? (
        <YStack gap="$1">
          {assessment.missingLabels.map((label) => (
            <Paragraph key={label} color="$muted" fontFamily="$body" fontSize="$2">
              · {label}
            </Paragraph>
          ))}
        </YStack>
      ) : null}
    </YStack>
  );
}
