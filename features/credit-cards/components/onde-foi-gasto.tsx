import type { ReactElement } from "react";

import { YStack } from "tamagui";

import type { CategoryGroup } from "@/features/credit-cards/model/credit-card-aggregation";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { HBars, type HBarsDatum } from "@/shared/components/charts";

/** Quantidade máxima de categorias exibidas. */
const MAX_CATEGORIES = 6;

/** Props da seção "Onde foi gasto". */
export interface OndeFoiGastoProps {
  /** Categorias agregadas do mês (já ordenadas por total desc). */
  readonly categories: readonly CategoryGroup[];
  readonly testID?: string;
}

const toBarDatum = (category: CategoryGroup): HBarsDatum => ({
  id: category.tagId ?? "uncategorized",
  label: category.name,
  color: category.color,
  value: category.total,
});

/**
 * Seção "Onde foi gasto": cabeçalho + barras horizontais por categoria (top 6).
 * Quando não há categorias no mês, mostra um aviso curto.
 *
 * @param props Categorias agregadas do mês.
 * @returns Card com as barras por categoria.
 */
export function OndeFoiGasto({
  categories,
  testID,
}: OndeFoiGastoProps): ReactElement {
  const bars = categories.slice(0, MAX_CATEGORIES).map(toBarDatum);

  return (
    <AppSurfaceCard testID={testID ?? "onde-foi-gasto"}>
      <YStack gap="$4">
        <AppSectionHeader title="Onde foi gasto" />
        {bars.length > 0 ? (
          <HBars data={bars} />
        ) : (
          <AppText size="bodySm" tone="muted">
            Sem gastos categorizados neste mês.
          </AppText>
        )}
      </YStack>
    </AppSurfaceCard>
  );
}
