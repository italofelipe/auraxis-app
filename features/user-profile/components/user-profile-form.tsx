import { useEffect, type ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { YStack } from "tamagui";

import type { UserProfile } from "@/features/user-profile/contracts";
import {
  updateUserProfileSchema,
  type UpdateUserProfileFormValues,
} from "@/features/user-profile/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const parseNumeric = (value: string): number | null => {
  if (value.trim().length === 0) {
    return null;
  }
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumeric = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return value.toString();
};

const profileToFormValues = (
  profile: UserProfile | null,
): UpdateUserProfileFormValues => ({
  occupation: profile?.occupation ?? null,
  stateUf: profile?.stateUf ?? null,
  monthlyIncome: profile?.monthlyIncome ?? null,
  monthlyExpenses: profile?.monthlyExpenses ?? null,
  netWorth: profile?.netWorth ?? null,
});

export interface UserProfileFormProps {
  readonly initialProfile: UserProfile | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: UpdateUserProfileFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

/**
 * Canonical edit form for the user profile screen.
 *
 * Lifts submit/cancel/error to the parent so the same component can power
 * a future onboarding flow without owning a mutation.
 */
export function UserProfileForm({
  initialProfile,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: UserProfileFormProps): ReactElement {
  const form = useForm<UpdateUserProfileFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(updateUserProfileSchema) as Resolver<UpdateUserProfileFormValues>,
    defaultValues: profileToFormValues(initialProfile),
  });

  useEffect(() => {
    form.reset(profileToFormValues(initialProfile));
  }, [initialProfile, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title="Editar perfil"
      description="Atualize seus dados financeiros para projecoes mais precisas."
    >
      <YStack gap="$4">
        <UserProfileFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel salvar o perfil"
            fallbackDescription="Confira os dados e tente novamente."
            secondaryActionLabel="Fechar"
            onSecondaryAction={onDismissError}
          />
        ) : null}
        <AppButton tone="secondary" onPress={onCancel}>
          Cancelar
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface UserProfileFieldsProps {
  readonly control: Control<UpdateUserProfileFormValues>;
  readonly errors: FieldErrors<UpdateUserProfileFormValues>;
}

function UserProfileFields(props: UserProfileFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <OccupationField {...props} />
      <StateUfField {...props} />
      <MonthlyIncomeField {...props} />
      <MonthlyExpensesField {...props} />
      <NetWorthField {...props} />
    </YStack>
  );
}

function OccupationField({
  control,
  errors,
}: UserProfileFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="occupation"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="profile-occupation"
          label="Ocupacao"
          placeholder="Ex: Engenheira de Software"
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={(text) => onChange(text.length > 0 ? text : null)}
          errorText={errors.occupation?.message}
        />
      )}
    />
  );
}

function StateUfField({ control, errors }: UserProfileFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="stateUf"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="profile-state-uf"
          label="UF (estado)"
          placeholder="SP"
          autoCapitalize="characters"
          maxLength={2}
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={(text) =>
            onChange(text.length > 0 ? text.toUpperCase() : null)
          }
          errorText={errors.stateUf?.message}
        />
      )}
    />
  );
}

function MonthlyIncomeField({
  control,
  errors,
}: UserProfileFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="monthlyIncome"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="profile-monthly-income"
          label="Renda mensal bruta (R$)"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseNumeric(text))}
          errorText={errors.monthlyIncome?.message}
        />
      )}
    />
  );
}

function MonthlyExpensesField({
  control,
  errors,
}: UserProfileFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="monthlyExpenses"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="profile-monthly-expenses"
          label="Despesas mensais (R$)"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseNumeric(text))}
          errorText={errors.monthlyExpenses?.message}
        />
      )}
    />
  );
}

function NetWorthField({ control, errors }: UserProfileFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="netWorth"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="profile-net-worth"
          label="Patrimonio liquido (R$)"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseNumeric(text))}
          errorText={errors.netWorth?.message}
        />
      )}
    />
  );
}
