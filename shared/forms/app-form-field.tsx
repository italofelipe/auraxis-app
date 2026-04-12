import type { ReactElement } from "react";

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import {
  AppInputField,
  type AppInputFieldProps,
} from "@/shared/components/app-input-field";

type AppFormFieldInputProps = Omit<
  AppInputFieldProps,
  "id" | "label" | "helperText" | "errorText" | "value" | "onBlur" | "onChangeText"
>;

export interface AppFormFieldProps<TFieldValues extends FieldValues>
  extends AppFormFieldInputProps {
  readonly control: Control<TFieldValues>;
  readonly name: Path<TFieldValues>;
  readonly label: string;
  readonly helperText?: string;
}

/**
 * Normaliza o valor controlado para o formato esperado pelo input.
 *
 * @param value Valor atual do campo no React Hook Form.
 * @returns Valor string seguro para o input controlado.
 */
const resolveFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
};

/**
 * Controlled input field bound to React Hook Form.
 */
export function AppFormField<TFieldValues extends FieldValues>(
  props: AppFormFieldProps<TFieldValues>,
): ReactElement {
  const {
    control,
    name,
    label,
    helperText,
    ...rest
  } = props;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <AppInputField
          id={name}
          label={label}
          helperText={helperText}
          errorText={fieldState.error?.message}
          value={resolveFieldValue(field.value)}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          {...rest}
        />
      )}
    />
  );
}
