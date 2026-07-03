import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { SharedEntryCard } from "@/features/shared-entries/components/shared-entry-card";
import { SharedInvitationCard } from "@/features/shared-entries/components/shared-invitation-card";
import { PaywallGate } from "@/features/entitlements/components/paywall-gate";
import {
  useSharedEntriesScreenController,
  type SharedEntriesScreenController,
  type SharedEntriesTab,
} from "@/features/shared-entries/hooks/use-shared-entries-screen-controller";
import type { InvitationView } from "@/features/shared-entries/services/shared-entries-classifier";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
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
    <PaywallGate featureKey="shared_entries">
      <AppScreen>
        <SharedEntriesSummaryCard controller={controller} />
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
    </PaywallGate>
  );
}

interface ControllerProps {
  readonly controller: SharedEntriesScreenController;
}

function TabSelector({ controller }: ControllerProps): ReactElement {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {TAB_ORDER.map((tab) => {
        const label = `${TAB_LABELS[tab]} (${controller.tabCounts[tab]})`;
        return (
          <AppButton
            key={tab}
            tone={controller.selectedTab === tab ? "primary" : "secondary"}
            onPress={() => controller.setSelectedTab(tab)}
            testID={`shared-entries-tab-${tab}`}
            accessibilityLabel={label}
            accessibilityState={{ selected: controller.selectedTab === tab }}
          >
            {label}
          </AppButton>
        );
      })}
    </XStack>
  );
}

function SharedEntriesSummaryCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard title="Resumo">
      <XStack gap="$3" flexWrap="wrap">
        <SummaryMetric
          label="Total"
          value={controller.summary.totalEntries}
          testID="shared-entries-summary-total"
        />
        <SummaryMetric
          label="Ativos"
          value={controller.summary.activeEntries}
          testID="shared-entries-summary-active"
        />
        <SummaryMetric
          label="Convites"
          value={controller.summary.pendingInvitations}
          testID="shared-entries-summary-invitations"
        />
      </XStack>
    </AppSurfaceCard>
  );
}

interface SummaryMetricProps {
  readonly label: string;
  readonly value: number;
  readonly testID: string;
}

function SummaryMetric({ label, value, testID }: SummaryMetricProps): ReactElement {
  return (
    <YStack flex={1} minWidth={96} gap="$1">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {label}
      </Paragraph>
      <Paragraph
        color="$color"
        fontFamily="$body"
        fontSize="$7"
        fontWeight="$7"
        testID={testID}
      >
        {value}
      </Paragraph>
    </YStack>
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
    <YStack gap="$3">
      <InvitationComposer controller={controller} />
      <SharedByMeEntriesList controller={controller} />
      <OutgoingInvitationsList controller={controller} />
    </YStack>
  );
}

