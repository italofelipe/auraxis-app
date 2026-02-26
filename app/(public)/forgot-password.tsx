import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, Card, HelperText, TextInput } from "react-native-paper";

import { spacing } from "@/config/design-tokens";
import { useForgotPasswordForm } from "@/hooks/forms/use-forgot-password-form";
import { useForgotPasswordMutation } from "@/hooks/mutations/use-auth-mutations";

const styles = StyleSheet.create({
  card: {
    gap: spacing(2),
  },
  form: {
    gap: spacing(2),
  },
  helper: {
    marginTop: -spacing(1),
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
      <Card>
        <Card.Title title="Recuperar senha" subtitle="Envie o link de recuperacao" />
        <Card.Content style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="E-mail"
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(formState.errors.email)} style={styles.helper}>
            {formState.errors.email?.message}
          </HelperText>

          <Button
            mode="contained"
            onPress={() => void onSubmit()}
            loading={forgotPasswordMutation.isPending}>
            Enviar
          </Button>
          <Button mode="text" onPress={() => router.replace("/login")}>
            Voltar para login
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
