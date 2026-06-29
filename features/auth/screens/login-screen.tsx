import {
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { Input, Label, Paragraph, ScrollView, XStack, YStack } from "tamagui";

import { TurnstileChallenge } from "@/features/auth/components/turnstile-challenge";
import {
  useLoginScreenController,
  type LoginScreenController,
} from "@/features/auth/hooks/use-login-screen-controller";
import type { LoginFormValues } from "@/features/auth/validators";
import { borderWidths, colorPalette, radii, spacing } from "@/config/design-tokens";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { useT } from "@/shared/i18n";

interface SessionFailureNotice {
  readonly title: string;
  readonly description: string;
  readonly dismissLabel: string | null;
}

const AUTH_TEXT = "rgba(232,244,248,0.84)";
const AUTH_MUTED = "rgba(232,244,248,0.64)";
const AUTH_BORDER = "rgba(255,255,255,0.16)";
const AUTH_GLASS = "rgba(255,255,255,0.07)";

export function LoginScreen(): ReactElement {
  const controller = useLoginScreenController();
  const { t } = useT();

  return (
    <PremiumAuthShell>
      <BrandBlock
        overline={t("auth.login.overline")}
        headlinePrefix={t("auth.login.headlinePrefix")}
        headlineAccent={t("auth.login.headlineAccent")}
        subtitle={t("auth.login.subtitle")}
      />

      <YStack gap="$4" testID="login-premium-form">
        {controller.sessionFailureNotice ? (
          <SessionFailureNoticeBlock
            notice={controller.sessionFailureNotice}
            onDismiss={controller.dismissSessionFailureNotice}
          />
        ) : null}

        <LoginFields
          control={controller.form.control}
          errors={controller.form.formState.errors}
          labels={{
            email: t("auth.login.emailLabelPremium"),
            password: t("auth.login.passwordLabelPremium"),
          }}
        />

        <CaptchaBlock controller={controller} />

        <XStack justifyContent="flex-end">
          <PremiumTextButton
            label={t("auth.login.forgotPasswordPremium")}
            onPress={controller.handleForgotPassword}
          />
        </XStack>

        <PremiumPrimaryButton
          label={
            controller.isSubmitting
              ? t("auth.login.submitting")
              : t("auth.login.submitPremium")
          }
          disabled={controller.isSubmitting}
          onPress={() => {
            void controller.handleSubmit();
          }}
        />

        {controller.submitError ? (
          <AppErrorNotice
            error={controller.submitError}
            fallbackTitle="Nao foi possivel entrar agora"
            fallbackDescription="Confira seus dados e tente novamente."
            secondaryActionLabel="Fechar"
            onSecondaryAction={controller.dismissSubmitError}
          />
        ) : null}

        <PremiumDivider label={t("auth.login.divider")} />
        <RegisterCallToAction
          label={t("auth.login.noAccountPremium")}
          actionLabel={t("auth.login.createAccountPremium")}
          onPress={controller.handleRegister}
        />
      </YStack>

      <LegalLinks
        termsLabel={t("auth.login.terms")}
        privacyLabel={t("auth.login.privacy")}
        onOpenTerms={() => {
          void controller.handleOpenTerms();
        }}
        onOpenPrivacy={() => {
          void controller.handleOpenPrivacy();
        }}
      />
    </PremiumAuthShell>
  );
}

function PremiumAuthShell({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <YStack flex={1} backgroundColor="#082630">
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0F6E73", "#0B454F", "#082630"]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.94, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BrandDepthBackground />
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
          <ScrollView
            flex={1}
            testID="login-premium-screen"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: spacing(3),
              paddingTop: spacing(2),
              paddingBottom: spacing(2),
            }}
          >
            <YStack flex={1} justifyContent="space-between" gap="$5">
              <YStack gap="$5">{children}</YStack>
              <YStack alignItems="center" gap="$2" paddingBottom="$1">
                <YStack width={112} height={4} borderRadius="$5" backgroundColor="rgba(255,255,255,0.42)" />
              </YStack>
            </YStack>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </YStack>
  );
}

