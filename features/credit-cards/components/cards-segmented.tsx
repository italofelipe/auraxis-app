import type { ReactElement } from "react";

import { Paragraph, XStack, useTheme } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { CardsHomeView } from "@/features/credit-cards/hooks/use-cards-home-controller";
import { borderWidths } from "@/config/design-tokens";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { iconSizes } from "@/shared/theme";

/** Props do segmented "Faturas | Analítico". */
export interface CardsSegmentedProps {
  /** Visão ativa. */
  readonly value: CardsHomeView;
  /** Troca a visão ativa. */
  readonly onChange: (value: CardsHomeView) => void;
  readonly testID?: string;
}

interface SegmentDef {
  readonly value: CardsHomeView;
  readonly label: string;
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const SEGMENTS: readonly SegmentDef[] = [
  { value: "faturas", label: "Faturas", icon: "layers-outline" },
  { value: "analitico", label: "Analítico", icon: "chart-bar" },
];

/**
 * Segmented control de duas opções (Faturas / Analítico) num trilho arredondado.
 * O segmento ativo ganha fundo de superfície e cor primária; o inativo fica
 * neutro. Apresentacional — estado e troca vêm via props.
 *
 * @param props Visão ativa e handler de troca.
 * @returns Segmented control selecionável.
 */
export function CardsSegmented({
  value,
  onChange,
  testID,
}: CardsSegmentedProps): ReactElement {
  const theme = useTheme();
  const activeIconColor = theme.primary?.val ?? theme.color?.val ?? "#000000";
  const inactiveIconColor = theme.muted?.val ?? theme.color?.val ?? "#000000";
  return (
    <XStack
      backgroundColor="$surfaceRaised"
      borderRadius="$2"
      borderWidth={borderWidths.hairline}
      borderColor="$borderColor"
      padding="$1"
      gap="$1"
      testID={testID ?? "cards-segmented"}
    >
      {SEGMENTS.map((segment) => {
        const isActive = segment.value === value;
        return (
          <XStack
            key={segment.value}
            flex={1}
            alignItems="center"
            justifyContent="center"
            gap="$2"
            paddingVertical="$3"
            borderRadius="$1"
            backgroundColor={isActive ? "$surfaceCard" : "transparent"}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={segment.label}
            testID={`cards-segmented-${segment.value}`}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => {
              triggerHapticImpact("light");
              onChange(segment.value);
            }}
          >
            <MaterialCommunityIcons
              name={segment.icon}
              size={iconSizes.sm}
              color={isActive ? activeIconColor : inactiveIconColor}
            />
            <Paragraph
              fontFamily="$body"
              fontSize="$4"
              fontWeight={isActive ? "$7" : "$5"}
              color={isActive ? "$primary" : "$muted"}
            >
              {segment.label}
            </Paragraph>
          </XStack>
        );
      })}
    </XStack>
  );
}
