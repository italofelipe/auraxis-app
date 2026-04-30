import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { SimulationRecord } from "@/features/tools/contracts";
import {
  useSimulationsHistoryScreenController,
  type SimulationsHistoryScreenController,
} from "@/features/tools/hooks/use-simulations-history-screen-controller";
import {
  getSimulationSummary,
  getSimulationTitle,
} from "@/features/tools/services/simulation-display";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const formatDate = (iso: string): string => {
  if (!iso) {
    return "—";
  }
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

/**
 * Cross-tool simulations history screen. Lists every saved simulation
 * with the tool name, the date it was saved and a delete CTA gated by
 * the per-row deletingId from the controller.
 */
export function SimulationsHistoryScreen(): ReactElement {
  const controller = useSimulationsHistoryScreenController();
  return (
    <AppScreen>
      <HeaderCard controller={controller} />
      <HistoryBody controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: SimulationsHistoryScreenController;
}

function HeaderCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Simulações salvas"
      description="Histórico cruzado de todas as simulações que você guardou."
    >
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={controller.handleBack}>
          Voltar
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleRefresh();
          }}
          disabled={controller.isRefreshing}
          testID="simulations-refresh"
        >
          {controller.isRefreshing ? "Atualizando…" : "Atualizar"}
        </AppButton>
      </XStack>
    </AppSurfaceCard>
  );
}

function HistoryBody({ controller }: ControllerProps): ReactElement {
  return (
    <AppQueryState
      query={controller.query}
      options={{
        loading: {
          title: "Carregando histórico",
          description: "Buscando suas simulações.",
        },
        empty: {
          title: "Nenhuma simulação salva",
          description: "Salve uma simulação numa ferramenta e ela aparece aqui.",
        },
        error: {
          fallbackTitle: "Não foi possível carregar agora",
          fallbackDescription: "Tente novamente em instantes.",
        },
        isEmpty: () => controller.items.length === 0,
      }}
      emptyComponent={
        <AppEmptyState
          illustration="wallet"
          title="Você ainda não salvou simulações"
          description="Quando salvar uma simulação numa ferramenta, ela aparece aqui."
        />
      }
    >
      {() => (
        <YStack gap="$3">
          {controller.items.map((simulation) => (
            <SimulationRow
              key={simulation.id}
              simulation={simulation}
              isDeleting={controller.deletingId === simulation.id}
              onDelete={() => {
                void controller.handleDelete(simulation);
              }}
            />
          ))}
        </YStack>
      )}
    </AppQueryState>
  );
}

interface SimulationRowProps {
  readonly simulation: SimulationRecord;
  readonly isDeleting: boolean;
  readonly onDelete: () => void;
}

function SimulationRow({
  simulation,
  isDeleting,
  onDelete,
}: SimulationRowProps): ReactElement {
  const summary = getSimulationSummary(simulation);
  return (
    <AppSurfaceCard
      backgroundColor="$surfaceRaised"
      title={getSimulationTitle(simulation)}
      description={`Salva em ${formatDate(simulation.createdAt)} · regra ${simulation.ruleVersion}`}
    >
      <YStack gap="$2">
        {summary !== null ? (
          <Paragraph color="$color" fontFamily="$body" fontSize="$3">
            {summary}
          </Paragraph>
        ) : null}
        {simulation.goalId ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Vinculada a uma meta.
          </Paragraph>
        ) : null}
        <AppButton
          tone="danger"
          onPress={onDelete}
          disabled={isDeleting}
          testID={`simulation-delete-${simulation.id}`}
        >
          {isDeleting ? "Excluindo…" : "Excluir"}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
