import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { OnboardingStep1Form } from "@/features/onboarding/components/onboarding-step1-form";
import { OnboardingStep2Form } from "@/features/onboarding/components/onboarding-step2-form";
import { OnboardingStep3Form } from "@/features/onboarding/components/onboarding-step3-form";
import {
  useOnboardingScreenController,
  type OnboardingScreenController,
} from "@/features/onboarding/hooks/use-onboarding-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function OnboardingScreen(): ReactElement {
  const controller = useOnboardingScreenController();

  if (!controller.hydrated) {
    return (
      <AppScreen>
        <AppSurfaceCard
          title="Carregando onboarding"
          description="Recuperando seu progresso."
        >
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Aguarde alguns instantes.
          </Paragraph>
        </AppSurfaceCard>
      </AppScreen>
    );
  }

  if (controller.isCompleted || controller.isSkipped) {
    return <CompletionCard controller={controller} />;
  }

  return <WizardSteps controller={controller} />;
}

interface ControllerProps {
  readonly controller: OnboardingScreenController;
}

function CompletionCard({ controller }: ControllerProps): ReactElement {
  const title = controller.isSkipped
    ? "Onboarding pulado"
    : "Onboarding concluido";
  const description = controller.isSkipped
    ? "Voce pode retomar quando quiser."
    : "Voce ja completou os passos iniciais.";
  return (
    <AppScreen>
      <AppSurfaceCard title={title} description={description}>
        <YStack gap="$3">
          <CompletionSummary controller={controller} />
          <AppButton
            tone="secondary"
            onPress={() => {
              void controller.handleReset();
            }}
          >
            Refazer onboarding
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}

function CompletionSummary({ controller }: ControllerProps): ReactElement {
  const { step1, step2, step3 } = controller.formData;
  return (
    <YStack gap="$2">
      {step1 ? (
        <AppKeyValueRow
          label="Perfil"
          value={`${step1.investorProfile} · renda ${step1.monthlyIncome}`}
        />
      ) : null}
      {step2 ? (
        <AppKeyValueRow
          label="Transacao"
          value={`${step2.transactionType} · ${step2.amount}`}
        />
      ) : null}
      {step3 ? (
        <AppKeyValueRow
          label="Meta"
          value={`${step3.name} · ${step3.targetAmount}`}
        />
      ) : null}
    </YStack>
  );
}

function WizardSteps({ controller }: ControllerProps): ReactElement {
  return (
    <AppScreen>
      <ProgressCard controller={controller} />
      {controller.currentStep === 1 ? (
        <OnboardingStep1Form
          initialValues={controller.formData.step1}
          onSubmit={controller.handleSubmitStep1}
          onSkip={() => {
            void controller.handleSkip();
          }}
        />
      ) : null}
      {controller.currentStep === 2 ? (
        <OnboardingStep2Form
          initialValues={controller.formData.step2}
          onSubmit={controller.handleSubmitStep2}
          onBack={() => {
            void controller.handleReset();
          }}
        />
      ) : null}
      {controller.currentStep === 3 ? (
        <OnboardingStep3Form
          initialValues={controller.formData.step3}
          onSubmit={controller.handleSubmitStep3}
          onBack={() => {
            void controller.handleReset();
          }}
        />
      ) : null}
    </AppScreen>
  );
}

function ProgressCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title={`Passo ${controller.currentStep} de 3`}
      description="Personalize o app em poucos minutos."
    >
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        Voce pode pular agora e retomar quando quiser.
      </Paragraph>
    </AppSurfaceCard>
  );
}
