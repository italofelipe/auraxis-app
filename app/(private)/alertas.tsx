import { Paragraph, Switch, XStack, YStack } from "tamagui";

import {
  type AlertsTabKey,
  useAlertsScreenController,
} from "@/features/alerts/hooks/use-alerts-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
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
}) {
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
        const isRead = alert.status === "read";

        return (
          <AppSurfaceCard
            key={alert.id}
            backgroundColor="$surfaceRaised"
            title={alert.category.replace(/_/gu, " ")}
            description={
              alert.entityType
                ? `Evento relacionado a ${alert.entityType}.`
                : "Nova atualizacao operacional disponivel."
            }>
            <YStack gap="$3">
              <AppBadge tone={isRead ? "default" : "primary"}>
                {isRead ? "lido" : "novo"}
              </AppBadge>
              <XStack gap="$2" flexWrap="wrap">
                {!isRead ? (
                  <AppButton
                    tone="secondary"
                    onPress={() => controller.markReadMutation.mutate(alert.id)}>
                    Marcar lido
                  </AppButton>
                ) : null}
                <AppButton
                  tone="secondary"
                  onPress={() => controller.deleteAlertMutation.mutate(alert.id)}>
                  Excluir
                </AppButton>
              </XStack>
            </YStack>
          </AppSurfaceCard>
        );
      })}
    </YStack>
  );
}

function AlertsPreferencesPanel({
  controller,
}: {
  readonly controller: ReturnType<typeof useAlertsScreenController>;
}) {
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
        <XStack
          key={preference.id}
          alignItems="center"
          justifyContent="space-between"
          gap="$3">
          <YStack gap="$1" flex={1}>
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {preference.category}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Canal principal: email
            </Paragraph>
          </YStack>
          <Switch
            checked={preference.enabled}
            onCheckedChange={(value) => {
              controller.updatePreferenceMutation.mutate({
                category: preference.category,
                payload: {
                  enabled: Boolean(value),
                  channels: ["email"],
                },
              });
            }}>
            <Switch.Thumb />
          </Switch>
        </XStack>
      ))}
    </YStack>
  );
}

export default function AlertasScreen() {
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