function BrandDepthBackground(): ReactElement {
  return (
    <>
      <Svg style={styles.depthLayer} pointerEvents="none">
        <Defs>
          <RadialGradient id="emeraldGlow" cx="18%" cy="4%" rx="90%" ry="58%">
            <Stop offset="0%" stopColor={colorPalette.lime400} stopOpacity="0.2" />
            <Stop offset="46%" stopColor={colorPalette.lime400} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cyanGlow" cx="92%" cy="12%" rx="78%" ry="54%">
            <Stop offset="0%" stopColor={colorPalette.cyan500} stopOpacity="0.16" />
            <Stop offset="50%" stopColor={colorPalette.cyan500} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="bottomVignette" cx="50%" cy="122%" rx="80%" ry="58%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.58" />
            <Stop offset="55%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#emeraldGlow)" />
        <Rect width="100%" height="100%" fill="url(#cyanGlow)" />
        <Rect width="100%" height="100%" fill="url(#bottomVignette)" />
      </Svg>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
        style={styles.topSheen}
      />
    </>
  );
}

interface BrandBlockProps {
  readonly overline: string;
  readonly headlinePrefix: string;
  readonly headlineAccent: string;
  readonly subtitle: string;
}

function BrandBlock({
  overline,
  headlinePrefix,
  headlineAccent,
  subtitle,
}: BrandBlockProps): ReactElement {
  return (
    <YStack gap="$4">
      <XStack alignItems="center" gap="$2">
        <LinearGradient
          colors={["rgba(255,255,255,0.24)", "rgba(255,255,255,0.06)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoMark}
        >
          <Paragraph color="#FFFFFF" fontFamily="$heading" fontSize="$6" fontWeight="$7">
            A
          </Paragraph>
        </LinearGradient>
        <Paragraph color="#FFFFFF" fontFamily="$heading" fontSize="$6" fontWeight="$6">
          Auraxis
        </Paragraph>
      </XStack>

      <XStack
        alignSelf="flex-start"
        alignItems="center"
        gap="$2"
        paddingHorizontal="$3"
        paddingVertical={6}
        borderRadius="$5"
        backgroundColor="rgba(255,255,255,0.08)"
        borderColor="rgba(255,255,255,0.14)"
        borderWidth={borderWidths.hairline}
      >
        <MaterialCommunityIcons
          name="shield-check"
          size={14}
          color={colorPalette.cyan300}
        />
        <Paragraph
          color="rgba(232,244,248,0.9)"
          fontFamily="$body"
          fontSize="$1"
          fontWeight="$6"
          letterSpacing={1.4}
        >
          {overline}
        </Paragraph>
      </XStack>

      <YStack gap="$1" maxWidth={310}>
        <Paragraph
          color="#FFFFFF"
          fontFamily="$heading"
          fontSize={33}
          fontWeight="$7"
          lineHeight={37}
        >
          {headlinePrefix}
        </Paragraph>
        <Paragraph
          color={colorPalette.lime300}
          fontFamily="$heading"
          fontSize={33}
          fontStyle="italic"
          fontWeight="$6"
          lineHeight={37}
        >
          {headlineAccent}
        </Paragraph>
      </YStack>
      <Paragraph color="rgba(232,244,248,0.74)" fontFamily="$body" fontSize="$4" lineHeight={23}>
        {subtitle}
      </Paragraph>
    </YStack>
  );
}

interface LoginFieldsProps {
  readonly control: Control<LoginFormValues>;
  readonly errors: FieldErrors<LoginFormValues>;
  readonly labels: {
    readonly email: string;
    readonly password: string;
  };
}

function LoginFields({ control, errors, labels }: LoginFieldsProps): ReactElement {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <PremiumInputField
            id="login-email"
            label={labels.email}
            placeholder="seu@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
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
          <PremiumInputField
            id="login-password"
            label={labels.password}
            placeholder="Sua senha"
            autoComplete="password"
            textContentType="password"
            secureTextEntry={!passwordVisible}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.password?.message}
            trailingIcon={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
                onPress={() => setPasswordVisible((current) => !current)}
                style={styles.iconButton}
              >
                <MaterialCommunityIcons
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={20}
                  color={AUTH_TEXT}
                />
              </Pressable>
            }
          />
        )}
      />
    </YStack>
  );
}

