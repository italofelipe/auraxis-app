import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";

export type FieldType = "decimal" | "integer" | "text";

export interface FieldDescriptor<TForm> {
  readonly key: keyof TForm & string;
  readonly label: string;
  readonly type: FieldType;
  readonly helperText?: string;
  readonly placeholder?: string;
}

export interface CalculatorFormProps<TForm> {
  readonly draft: TForm;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly fields: readonly FieldDescriptor<TForm>[];
  readonly onChange: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly submitLabel?: string;
}

const KEYBOARD_TYPE: Record<FieldType, "decimal-pad" | "number-pad" | "default"> = {
  decimal: "decimal-pad",
  integer: "number-pad",
  text: "default",
};

const formatValueForInput = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const parseInput = (value: string, type: FieldType): unknown => {
  if (type === "text") {
    return value;
  }
  if (value.trim().length === 0) {
    return null;
  }
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return type === "integer" ? Math.round(parsed) : parsed;
};

/**
 * Renders a form for a calculator screen using a field-descriptor array.
 * Each descriptor provides the key, label, type and optional helper text;
 * the component handles keyboard type, parsing and error display per
 * descriptor, so calculator screens stay declarative.
 *
 * @param props Form descriptor + draft state + handlers.
 * @returns The form view.
 */
export function CalculatorForm<TForm extends Record<string, unknown>>({
  draft,
  errors,
  fields,
  onChange,
  onSubmit,
  onReset,
  submitLabel = "Calcular",
}: CalculatorFormProps<TForm>): ReactElement {
  return (
    <YStack gap="$3">
      {fields.map((field) => {
        const id = `field-${field.key}`;
        const error = errors[field.key];
        return (
          <YStack key={field.key} gap="$1">
            <AppInputField
              id={id}
              label={field.label}
              keyboardType={KEYBOARD_TYPE[field.type]}
              placeholder={field.placeholder ?? ""}
              value={formatValueForInput(draft[field.key])}
              onChangeText={(value) => {
                const parsed = parseInput(value, field.type);
                onChange(field.key as keyof TForm, parsed as TForm[keyof TForm]);
              }}
              errorText={error}
            />
            {field.helperText !== undefined ? (
              <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
                {field.helperText}
              </Paragraph>
            ) : null}
          </YStack>
        );
      })}
      <XStack gap="$2">
        <AppButton tone="primary" onPress={onSubmit}>
          {submitLabel}
        </AppButton>
        <AppButton tone="secondary" onPress={onReset}>
          Limpar
        </AppButton>
      </XStack>
    </YStack>
  );
}
