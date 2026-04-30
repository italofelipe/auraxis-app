import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { useRouter } from "expo-router";

import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import {
  CalculatorForm,
  type FieldDescriptor,
} from "@/features/tools/components/calculator-form";
import {
  CalculatorResultCard,
  type CalculatorMetric,
} from "@/features/tools/components/calculator-result-card";
import {
  useCalculatorController,
  type CalculatorSpec,
} from "@/features/tools/hooks/use-calculator-controller";

export interface CalculatorScreenProps<
  TForm extends Record<string, unknown>,
  TResult extends object,
> {
  readonly title: string;
  readonly subtitle: string;
  readonly testID: string;
  readonly spec: CalculatorSpec<TForm, TResult>;
  readonly fields: readonly FieldDescriptor<TForm>[];
  readonly buildMetrics: (
    form: TForm,
    result: TResult,
  ) => readonly CalculatorMetric[];
  readonly resultTitle?: string;
  readonly resultDescription?: string;
  readonly resultFooter?: (form: TForm, result: TResult) => string | undefined;
  readonly formCardTitle?: string;
  readonly formCardDescription?: string;
}

/**
 * Generic screen factory used by every salary-and-work calculator. Each
 * concrete tool screen wires its spec, field descriptors and metric
 * mapper; this component owns the layout, the controller hook, the
 * form, the result panel and the back button.
 *
 * @param props Configuration for one calculator screen.
 * @returns The screen view.
 */
export function CalculatorScreen<
  TForm extends Record<string, unknown>,
  TResult extends object,
>(props: CalculatorScreenProps<TForm, TResult>): ReactElement {
  const controller = useCalculatorController(props.spec);
  const router = useRouter();
  const result = controller.result;
  return (
    <AppScreen testID={props.testID}>
      <Header title={props.title} subtitle={props.subtitle} onBack={() => router.back()} />
      <AppSurfaceCard
        title={props.formCardTitle ?? "Configure o cenário"}
        description={props.formCardDescription}
      >
        <CalculatorForm
          draft={controller.draft}
          errors={controller.errors}
          fields={props.fields}
          onChange={controller.setField}
          onSubmit={controller.handleCalculate}
          onReset={controller.handleReset}
        />
      </AppSurfaceCard>
      {controller.saveError !== null ? (
        <AppErrorNotice
          error={controller.saveError}
          fallbackTitle="Não foi possível salvar"
          fallbackDescription="Confira a conexão e tente novamente."
        />
      ) : null}
      {result !== null ? (
        <CalculatorResultCard
          title={props.resultTitle ?? "Resultado"}
          description={props.resultDescription}
          metrics={props.buildMetrics(controller.draft, result)}
          footer={props.resultFooter?.(controller.draft, result)}
          isSaving={controller.isSaving}
          isSaved={controller.savedSimulationId !== null}
          onSave={() => {
            void controller.handleSave();
          }}
        />
      ) : null}
    </AppScreen>
  );
}

interface HeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly onBack: () => void;
}

function Header({ title, subtitle, onBack }: HeaderProps): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <YStack gap="$1" flex={1}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          {title}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {subtitle}
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}
