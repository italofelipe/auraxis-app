import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { borderWidths, colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import { useForgotPasswordForm } from "@/hooks/forms/use-forgot-password-form";
import { useForgotPasswordMutation } from "@/hooks/mutations/use-auth-mutations";

const styles = StyleSheet.create({
  card: {
    gap: spacing(2),
  },
  cardBox: {
    backgroundColor: colorPalette.white,
    borderRadius: radii.md,
    padding: spacing(2),
    gap: spacing(1),
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.neutral700,
  },
  cardTitle: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.lg,
    color: colorPalette.neutral950,
  },
  cardSubtitle: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colorPalette.neutral700,
  },
  form: {
    gap: spacing(2),
  },
  input: {
    borderWidth: borderWidths.hairline,
    borderColor: colorPalette.neutral700,
    borderRadius: radii.sm,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    fontFamily: typography.body,
    fontSize: fontSizes.md,
    color: colorPalette.neutral950,
    backgroundColor: colorPalette.white,
  },
  inputError: {
    borderColor: colorPalette.danger500,
  },
  helperText: {
    fontFamily: typography.body,
    fontSize: fontSizes.xs,
    color: colorPalette.danger500,
    marginTop: -spacing(1),
  },
  buttonContained: {
    backgroundColor: colorPalette.brand500,
    borderRadius: radii.sm,
    paddingVertical: spacing(1.5),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing(1),
  },
  buttonText: {
    fontFamily: typography.bodySemiBold,
    fontSize: fontSizes.md,
    color: colorPalette.neutral950,
  },
  buttonTextLink: {
    fontFamily: typography.body,
    fontSize: fontSizes.md,
    color: colorPalette.brand600,
  },
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const { control, handleSubmit, formState } = useForgotPasswordForm();

  const onSubmit = handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync(values);
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardBox}>
        <Text style={styles.cardTitle}>Recuperar senha</Text>
        <Text style={styles.cardSubtitle}>Envie o link de recuperacao</Text>
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, formState.errors.email && styles.inputError]}
                placeholder="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {formState.errors.email ? (
            <Text style={styles.helperText}>{formState.errors.email.message}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.buttonContained}
            onPress={() => void onSubmit()}
            disabled={forgotPasswordMutation.isPending}>
            {forgotPasswordMutation.isPending ? (
              <ActivityIndicator size="small" color={colorPalette.neutral950} />
            ) : null}
            <Text style={styles.buttonText}>Enviar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.buttonTextLink}>Voltar para login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