function InvitationComposer({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Novo convite"
      description="Convide alguem para participar de um compartilhamento ativo."
    >
      <AppQueryState
        query={controller.byMeQuery}
        options={{
          loading: {
            title: "Carregando compartilhamentos",
            description: "Buscando compartilhamentos disponiveis.",
          },
          empty: {
            title: "Nenhum compartilhamento ativo",
            description: "Crie um compartilhamento antes de enviar convites.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a lista",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.activeByMeEntries.length === 0,
        }}
      >
        {() => <InvitationComposerForm controller={controller} />}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

function InvitationComposerForm({ controller }: ControllerProps): ReactElement {
  return (
    <YStack gap="$3">
      <InvitationEntrySelector controller={controller} />
      <InvitationFormFields controller={controller} />
      <InvitationComposerSubmit controller={controller} />
    </YStack>
  );
}

function InvitationEntrySelector({ controller }: ControllerProps): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Compartilhamento
      </Paragraph>
      <XStack gap="$2" flexWrap="wrap">
        {controller.activeByMeEntries.map((entry) => (
          <AppButton
            key={entry.id}
            size="sm"
            tone={
              controller.invitationForm.sharedEntryId === entry.id
                ? "primary"
                : "secondary"
            }
            onPress={() => controller.selectInvitationEntry(entry.id)}
            testID={`shared-invitation-entry-${entry.id}`}
          >
            {entry.transactionTitle ?? "Lancamento"}
          </AppButton>
        ))}
      </XStack>
    </YStack>
  );
}

function InvitationFormFields({ controller }: ControllerProps): ReactElement {
  return (
    <>
      <AppInputField
        id="shared-invitation-email"
        label="Email do convidado"
        placeholder="email@exemplo.com"
        value={controller.invitationForm.inviteeEmail}
        onChangeText={(value) =>
          controller.setInvitationFormField("inviteeEmail", value)
        }
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
      />
      <AppInputField
        id="shared-invitation-percent"
        label="Percentual"
        helperText="Use o valor exato abaixo se nao quiser enviar percentual."
        placeholder="50"
        value={controller.invitationForm.splitValue}
        onChangeText={(value) =>
          controller.setInvitationFormField("splitValue", value)
        }
        keyboardType="decimal-pad"
      />
      <AppInputField
        id="shared-invitation-amount"
        label="Valor exato"
        placeholder="0,00"
        value={controller.invitationForm.shareAmount}
        onChangeText={(value) =>
          controller.setInvitationFormField("shareAmount", value)
        }
        keyboardType="decimal-pad"
      />
      <AppInputField
        id="shared-invitation-message"
        label="Mensagem"
        placeholder="Opcional"
        value={controller.invitationForm.message}
        onChangeText={(value) => controller.setInvitationFormField("message", value)}
        multiline
        height={84}
      />
      <AppInputField
        id="shared-invitation-expires"
        label="Validade em horas"
        placeholder="168"
        value={controller.invitationForm.expiresInHours}
        onChangeText={(value) =>
          controller.setInvitationFormField("expiresInHours", value)
        }
        keyboardType="number-pad"
      />
    </>
  );
}

function InvitationComposerSubmit({ controller }: ControllerProps): ReactElement {
  return (
    <>
      <InvitationFormErrorMessage controller={controller} />
      <AppButton
        onPress={() => {
          void controller.handleCreateInvitation();
        }}
        disabled={controller.isCreatingInvitation}
        fullWidth
        testID="shared-invitation-create"
      >
        {controller.isCreatingInvitation ? "Enviando..." : "Enviar convite"}
      </AppButton>
    </>
  );
}

function InvitationFormErrorMessage({ controller }: ControllerProps): ReactElement | null {
  if (!controller.invitationFormError) {
    return null;
  }

  return (
    <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
      {controller.invitationFormError}
    </Paragraph>
  );
}

function SharedByMeEntriesList({ controller }: ControllerProps): ReactElement {
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

function OutgoingInvitationsList({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Convites enviados"
      description="Acompanhe e revogue convites que ainda estao pendentes."
    >
      <AppQueryState
        query={controller.invitationsQuery}
        options={{
          loading: {
            title: "Carregando convites enviados",
            description: "Buscando convites recentes.",
          },
          empty: {
            title: "Nenhum convite enviado",
            description: "Convites enviados para seus compartilhamentos aparecerao aqui.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar os convites",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.outgoingInvitations.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.outgoingInvitations.map((invitation) => (
              <OutgoingInvitationCard
                key={invitation.id}
                invitation={invitation}
                onRevoke={() => {
                  void controller.handleRevokeInvitation(invitation);
                }}
                isPending={controller.pendingInvitationIds.has(invitation.id)}
                testID={`outgoing-invitation-${invitation.id}`}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface OutgoingInvitationCardProps {
  readonly invitation: InvitationView;
  readonly onRevoke: () => void;
  readonly isPending: boolean;
  readonly testID: string;
}

const STATUS_LABELS: Record<string, string> = {
  accepted: "Aceito",
  canceled: "Cancelado",
  expired: "Expirado",
  pending: "Pendente",
  rejected: "Recusado",
  revoked: "Revogado",
};

function resolveOutgoingStatus(invitation: InvitationView): string {
  if (invitation.isExpired && invitation.bucket === "pending") {
    return "Expirado";
  }

  return STATUS_LABELS[invitation.status] ?? invitation.status;
}

function OutgoingInvitationCard({
  invitation,
  onRevoke,
  isPending,
  testID,
}: OutgoingInvitationCardProps): ReactElement {
  const canRevoke = invitation.bucket === "pending" && !invitation.isExpired;

  return (
    <AppSurfaceCard
      title={invitation.toUserEmail}
      description={invitation.message ?? "Convite enviado para compartilhamento."}
      testID={testID}
    >
      <YStack gap="$3">
        <XStack gap="$2" alignItems="center" flexWrap="wrap">
          <AppBadge tone={canRevoke ? "primary" : "default"}>
            {resolveOutgoingStatus(invitation)}
          </AppBadge>
          {invitation.shareLabel ? (
            <AppBadge tone="default">{invitation.shareLabel}</AppBadge>
          ) : null}
        </XStack>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Enviado em {new Date(invitation.createdAt).toLocaleDateString("pt-BR")}
        </Paragraph>
        {invitation.expiresAt ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            Expira em {new Date(invitation.expiresAt).toLocaleString("pt-BR")}
          </Paragraph>
        ) : null}
        {canRevoke ? (
          <AppButton
            tone="secondary"
            onPress={onRevoke}
            disabled={isPending}
            testID={`${testID}-revoke`}
          >
            {isPending ? "Revogando..." : "Revogar convite"}
          </AppButton>
        ) : null}
      </YStack>
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
