import { useState, type ReactElement, type ReactNode } from "react";

import { Paragraph, YStack } from "tamagui";

import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppMetricCard } from "@/shared/components/app-metric-card";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSkeletonBlock } from "@/shared/components/app-skeleton-block";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export const DEV_COMPONENT_CATALOG_TEST_ID = "dev-component-catalog";

interface DevSectionProps {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}

function DevSection({
  title,
  description,
  children,
}: DevSectionProps): ReactElement {
  return (
    <AppSurfaceCard title={title} description={description}>
      <YStack gap="$3">{children}</YStack>
    </AppSurfaceCard>
  );
}

function ButtonStories(): ReactElement {
  return (
    <DevSection
      title="AppButton"
      description="Tons primary, secondary, danger; estados hover/pressed via Tamagui."
    >
      <AppButton onPress={() => undefined}>Primary</AppButton>
      <AppButton tone="secondary" onPress={() => undefined}>
        Secondary
      </AppButton>
      <AppButton tone="danger" onPress={() => undefined}>
        Danger
      </AppButton>
      <AppButton onPress={() => undefined} disabled>
        Disabled
      </AppButton>
    </DevSection>
  );
}

function InputFieldStories(): ReactElement {
  const [value, setValue] = useState("");
  return (
    <DevSection
      title="AppInputField"
      description="Helper, errorText, label e variantes de teclado."
    >
      <AppInputField
        id="dev-input-default"
        label="Default"
        placeholder="Digite alguma coisa"
        value={value}
        onChangeText={setValue}
      />
      <AppInputField
        id="dev-input-helper"
        label="Com helper"
        helperText="Texto auxiliar para orientar o preenchimento."
        placeholder="exemplo@auraxis.com.br"
      />
      <AppInputField
        id="dev-input-error"
        label="Com erro"
        errorText="Campo obrigatorio."
        placeholder="0,00"
      />
      <AppInputField
        id="dev-input-numeric"
        label="Numerico (decimal)"
        keyboardType="decimal-pad"
        placeholder="0,00"
      />
    </DevSection>
  );
}

function MetricCardStories(): ReactElement {
  return (
    <DevSection
      title="AppMetricCard"
      description="Tons default, primary, danger; com helper opcional."
    >
      <AppMetricCard
        label="Patrimonio total"
        value="R$ 124.378,51"
        helper="Atualizado agora"
      />
      <AppMetricCard
        label="Rendimento mensal"
        value="+R$ 2.180,00"
        tone="primary"
      />
      <AppMetricCard
        label="Atraso da meta"
        value="3 meses"
        tone="danger"
        helper="Aporte abaixo do necessario."
      />
    </DevSection>
  );
}

function EmptyStateStories(): ReactElement {
  return (
    <DevSection
      title="AppEmptyState"
      description="Pictograma + copy + CTA opcional. Ilustracoes da paleta MaterialCommunityIcons."
    >
      <AppEmptyState
        illustration="wallet"
        title="Sua carteira esta vazia"
        description="Adicione seus primeiros ativos para acompanhar evolucao patrimonial."
        cta={{ label: "Adicionar ativo", onPress: () => undefined }}
      />
      <AppEmptyState
        illustration="goals"
        title="Sem metas registradas"
        description="Crie sua primeira meta para comecar a planejar."
      />
    </DevSection>
  );
}

function SkeletonBlockStories(): ReactElement {
  return (
    <DevSection
      title="AppSkeletonBlock"
      description="Placeholder com 1..N linhas e cabecalho opcional."
    >
      <AppSkeletonBlock title="Carregando carteira" lines={3} />
      <AppSkeletonBlock lines={5} />
    </DevSection>
  );
}

const STORY_SECTIONS: readonly (() => ReactElement)[] = [
  ButtonStories,
  InputFieldStories,
  MetricCardStories,
  EmptyStateStories,
  SkeletonBlockStories,
];

/**
 * In-app component catalog (dev only).
 *
 * Reachable via Expo Router at `auraxisapp:///_dev/components` — kept
 * out of production by gating the render path on `__DEV__`. Aimed at
 * design review and visual smoke-tests in isolation, replacing the
 * heavier `@storybook/react-native` setup considered for #294.
 */
export default function DevComponentsScreen(): ReactElement {
  if (!__DEV__) {
    return (
      <AppScreen testID={DEV_COMPONENT_CATALOG_TEST_ID}>
        <AppSurfaceCard
          title="Catalogo nao disponivel"
          description="Esta tela so existe em builds de desenvolvimento."
        >
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Volte ao app pelo botao do sistema.
          </Paragraph>
        </AppSurfaceCard>
      </AppScreen>
    );
  }
  return (
    <AppScreen testID={DEV_COMPONENT_CATALOG_TEST_ID}>
      <YStack gap="$2">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          Component catalog
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Galeria interna dos primitivos compartilhados. Apenas dev.
        </Paragraph>
      </YStack>
      {STORY_SECTIONS.map((Section, index) => (
        <Section key={`dev-section-${index}`} />
      ))}
    </AppScreen>
  );
}