interface PremiumInputFieldProps extends ComponentProps<typeof Input> {
  readonly id: string;
  readonly label: string;
  readonly errorText?: string;
  readonly trailingIcon?: ReactNode;
}

function PremiumInputField({
  id,
  label,
  errorText,
  trailingIcon,
  accessibilityLabel,
  ...rest
}: PremiumInputFieldProps): ReactElement {
  return (
    <YStack gap="$2">
      <Label
        htmlFor={id}
        color={AUTH_MUTED}
        fontFamily="$body"
        fontSize="$2"
        fontWeight="$6"
        letterSpacing={1.1}
      >
        {label}
      </Label>
      <XStack
        minHeight={54}
        alignItems="center"
        borderRadius={radii.md}
        borderColor={AUTH_BORDER}
        borderWidth={borderWidths.hairline}
        backgroundColor={AUTH_GLASS}
        paddingHorizontal="$3"
      >
        <Input
          id={id}
          accessibilityLabel={accessibilityLabel ?? label}
          aria-invalid={Boolean(errorText)}
          flex={1}
          height={54}
          borderWidth={0}
          backgroundColor="transparent"
          color="#FFFFFF"
          fontFamily="$body"
          fontSize="$4"
          placeholderTextColor="$muted"
          paddingHorizontal={0}
          {...rest}
        />
        {trailingIcon}
      </XStack>
      {errorText ? (
        <Paragraph color={colorPalette.red400} fontFamily="$body" fontSize="$2">
          {errorText}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

interface CaptchaBlockProps {
  readonly controller: LoginScreenController;
}

function CaptchaBlock({ controller }: CaptchaBlockProps): ReactElement | null {
  const { t } = useT();
  if (!controller.captcha.required) {
    return null;
  }
  return (
    <YStack gap="$2">
      <TurnstileChallenge
        onToken={controller.handleCaptchaToken}
        onExpired={controller.handleCaptchaExpired}
        testID="login-captcha"
      />
      {controller.captcha.missingChallenge ? (
        <Paragraph color={colorPalette.red400} fontFamily="$body" fontSize="$2">
          {t("auth.captcha.missing")}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

function PremiumPrimaryButton({
  label,
  disabled,
  onPress,
}: {
  readonly label: string;
  readonly disabled: boolean;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }): ViewStyle => ({
        opacity: disabled ? 0.64 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <LinearGradient
        colors={["#FFFFFF", "#E9F3F1"]}
        style={styles.primaryButton}
      >
        <XStack alignItems="center" justifyContent="center" gap="$2">
          <Paragraph color="#0B3C49" fontFamily="$body" fontSize="$5" fontWeight="$7">
            {label}
          </Paragraph>
          {!disabled ? (
            <MaterialCommunityIcons name="arrow-right" size={20} color="#0B3C49" />
          ) : null}
        </XStack>
      </LinearGradient>
    </Pressable>
  );
}

function PremiumTextButton({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Paragraph
      accessibilityRole="button"
      color={colorPalette.cyan300}
      fontFamily="$body"
      fontSize="$3"
      fontWeight="$6"
      onPress={onPress}
    >
      {label}
    </Paragraph>
  );
}

function PremiumDivider({ label }: { readonly label: string }): ReactElement {
  return (
    <XStack alignItems="center" gap="$3">
      <YStack flex={1} height={1} backgroundColor="rgba(255,255,255,0.16)" />
      <Paragraph color="rgba(232,244,248,0.5)" fontFamily="$body" fontSize="$2" letterSpacing={1.3}>
        {label}
      </Paragraph>
      <YStack flex={1} height={1} backgroundColor="rgba(255,255,255,0.16)" />
    </XStack>
  );
}

function RegisterCallToAction({
  label,
  actionLabel,
  onPress,
}: {
  readonly label: string;
  readonly actionLabel: string;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <XStack justifyContent="center" alignItems="center" gap="$2" flexWrap="wrap">
      <Paragraph color={AUTH_MUTED} fontFamily="$body" fontSize="$3">
        {label}
      </Paragraph>
      <PremiumTextButton label={actionLabel} onPress={onPress} />
    </XStack>
  );
}

interface SessionFailureNoticeBlockProps {
  readonly notice: SessionFailureNotice;
  readonly onDismiss: () => void;
}

function SessionFailureNoticeBlock({
  notice,
  onDismiss,
}: SessionFailureNoticeBlockProps): ReactElement {
  return (
    <YStack
      gap="$2"
      padding="$3"
      borderRadius={radii.md}
      borderColor="rgba(255,255,255,0.18)"
      borderWidth={borderWidths.hairline}
      backgroundColor="rgba(255,255,255,0.08)"
    >
      <Paragraph color={colorPalette.red400} fontFamily="$body" fontSize="$3" fontWeight="$7">
        {notice.title}
      </Paragraph>
      <Paragraph color="rgba(232,244,248,0.78)" fontFamily="$body" fontSize="$3" lineHeight={20}>
        {notice.description}
      </Paragraph>
      {notice.dismissLabel ? (
        <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.ghostButton}>
          <Paragraph color="#FFFFFF" fontFamily="$body" fontSize="$3" fontWeight="$6">
            {notice.dismissLabel}
          </Paragraph>
        </Pressable>
      ) : null}
    </YStack>
  );
}

interface LegalLinksProps {
  readonly termsLabel: string;
  readonly privacyLabel: string;
  readonly onOpenTerms: () => void;
  readonly onOpenPrivacy: () => void;
}

function LegalLinks({
  termsLabel,
  privacyLabel,
  onOpenTerms,
  onOpenPrivacy,
}: LegalLinksProps): ReactElement {
  return (
    <XStack justifyContent="center" alignItems="center" gap="$2" flexWrap="wrap">
      <Paragraph
        accessibilityRole="button"
        color="rgba(232,244,248,0.74)"
        fontFamily="$body"
        fontSize="$2"
        onPress={onOpenTerms}
      >
        {termsLabel}
      </Paragraph>
      <Paragraph color="rgba(232,244,248,0.48)" fontFamily="$body" fontSize="$2">
        ·
      </Paragraph>
      <Paragraph
        accessibilityRole="button"
        color="rgba(232,244,248,0.74)"
        fontFamily="$body"
        fontSize="$2"
        onPress={onOpenPrivacy}
      >
        {privacyLabel}
      </Paragraph>
    </XStack>
  );
}

const primaryButtonStyle: ViewStyle = {
  minHeight: 56,
  borderRadius: 16,
  borderWidth: borderWidths.hairline,
  borderColor: "rgba(255,255,255,0.5)",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: colorPalette.cyan500,
  shadowOpacity: 0.22,
  shadowRadius: 36,
  shadowOffset: { width: 0, height: 14 },
};

const ghostButtonStyle: ViewStyle = {
  minHeight: 40,
  alignSelf: "flex-start",
  borderRadius: 999,
  borderWidth: borderWidths.hairline,
  borderColor: "rgba(255,255,255,0.24)",
  justifyContent: "center",
  paddingHorizontal: spacing(2),
};

const iconButtonStyle: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  minWidth: 44,
};

const logoMarkStyle: ViewStyle = {
  width: 38,
  height: 38,
  borderRadius: 12,
  borderWidth: borderWidths.hairline,
  borderColor: "rgba(255,255,255,0.24)",
  alignItems: "center",
  justifyContent: "center",
};

const depthLayerStyle: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
};

const topSheenStyle: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 220,
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  depthLayer: depthLayerStyle,
  topSheen: topSheenStyle,
  logoMark: logoMarkStyle,
  primaryButton: primaryButtonStyle,
  ghostButton: ghostButtonStyle,
  iconButton: iconButtonStyle,
} satisfies Record<string, ViewStyle | TextStyle>);
