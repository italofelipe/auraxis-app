import type { ReactElement, ReactNode } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, YStack, useTheme } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppHeading } from "@/shared/components/app-heading";
import { AppStack } from "@/shared/components/app-stack";

export type AppEmptyStateIllustration =
  | "transactions"
  | "goals"
  | "wallet"
  | "alerts"
  | "budgets"
  | "fiscal"
  | "shared"
  | "simulations"
  | "generic";

const ICON_BY_ILLUSTRATION: Record<
  AppEmptyStateIllustration,
  React.ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  transactions: "receipt-text-outline",
  goals: "trophy-outline",
  wallet: "chart-line",
  alerts: "bell-outline",
  budgets: "piggy-bank-outline",
  fiscal: "file-document-outline",
  shared: "account-multiple-outline",
  simulations: "calculator-variant-outline",
  generic: "shape-outline",
};

export interface AppEmptyStateProps {
  /**
   * Pictogram representing the empty domain. Each option maps to a
   * curated MaterialCommunityIcon rendered inside a soft circular badge.
   */
  readonly illustration: AppEmptyStateIllustration;
  readonly title: string;
  readonly description?: string;
  /**
   * Optional call to action shown right below the description.
   */
  readonly cta?: {
    readonly label: string;
    readonly onPress: () => void;
  };
  /**
   * Optional custom node rendered above the title. Use to override the
   * default icon when a feature has a more bespoke visual.
   */
  readonly customIllustration?: ReactNode;
  readonly testID?: string;
}

const ILLUSTRATION_SIZE = 96;
const ICON_SIZE = 44;

/**
 * Illustrated empty state for lists, screens and embedded panels.
 *
 * Uses a soft circular gradient backdrop + curated icon to feel
 * intentional rather than the default "no data" notice. Pair with a
 * short copy and an optional CTA so the user knows the next step.
 *
 * @param props Illustration variant, copy and optional CTA.
 * @returns A friendly placeholder UI for empty data states.
 */
export function AppEmptyState({
  illustration,
  title,
  description,
  cta,
  customIllustration,
  testID,
}: AppEmptyStateProps): ReactElement {
  const theme = useTheme();
  const iconColor = theme.secondary?.val ?? "#5B5BD6";
  const backdropColor = theme.surfaceRaised?.val ?? "#F4F4F8";

  return (
    <AppStack
      gap="$3"
      paddingVertical="$6"
      paddingHorizontal="$4"
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2"
      alignItems="center"
      justifyContent="center"
      testID={testID}
    >
      {customIllustration ?? (
        <YStack
          alignItems="center"
          justifyContent="center"
          backgroundColor={backdropColor}
          borderRadius={ILLUSTRATION_SIZE / 2}
          height={ILLUSTRATION_SIZE}
          width={ILLUSTRATION_SIZE}
        >
          <MaterialCommunityIcons
            name={ICON_BY_ILLUSTRATION[illustration]}
            size={ICON_SIZE}
            color={iconColor}
          />
        </YStack>
      )}

      <AppHeading level={3} fontSize="$5" textAlign="center">
        {title}
      </AppHeading>

      {description ? (
        <Paragraph
          color="$muted"
          fontFamily="$body"
          fontSize="$3"
          textAlign="center"
          maxWidth={320}
        >
          {description}
        </Paragraph>
      ) : null}

      {cta ? (
        <AppButton onPress={cta.onPress} hapticTone="medium">
          {cta.label}
        </AppButton>
      ) : null}
    </AppStack>
  );
}
