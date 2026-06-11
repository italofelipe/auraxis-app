import { useCallback, type ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import type {
  SpendingPattern,
  SpendingPatternSeverity,
} from "@/features/spending-patterns/contracts";
import { useSpendingPatternsLatestQuery } from "@/features/spending-patterns/hooks/use-spending-patterns-latest-query";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const MAX_PATTERNS = 3;

const SEVERITY_TONE: Record<SpendingPatternSeverity, "default" | "primary" | "danger"> = {
  high: "danger",
  medium: "primary",
  low: "default",
};

const SEVERITY_LABEL: Record<SpendingPatternSeverity, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baixa",
};

/**
 * Dashboard radar of compulsive-spending patterns (parity with web PROD-04).
 *
 * Reads the cron-generated analysis (quota-free) and surfaces the most severe
 * patterns with a CTA to set up a budget. Renders nothing until the cron has
 * produced an analysis, so it never shows an empty shell to the user.
 */
export function SpendingPatternsCard(): ReactElement | null {
  const query = useSpendingPatternsLatestQuery();
  const router = useRouter();

  const handleCreateBudget = useCallback((): void => {
    router.push(appRoutes.private.budgets);
  }, [router]);

  const latest = query.data;
  const hasAnalysis = Boolean(latest?.generatedAt);
  const patterns = latest?.patterns ?? [];

  if (!query.isLoading && (!hasAnalysis || patterns.length === 0)) {
    return null;
  }

  return (
    <AppSurfaceCard
      title="Radar de gastos"
      description="Padroes detectados nos seus gastos recentes."
    >
      <YStack gap="$3">
        <AppQueryState
          query={query}
          options={{
            loading: { title: "Analisando seus gastos" },
            loadingPresentation: "notice",
            empty: { title: "Sem padroes por enquanto" },
            error: { fallbackTitle: "Nao foi possivel carregar o radar" },
            isEmpty: (data) => data.patterns.length === 0,
          }}
        >
          {(data) => <PatternList patterns={data.patterns} />}
        </AppQueryState>
        <AppButton tone="secondary" onPress={handleCreateBudget}>
          Criar orcamento
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface PatternListProps {
  readonly patterns: readonly SpendingPattern[];
}

function PatternList({ patterns }: PatternListProps): ReactElement {
  return (
    <YStack gap="$3">
      {patterns.slice(0, MAX_PATTERNS).map((pattern) => (
        <PatternRow key={pattern.description} pattern={pattern} />
      ))}
    </YStack>
  );
}

interface PatternRowProps {
  readonly pattern: SpendingPattern;
}

function PatternRow({ pattern }: PatternRowProps): ReactElement {
  return (
    <YStack gap="$1">
      <XStack alignItems="center" justifyContent="space-between" gap="$2">
        <Paragraph color="$color" fontFamily="$body" fontSize="$4" flex={1}>
          {pattern.description}
        </Paragraph>
        <AppBadge tone={SEVERITY_TONE[pattern.severity]}>
          {SEVERITY_LABEL[pattern.severity]}
        </AppBadge>
      </XStack>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        {pattern.frequency}
      </Paragraph>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        {pattern.suggestedAction}
      </Paragraph>
    </YStack>
  );
}
