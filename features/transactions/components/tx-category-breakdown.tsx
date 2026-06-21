import type { ReactElement } from "react";

import { YStack } from "tamagui";

import type { CategoryBar } from "@/features/transactions/model/transactions-feed";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppText } from "@/shared/components/app-text";
import { HBars, type HBarsDatum } from "@/shared/components/charts/h-bars";

/** Quantidade máxima de categorias exibidas nas barras. */
const MAX_BARS = 6;

/** Props do card "Gastos por categoria" (modo Analítico). */
export interface TxCategoryBreakdownProps {
  /** Barras por categoria, já ordenadas por total desc (vêm do controller). */
  readonly categories: readonly CategoryBar[];
  readonly testID?: string;
}

const toDatum = (bar: CategoryBar): HBarsDatum => ({
  id: bar.tagId ?? "uncategorized",
  label: bar.name,
  color: bar.color,
  value: bar.total,
});

/**
 * Card "Gastos por categoria" do modo Analítico: barras horizontais das maiores
 * categorias de despesa (reusa o primitivo `HBars`). Mostra um aviso quando não
 * há gastos categorizados. Apresentacional.
 *
 * @param props Barras por categoria.
 * @returns Card com o breakdown de gastos.
 */
export function TxCategoryBreakdown({
  categories,
  testID,
}: TxCategoryBreakdownProps): ReactElement {
  const bars = categories.slice(0, MAX_BARS).map(toDatum);

  return (
    <AppSurfaceCard testID={testID ?? "tx-category-breakdown"}>
      <YStack gap="$4">
        <AppSectionHeader title="Gastos por categoria" />
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
