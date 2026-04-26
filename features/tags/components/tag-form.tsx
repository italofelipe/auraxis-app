import type { ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { YStack } from "tamagui";

import type { Tag } from "@/features/tags/contracts";
import {
  createTagSchema,
  type CreateTagFormValues,
} from "@/features/tags/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const buildDefaults = (initial: Tag | null): CreateTagFormValues => ({
  name: initial?.name ?? "",
  color: initial?.color ?? null,
  icon: initial?.icon ?? null,
});

export interface TagFormProps {
  readonly initialTag: Tag | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateTagFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

export function TagForm({
  initialTag,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: TagFormProps): ReactElement {
  const form = useForm<CreateTagFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createTagSchema) as Resolver<CreateTagFormValues>,
    defaultValues: buildDefaults(initialTag),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title={initialTag ? "Editar tag" : "Nova tag"}
      description="Categorize transacoes e orcamentos."
    >
      <YStack gap="$4">
        <TagFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar tag"}
        </AppButton>
        {submitError ? (
          <AppErrorNotice
            error={submitError}
            fallbackTitle="Nao foi possivel salvar"
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

interface TagFieldsProps {
  readonly control: Control<CreateTagFormValues>;
  readonly errors: FieldErrors<CreateTagFormValues>;
}

function TagFields({ control, errors }: TagFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="tag-name"
            label="Nome"
            placeholder="Alimentacao"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="color"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="tag-color"
            label="Cor (opcional)"
            placeholder="#FF8800"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.length > 0 ? text : null)}
            errorText={errors.color?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="icon"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="tag-icon"
            label="Icone (opcional)"
            placeholder="utensils"
            autoCapitalize="none"
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.length > 0 ? text : null)}
            errorText={errors.icon?.message}
          />
        )}
      />
    </YStack>
  );
}
