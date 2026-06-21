import type { ReactElement } from "react";

import { XStack, YStack, useTheme } from "tamagui";

import type { DetailEvolutionPoint } from "@/features/credit-cards/model/credit-card-detail";
import { AppHeading } from "@/shared/components/app-heading";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { AreaLineChart } from "@/shared/components/charts";

/** Props da seção "Evolução da fatura". */
export interface CardEvolutionProps {
  /** Série de evolução (mais antigo → mais recente). */
  readonly points: readonly DetailEvolutionPoint[];
  /** Cor da linha/área (gradiente da marca do cartão). */
  readonly color: string;
  readonly testID?: string;
}

/**
 * Seção "Evolução da fatura": cabeçalho com a contagem de meses e um gráfico de
 * área com o último ponto destacado. Quando não há nenhum gasto na janela, não
 * renderiza (evita um gráfico vazio). Apresentacional.
 *
 * @param props Série de pontos e cor da linha.
 * @returns Card com o gráfico de evolução, ou null sem dados.
 */
export function CardEvolution({
  points,
  color,
  testID,
}: CardEvolutionProps): ReactElement | null {
  const theme = useTheme();
  const lineColor = color || theme.primary?.val || "#000000";
  const hasData = points.some((point) => point.value > 0);
  if (!hasData) {
    return null;
  }

  return (
    <AppSurfaceCard testID={testID ?? "card-evolution"}>
      <YStack gap="$4">
        <XStack alignItems="center" justifyContent="space-between" gap="$3">
          <AppHeading level={2} fontSize="$6">
            Evolução da fatura
          </AppHeading>
          <AppText size="bodySm" tone="muted" fontWeight="$7">
            {`${points.length} meses`}
          </AppText>
        </XStack>
        <AreaLineChart
          points={points.map((point) => ({
            label: point.label,
            value: point.value,
          }))}
          color={lineColor}
          currentIndex={points.length - 1}
        />
      </YStack>
    </AppSurfaceCard>
  );
}
