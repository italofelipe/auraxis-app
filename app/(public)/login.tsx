import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { borderWidths, colorPalette, fontSizes, radii, spacing, typography } from "@/config/design-tokens";
import { useLoginForm } from "@/hooks/forms/use-login-form";
import { useLoginMutation } from "@/hooks/mutations/use-auth-mutations";
import { PRIVACY_URL, TERMS_URL } from "@/lib/web-urls";

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
  buttonTextLinkSmall: {
    fontFamily: typography.body,
    fontSize: fontSizes.xs,
    color: colorPalette.brand600,
  },
  forgotButton: {
    alignSelf: "flex-start",
  },
  bodySmall: {
    fontFamily: typography.body,
    fontSize: fontSizes.xs,
    color: colorPalette.neutral700,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing(1),
  },
});

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const { control, handleSubmit, formState } = useLoginForm();

  const onSubmit = handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
    router.replace("/dashboard");
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardBox}>
        <Text style={styles.cardTitle}>Entrar</Text>
        <Text style={styles.cardSubtitle}>Acesso a area logada</Text>
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, formState.errors.password && styles.inputError]}
                placeholder="Senha"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          {formState.errors.password ? (
            <Text style={styles.helperText}>{formState.errors.password.message}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.buttonContained}
            onPress={() => void onSubmit()}
            disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <ActivityIndicator size="small" color={colorPalette.neutral950} />
            ) : null}
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push("/forgot-password")}>
            <Text style={styles.buttonTextLink}>Esqueceu sua senha?</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.bodySmall}>Placeholder visual pronto para receber o design final.</Text>
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => { void Linking.openURL(TERMS_URL); }}>
          <Text style={styles.buttonTextLinkSmall}>Termos de Uso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { void Linking.openURL(PRIVACY_URL); }}>
          <Text style={styles.buttonTextLinkSmall}>Política de Privacidade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
