import type { ReactElement } from "react";

import { XStack, YStack } from "tamagui";

import {
  type AlertsTabKey,
  useAlertsScreenController,
} from "@/features/alerts/hooks/use-alerts-screen-controller";
import { AlertPreferenceRow } from "@/features/alerts/components/alert-preference-row";
import { AlertRecordCard } from "@/features/alerts/components/alert-record-card";
import { AppButton } from "@/shared/components/app-button";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

const TABS: { readonly key: AlertsTabKey; readonly label: string }[] = [
  { key: "alerts", label: "Alertas" },
  { key: "preferences", label: "Preferencias" },
];

function AlertsFeedPanel({
  controller,
}: {
  readonly controller: ReturnType<typeof useAlertsScreenController>;
}): ReactElement {
  if (controller.alertsQuery.isPending) {
    return (
      <AsyncStateNotice
        kind="loading"
        title="Carregando alertas"
        description="Buscando as notificacoes mais recentes."
      />
    );
  }

  if (controller.alertsQuery.isError) {
    return (
      <AsyncStateNotice
        kind="error"
        title="Nao foi possivel carregar os alertas"
        description="Tente novamente em alguns instantes."
      />
    );
  }

  if (!controller.alertsQuery.data?.alerts.length) {
    return (
      <AsyncStateNotice
        kind="empty"
        title="Nenhum alerta encontrado"
        description="Novos alertas vao aparecer aqui quando forem gerados."
      />
    );
  }

  return (
    <YStack gap="$3">
      {controller.alertsQuery.data.alerts.map((alert) => {
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
  );
}

function AlertsPreferencesPanel({
  controller,
}: {
  readonly controller: ReturnType<typeof useAlertsScreenController>;
}): ReactElement {
  if (controller.preferencesQuery.isPending) {
    return (
      <AsyncStateNotice
        kind="loading"
        title="Carregando preferencias"
        description="Buscando as configuracoes de notificacao do usuario."
      />
    );
  }

  if (controller.preferencesQuery.isError) {
    return (
      <AsyncStateNotice
        kind="error"
        title="Nao foi possivel carregar as preferencias"
        description="Tente novamente em alguns instantes."
      />
    );
  }

  if (!controller.preferencesQuery.data?.preferences.length) {
    return (
      <AsyncStateNotice
        kind="empty"
        title="Nenhuma preferencia encontrada"
        description="As categorias vao aparecer aqui conforme o backend publicar a matriz."
      />
    );
  }

  return (
    <YStack gap="$3">
      {controller.preferencesQuery.data.preferences.map((preference) => (
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
            onPress={() => controller.setActiveTab(tab.key)}>
            {tab.label}
          </AppButton>
        ))}
      </XStack>

      {controller.activeTab === "alerts" ? (
        <AppSurfaceCard
          title="Alertas"
          description="Feed operacional do usuario, agora consumido pela trilha canônica.">
          <AlertsFeedPanel controller={controller} />
        </AppSurfaceCard>
      ) : (
        <AppSurfaceCard
          title="Preferencias"
          description="Controles de categorias e canal principal de notificacao.">
          <AlertsPreferencesPanel controller={controller} />
        </AppSurfaceCard>
      )}
    </AppScreen>
  );
}
