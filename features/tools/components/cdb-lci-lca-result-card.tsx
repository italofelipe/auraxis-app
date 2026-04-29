import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import type {
  CdbLciLcaProductResult,
  CdbLciLcaResult,
} from "@/features/tools/services/cdb-lci-lca-calculator";

export interface CdbLciLcaResultCardProps {
  readonly result: CdbLciLcaResult;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly onSave: () => void;
}

const PRODUCT_LABEL = {
  cdb: "CDB",
  lci: "LCI",
  lca: "LCA",
} as const;

const formatBrl = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface ProductRowProps {
  readonly product: CdbLciLcaProductResult;
  readonly isBest: boolean;
}

function ProductRow({ product, isBest }: ProductRowProps): ReactElement {
  return (
    <AppSurfaceCard
      title={`${PRODUCT_LABEL[product.product]}${isBest ? " · melhor" : ""}`}
    >
      <YStack gap="$1">
        <AppKeyValueRow label="Bruto" value={formatBrl(product.grossYield)} />
        <AppKeyValueRow
          label="IR"
          value={
            product.irRatePercent === 0
              ? "isento"
              : `${product.irRatePercent.toFixed(1)}% · ${formatBrl(product.irAmount)}`
          }
        />
        <AppKeyValueRow label="Líquido" value={formatBrl(product.netYield)} />
        <AppKeyValueRow label="Saldo final" value={formatBrl(product.netAmount)} />
      </YStack>
    </AppSurfaceCard>
  );
}

/**
 * Renders the comparative table for CDB · LCI · LCA plus the Save button.
 * @param props Computed result and save action state.
 * @returns The result panel view.
 */
export function CdbLciLcaResultCard({
  result,
  isSaving,
  isSaved,
  onSave,
}: CdbLciLcaResultCardProps): ReactElement {
  return (
    <YStack gap="$3">
      <ProductRow product={result.cdb} isBest={result.bestProduct === "cdb"} />
      <ProductRow product={result.lci} isBest={result.bestProduct === "lci"} />
      <ProductRow product={result.lca} isBest={result.bestProduct === "lca"} />
      {isSaved ? (
        <Paragraph color="$success" fontFamily="$body" fontSize="$3">
          Simulação salva.
        </Paragraph>
      ) : null}
      <AppButton tone="primary" disabled={isSaving || isSaved} onPress={onSave}>
        {isSaving ? "Salvando…" : isSaved ? "Salva" : "Salvar simulação"}
      </AppButton>
    </YStack>
  );
}
