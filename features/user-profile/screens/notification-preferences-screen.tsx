import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { NotificationPreference } from "@/features/user-profile/contracts";
import {
  useNotificationPreferencesScreenController,
  type NotificationPreferencesScreenController,
} from "@/features/user-profile/hooks/use-notification-preferences-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function NotificationPreferencesScreen(): ReactElement {
  const controller = useNotificationPreferencesScreenController();
  return (
    <AppScreen>
      <AppSurfaceCard
        title="Preferencias de notificacao"
        description="Escolha quais categorias deseja receber."
      >
        <AppQueryState
          query={controller.preferencesQuery}
          options={{
            loading: {
              title: "Carregando preferencias",
              description: "Buscando suas configuracoes.",
            },
            empty: {
              title: "Nenhuma preferencia",
              description: "Sem categorias configuradas no momento.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar as preferencias",
              fallbackDescription: "Tente novamente em instantes.",
            },
            isEmpty: () => controller.preferences.length === 0,
          }}
        >
          {() => <PreferencesList controller={controller} />}
        </AppQueryState>
        {controller.submitError ? (
          <AppErrorNotice
            error={controller.submitError}
            fallbackTitle="Nao foi possivel salvar"
            fallbackDescription="Tente novamente em instantes."
            secondaryActionLabel="Fechar"
            onSecondaryAction={controller.dismissSubmitError}
          />
        ) : null}
        <AppButton
          onPress={() => {
            void controller.handleSave();
          }}
          disabled={controller.isSubmitting}
        >
          {controller.isSubmitting ? "Salvando..." : "Salvar preferencias"}
        </AppButton>
      </AppSurfaceCard>
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: NotificationPreferencesScreenController;
}

function PreferencesList({ controller }: ControllerProps): ReactElement {
  return (
    <YStack gap="$3">
      {controller.preferences.map((preference) => (
        <PreferenceRow
          key={preference.category}
          preference={preference}
          onToggleEnabled={() =>
            controller.togglePreference(preference.category)
          }
          onToggleGlobalOptOut={() =>
            controller.toggleGlobalOptOut(preference.category)
          }
        />
      ))}
    </YStack>
  );
}

interface PreferenceRowProps {
  readonly preference: NotificationPreference;
  readonly onToggleEnabled: () => void;
  readonly onToggleGlobalOptOut: () => void;
}

function PreferenceRow({
  preference,
  onToggleEnabled,
  onToggleGlobalOptOut,
}: PreferenceRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={preference.category}
        value={
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {preference.enabled ? "Ativada" : "Desativada"}
          </Paragraph>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton
          tone={preference.enabled ? "primary" : "secondary"}
          onPress={onToggleEnabled}
        >
          {preference.enabled ? "Desativar" : "Ativar"}
        </AppButton>
        <AppButton tone="secondary" onPress={onToggleGlobalOptOut}>
          {preference.globalOptOut ? "Reativar opt-out" : "Opt-out global"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
