import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppearanceSection } from "@/features/user-profile/components/appearance-section";
import { LanguageSection } from "@/features/user-profile/components/language-section";
import { UserProfileForm } from "@/features/user-profile/components/user-profile-form";
import type { UserProfile } from "@/features/user-profile/contracts";
import {
  useUserProfileScreenController,
  type UserProfileScreenController,
} from "@/features/user-profile/hooks/use-user-profile-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const formatNullable = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "Nao informado";
  }
  if (typeof value === "number") {
    return formatCurrency(value);
  }
  return value;
};

/**
 * Canonical user profile screen with read/edit toggle and logout action.
 */
export function UserProfileScreen(): ReactElement {
  const controller = useUserProfileScreenController();

  if (controller.mode === "edit") {
    return (
      <AppScreen>
        <UserProfileForm
          initialProfile={controller.profile}
          isSubmitting={controller.isSaving}
          submitError={controller.submitError}
          onSubmit={controller.handleSubmit}
          onCancel={controller.handleCancel}
          onDismissError={controller.dismissSubmitError}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ProfileCard controller={controller} />
      <AppearanceSection />
      <LanguageSection />
      <LogoutCard controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: UserProfileScreenController;
}

function ProfileCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Perfil"
      description="Suas informacoes pessoais e financeiras."
    >
      <AppQueryState
        query={controller.profileQuery}
        options={{
          loading: {
            title: "Carregando perfil",
            description: "Buscando seus dados.",
          },
          empty: {
            title: "Perfil nao encontrado",
            description: "Nenhum dado de perfil disponivel.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar o perfil",
            fallbackDescription: "Tente novamente em instantes.",
          },
        }}
      >
        {(profile) => <ProfileDetails profile={profile} onEdit={controller.handleEdit} />}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

function ProfileDetails({
  profile,
  onEdit,
}: {
  readonly profile: UserProfile;
  readonly onEdit: () => void;
}): ReactElement {
  return (
    <YStack gap="$3">
      <AppKeyValueRow label="Nome" value={profile.name} />
      <AppKeyValueRow label="E-mail" value={profile.email} />
      <AppKeyValueRow label="Ocupacao" value={formatNullable(profile.occupation)} />
      <AppKeyValueRow label="UF" value={formatNullable(profile.stateUf)} />
      <AppKeyValueRow
        label="Renda mensal"
        value={formatNullable(profile.monthlyIncome)}
      />
      <AppKeyValueRow
        label="Despesas mensais"
        value={formatNullable(profile.monthlyExpenses)}
      />
      <AppKeyValueRow
        label="Patrimonio liquido"
        value={formatNullable(profile.netWorth)}
      />
      <AppButton onPress={onEdit}>Editar perfil</AppButton>
    </YStack>
  );
}

function LogoutCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Sessao"
      description="Encerrar sessao no dispositivo."
    >
      <YStack gap="$3">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Voce sera redirecionado para a tela de login apos sair.
        </Paragraph>
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleLogout();
          }}
          disabled={controller.isLoggingOut}
        >
          {controller.isLoggingOut ? "Saindo..." : "Sair da conta"}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
