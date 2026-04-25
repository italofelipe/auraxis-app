import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { SharedEntryCard } from "@/features/shared-entries/components/shared-entry-card";
import { SharedInvitationCard } from "@/features/shared-entries/components/shared-invitation-card";
import {
  useSharedEntriesScreenController,
  type SharedEntriesScreenController,
  type SharedEntriesTab,
} from "@/features/shared-entries/hooks/use-shared-entries-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const TAB_LABELS: Record<SharedEntriesTab, string> = {
  invitations: "Convites",
  byMe: "Compartilhei",
  withMe: "Recebi",
};

const TAB_ORDER: readonly SharedEntriesTab[] = ["invitations", "byMe", "withMe"];

/**
 * Canonical shared entries screen for the mobile app.
 *
 * @returns Three-tab surface for invitations, owned shares and received shares.
 */
export function SharedEntriesScreen(): ReactElement {
  const controller = useSharedEntriesScreenController();

  return (
    <AppScreen>
      <TabSelector controller={controller} />
      {controller.lastError ? (
        <AppErrorNotice
          error={controller.lastError}
          fallbackTitle="Algo deu errado"
          fallbackDescription="Tente novamente em instantes."
          secondaryActionLabel="Fechar"
          onSecondaryAction={controller.dismissError}
        />
      ) : null}
      {controller.selectedTab === "invitations" ? (
        <InvitationsTab controller={controller} />
      ) : null}
      {controller.selectedTab === "byMe" ? (
        <ByMeTab controller={controller} />
      ) : null}
      {controller.selectedTab === "withMe" ? (
        <WithMeTab controller={controller} />
      ) : null}
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: SharedEntriesScreenController;
}

function TabSelector({ controller }: ControllerProps): ReactElement {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {TAB_ORDER.map((tab) => (
        <AppButton
          key={tab}
          tone={controller.selectedTab === tab ? "primary" : "secondary"}
          onPress={() => controller.setSelectedTab(tab)}
        >
          {TAB_LABELS[tab]}
        </AppButton>
      ))}
    </XStack>
  );
}

function InvitationsTab({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Convites pendentes"
      description="Aceite ou recuse convites recebidos para dividir despesas."
    >
      <AppQueryState
        query={controller.invitationsQuery}
        options={{
          loading: {
            title: "Carregando convites",
            description: "Buscando convites recentes.",
          },
          empty: {
            title: "Nenhum convite pendente",
            description: "Quando alguem te convidar, ele aparecera aqui.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar os convites",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.pendingInvitations.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.pendingInvitations.map((invitation) => (
              <SharedInvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={() => {
                  void controller.handleAccept(invitation);
                }}
                onReject={() => {
                  void controller.handleReject(invitation);
                }}
                isPending={controller.pendingInvitationIds.has(invitation.id)}
                testID={`invitation-${invitation.id}`}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

function ByMeTab({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Compartilhei"
      description="Compartilhamentos que voce iniciou."
    >
      <AppQueryState
        query={controller.byMeQuery}
        options={{
          loading: {
            title: "Carregando compartilhamentos",
            description: "Buscando suas divisoes ativas.",
          },
          empty: {
            title: "Nenhum compartilhamento criado",
            description: "Inicie um compartilhamento a partir de uma transacao.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a lista",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.byMeEntries.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.byMeEntries.map((entry) => (
              <SharedEntryCard
                key={entry.id}
                entry={entry}
                canRevoke={entry.bucket === "active"}
                onRevoke={() => {
                  void controller.handleRevoke(entry);
                }}
                isRevoking={controller.pendingEntryIds.has(entry.id)}
                testID={`shared-entry-${entry.id}`}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

function WithMeTab({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Recebi"
      description="Compartilhamentos em que voce participa."
    >
      <AppQueryState
        query={controller.withMeQuery}
        options={{
          loading: {
            title: "Carregando compartilhamentos",
            description: "Buscando despesas que voce divide.",
          },
          empty: {
            title: "Nenhum compartilhamento ativo",
            description: "Quando alguem dividir uma despesa com voce, aparecera aqui.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a lista",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.withMeEntries.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.withMeEntries.map((entry) => (
              <SharedEntryCard
                key={entry.id}
                entry={entry}
                canRevoke={false}
                testID={`with-me-entry-${entry.id}`}
              />
            ))}
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Apenas o criador do compartilhamento pode revogar.
            </Paragraph>
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}
