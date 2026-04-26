import type { ReactElement } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { XStack, YStack } from "tamagui";

import type { CreditCard, CreditCardBrand } from "@/features/credit-cards/contracts";
import {
  createCreditCardSchema,
  type CreateCreditCardFormValues,
} from "@/features/credit-cards/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const BRAND_OPTIONS: readonly { value: CreditCardBrand; label: string }[] = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "hipercard", label: "Hipercard" },
  { value: "amex", label: "Amex" },
  { value: "other", label: "Outra" },
];

const EMPTY_DEFAULTS: CreateCreditCardFormValues = {
  name: "",
  brand: null,
  limitAmount: null,
  closingDay: null,
  dueDay: null,
  lastFourDigits: null,
};

const buildDefaults = (initial: CreditCard | null): CreateCreditCardFormValues => {
  if (initial === null) {
    return EMPTY_DEFAULTS;
  }
  return {
    name: initial.name,
    brand: initial.brand,
    limitAmount: initial.limitAmount,
    closingDay: initial.closingDay,
    dueDay: initial.dueDay,
    lastFourDigits: initial.lastFourDigits,
  };
};

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

const parseInteger = (value: string): number | null => {
  if (value.trim().length === 0) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export interface CreditCardFormProps {
  readonly initialCreditCard: CreditCard | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly onSubmit: (values: CreateCreditCardFormValues) => Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissError: () => void;
}

export function CreditCardForm({
  initialCreditCard,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
  onDismissError,
}: CreditCardFormProps): ReactElement {
  const form = useForm<CreateCreditCardFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(
      createCreditCardSchema,
    ) as Resolver<CreateCreditCardFormValues>,
    defaultValues: buildDefaults(initialCreditCard),
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <AppSurfaceCard
      title={initialCreditCard ? "Editar cartao" : "Novo cartao"}
      description="Cartao de credito com limite e datas de fechamento."
    >
      <YStack gap="$4">
        <BrandToggle control={form.control} />
        <CreditCardFields control={form.control} errors={form.formState.errors} />
        <AppButton
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar cartao"}
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

function BrandToggle({
  control,
}: {
  readonly control: Control<CreateCreditCardFormValues>;
}): ReactElement {
  return (
    <Controller
      control={control}
      name="brand"
      render={({ field: { value, onChange } }) => (
        <XStack gap="$2" flexWrap="wrap">
          {BRAND_OPTIONS.map((option) => (
            <AppButton
              key={option.value}
              tone={value === option.value ? "primary" : "secondary"}
              onPress={() => onChange(option.value)}
            >
              {option.label}
            </AppButton>
          ))}
        </XStack>
      )}
    />
  );
}

interface CreditCardFieldsProps {
  readonly control: Control<CreateCreditCardFormValues>;
  readonly errors: FieldErrors<CreateCreditCardFormValues>;
}

function CreditCardFields({
  control,
  errors,
}: CreditCardFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <NameField control={control} errors={errors} />
      <LimitField control={control} errors={errors} />
      <DayField
        control={control}
        errors={errors}
        name="closingDay"
        id="cc-closing-day"
        label="Dia de fechamento"
        placeholder="10"
      />
      <DayField
        control={control}
        errors={errors}
        name="dueDay"
        id="cc-due-day"
        label="Dia de vencimento"
        placeholder="20"
      />
      <LastFourDigitsField control={control} errors={errors} />
    </YStack>
  );
}

function NameField({ control, errors }: CreditCardFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="name"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="cc-name"
          label="Nome"
          placeholder="Nubank Ultravioleta"
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={onChange}
          errorText={errors.name?.message}
        />
      )}
    />
  );
}

function LimitField({ control, errors }: CreditCardFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="limitAmount"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="cc-limit"
          label="Limite"
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={formatNumeric(value)}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseNumeric(text))}
          errorText={errors.limitAmount?.message}
        />
      )}
    />
  );
}

interface DayFieldProps extends CreditCardFieldsProps {
  readonly name: "closingDay" | "dueDay";
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
}

function DayField({
  control,
  errors,
  name,
  id,
  label,
  placeholder,
}: DayFieldProps): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id={id}
          label={label}
          placeholder={placeholder}
          keyboardType="number-pad"
          value={value === null || value === undefined ? "" : value.toString()}
          onBlur={onBlur}
          onChangeText={(text) => onChange(parseInteger(text))}
          errorText={errors[name]?.message}
        />
      )}
    />
  );
}

function LastFourDigitsField({
  control,
  errors,
}: CreditCardFieldsProps): ReactElement {
  return (
    <Controller
      control={control}
      name="lastFourDigits"
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInputField
          id="cc-last-four"
          label="Ultimos 4 digitos"
          placeholder="1234"
          keyboardType="number-pad"
          value={value ?? ""}
          onBlur={onBlur}
          onChangeText={(text) => onChange(text.length > 0 ? text : null)}
          errorText={errors.lastFourDigits?.message}
        />
      )}
    />
  );
}
