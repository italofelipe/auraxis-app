import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, Card, HelperText, Text, TextInput } from "react-native-paper";

import { spacing } from "@/config/design-tokens";
import { useLoginForm } from "@/hooks/forms/use-login-form";
import { useLoginMutation } from "@/hooks/mutations/use-auth-mutations";

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
  forgotButton: {
    alignSelf: "flex-start",
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
      <Card>
        <Card.Title title="Entrar" subtitle="Acesso a area logada" />
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Senha"
                mode="outlined"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(formState.errors.password)} style={styles.helper}>
            {formState.errors.password?.message}
          </HelperText>

          <Button mode="contained" onPress={() => void onSubmit()} loading={loginMutation.isPending}>
            Entrar
          </Button>

          <Button
            mode="text"
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotButton}>
            Esqueceu sua senha?
          </Button>
        </Card.Content>
      </Card>
      <Text variant="bodySmall">Placeholder visual pronto para receber o design final.</Text>
    </View>
  );
}
