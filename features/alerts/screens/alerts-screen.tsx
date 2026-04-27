import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import {
  type AlertsTabKey,
  useAlertsScreenController,
} from "@/features/alerts/hooks/use-alerts-screen-controller";
import { AlertPreferenceRow } from "@/features/alerts/components/alert-preference-row";
import { AlertRecordCard } from "@/features/alerts/components/alert-record-card";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AlertsListSkeleton } from "@/shared/skeletons";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const TABS: { readonly key: AlertsTabKey; readonly label: string }[] = [
  { key: "alerts", label: "Alertas" },
  { key: "preferences", label: "Preferencias" },
];

function AlertsFeedPanel({
  controller,
}: {
  readonly controller: ReturnType<typeof useAlertsScreenController>;
}): ReactElement {
  return (
    <AppQueryState
      query={controller.alertsQuery}
      options={{
        loading: {
          title: "Carregando alertas",
          description: "Buscando as notificacoes mais recentes.",
        },
        empty: {
          title: "Nenhum alerta encontrado",
          description: "Novos alertas vao aparecer aqui quando forem gerados.",
        },
        error: {
          fallbackTitle: "Nao foi possivel carregar os alertas",
          fallbackDescription: "Tente novamente em alguns instantes.",
        },
        isEmpty: (data) => data.alerts.length === 0,
      }}
      loadingComponent={<AlertsListSkeleton rows={4} />}
      emptyComponent={
        <AppEmptyState
          illustration="alerts"
          title="Sem alertas no momento"
          description="Quando houver vencimentos, limites ou eventos importantes, eles aparecem aqui."
        />
      }
    >
      {(data) => (
        <YStack gap="$3">
          {data.alerts.map((alert) => {
            return (
              <AlertRecordCard
                key={alert.id}
                alert={alert}
                onMarkRead={(alertId) => controller.markReadMutation.mutate(alertId)}
                onDelete={(alertId) => controller.deleteAlertMutation.mutate(alertId)}
              />
            );
          })}
        </YStack>
      )}
    </AppQueryState>
  );
}

function AlertsPreferencesPanel({
  controller,
}: {
  readonly controller: ReturnType<typeof useAlertsScreenController>;
}): ReactElement {
  return (
    <AppQueryState
      query={controller.preferencesQuery}
      options={{
        loading: {
          title: "Carregando preferencias",
          description: "Buscando as configuracoes de notificacao do usuario.",
        },
        empty: {
          title: "Nenhuma preferencia encontrada",
          description: "As categorias vao aparecer aqui conforme o backend publicar a matriz.",
        },
        error: {
          fallbackTitle: "Nao foi possivel carregar as preferencias",
          fallbackDescription: "Tente novamente em alguns instantes.",
        },
        isEmpty: (data) => data.preferences.length === 0,
      }}
      loadingComponent={<AlertsListSkeleton rows={3} />}
    >
      {(data) => (
        <YStack gap="$3">
          {data.preferences.map((preference) => (
            <AlertPreferenceRow
              key={preference.id}
              preference={preference}
              onToggle={({ category, enabled, globalOptOut }) => {
                controller.updatePreferenceMutation.mutate({
                  category,
                  payload: {
                    enabled,
                    channels: ["email"],
                    globalOptOut,
                  },
                });
              }}
            />
          ))}
        </YStack>
      )}
    </AppQueryState>
  );
}

/**
 * Canonical alerts screen composition for the mobile app.
 *
 * @returns Alerts feed and preference panels bound to the alerts controller.
 */
export function AlertsScreen(): ReactElement {
  const controller = useAlertsScreenController();
  return (
    <AppScreen>
      <XStack gap="$2" flexWrap="wrap">
        {TABS.map((tab) => (
          <AppButton
            key={tab.key}
            tone={controller.activeTab === tab.key ? "primary" : "secondary"}
            onPress={() => controller.setActiveTab(tab.key)}
          >
            {tab.label}
          </AppButton>
        ))}
      </XStack>

      {controller.activeTab === "alerts" ? (
        <AppSurfaceCard
          title="Alertas"
          description="Feed operacional do usuario, agora consumido pela trilha canônica."
        >
          <AlertsFeedPanel controller={controller} />
        </AppSurfaceCard>
      ) : (
        <AppSurfaceCard
          title="Preferencias"
          description="Controles de categorias e canal principal de notificacao."
        >
          <AlertsPreferencesPanel controller={controller} />
        </AppSurfaceCard>
      )}
    </AppScreen>
  );
}
