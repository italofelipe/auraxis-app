import { Controller } from "react-hook-form";
import { Paragraph, YStack } from "tamagui";

import { useLoginScreenController } from "@/features/auth/hooks/use-login-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export default function LoginScreen() {
  const controller = useLoginScreenController();
  const {
    control,
    formState: { errors },
  } = controller.form;

  return (
    <AppScreen>
      <AppSurfaceCard title="Entrar" description="Acesso a area logada.">
        <YStack gap="$4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="login-email"
                label="E-mail"
                placeholder="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="login-password"
                label="Senha"
                placeholder="Senha"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.password?.message}
              />
            )}
          />

          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={controller.isSubmitting}>
            {controller.isSubmitting ? "Entrando..." : "Entrar"}
          </AppButton>

          <AppButton tone="secondary" onPress={controller.handleForgotPassword}>
            Esqueceu sua senha?
          </AppButton>
        </YStack>
      </AppSurfaceCard>

      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Placeholder estrutural da rota de login, agora restrito a `features/auth`,
        `shared/*` e `core/*`.
      </Paragraph>

      <YStack gap="$2">
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleOpenTerms();
          }}>
          Termos de Uso
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleOpenPrivacy();
          }}>
          Politica de Privacidade
        </AppButton>
      </YStack>
    </AppScreen>
  );
}
