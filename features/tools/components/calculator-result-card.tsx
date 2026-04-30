import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export interface CalculatorMetric {
  readonly label: string;
  readonly value: string;
  /** Optional muted hint shown next to the value (e.g. "isento", "anual"). */
  readonly hint?: string;
}

export interface CalculatorResultCardProps {
  readonly title: string;
  readonly description?: string;
  readonly metrics: readonly CalculatorMetric[];
  readonly footer?: string;
  readonly isSaving: boolean;
  readonly isSaved: boolean;
  readonly onSave: () => void;
}

/**
 * Generic result panel used by every salary-and-work calculator. Renders a
 * key/value list followed by the canonical Save button.
 *
 * @param props Title + metrics + save action state.
 * @returns The result view.
 */
export function CalculatorResultCard({
  title,
  description,
  metrics,
  footer,
  isSaving,
  isSaved,
  onSave,
}: CalculatorResultCardProps): ReactElement {
  return (
    <AppSurfaceCard title={title} description={description}>
      <YStack gap="$2">
        {metrics.map((metric) => (
          <AppKeyValueRow
            key={metric.label}
            label={metric.label}
            value={metric.hint !== undefined ? `${metric.value} · ${metric.hint}` : metric.value}
          />
        ))}
        {footer !== undefined ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {footer}
          </Paragraph>
        ) : null}
        {isSaved ? (
          <Paragraph color="$success" fontFamily="$body" fontSize="$3">
            Simulação salva.
          </Paragraph>
        ) : null}
        <AppButton tone="primary" disabled={isSaving || isSaved} onPress={onSave}>
          {isSaving ? "Salvando…" : isSaved ? "Salva" : "Salvar simulação"}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
