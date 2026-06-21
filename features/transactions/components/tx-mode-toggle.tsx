import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, useTheme } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { iconSizes } from "@/shared/theme";
import type { TransactionsFeedViewMode } from "@/features/transactions/hooks/use-transactions-feed-controller";

/** Props do segmented "Fácil | Analítico". */
export interface TxModeToggleProps {
  /** Modo de visualização ativo. */
  readonly value: TransactionsFeedViewMode;
  /** Troca o modo de visualização ativo. */
  readonly onChange: (value: TransactionsFeedViewMode) => void;
  readonly testID?: string;
}

interface SegmentDef {
  readonly value: TransactionsFeedViewMode;
  readonly label: string;
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const SEGMENTS: readonly SegmentDef[] = [
  { value: "facil", label: "Fácil", icon: "layers-outline" },
  { value: "analitico", label: "Analítico", icon: "chart-bar" },
];

/**
 * Segmented control de duas opções (Fácil / Analítico) num trilho arredondado.
 * O segmento ativo ganha superfície de card + cor primária; o inativo fica
 * neutro. Apresentacional — estado e troca vêm via props. Espelha o padrão do
 * segmented dos Cartões.
 *
 * @param props Modo ativo e handler de troca.
 * @returns Segmented control selecionável.
 */
export function TxModeToggle({
  value,
  onChange,
  testID,
}: TxModeToggleProps): ReactElement {
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
      testID={testID ?? "tx-mode-toggle"}
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
            testID={`tx-mode-toggle-${segment.value}`}
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
