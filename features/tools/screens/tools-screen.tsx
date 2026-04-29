import type { ReactElement } from "react";

import { Pressable } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import type { ToolDefinition } from "@/features/tools/contracts";
import {
  useToolsScreenController,
  type ToolsCategorySection,
  type ToolsScreenController,
} from "@/features/tools/hooks/use-tools-screen-controller";
import { TOOL_CATEGORY_LABELS } from "@/features/tools/services/tools-catalog";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppFormMessage } from "@/shared/components/app-form-message";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

/**
 * Tools hub: search bar, categorised cards (60+ entries with "Em breve" badges)
 * and a CTA into the simulations history.
 */
export function ToolsScreen(): ReactElement {
  const controller = useToolsScreenController();
  return (
    <AppScreen>
      <HeaderCard controller={controller} />
      <CatalogBody controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: ToolsScreenController;
}

function HeaderCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Ferramentas"
      description="Catálogo de simuladores e calculadoras para te ajudar a decidir."
    >
      <YStack gap="$3">
        <AppInputField
          id="tools-search"
          label="Buscar ferramenta"
          placeholder="Ex: salário, financiamento, juros…"
          autoCorrect={false}
          autoCapitalize="none"
          value={controller.searchTerm}
          onChangeText={controller.handleSearchChange}
        />
        <AppButton
          tone="secondary"
          onPress={controller.handleOpenSimulationsHistory}
          testID="tools-open-simulations-history"
        >
          Ver simulações salvas
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function CatalogBody({ controller }: ControllerProps): ReactElement {
  return (
    <AppQueryState
      query={controller.toolsCatalogQuery}
      options={{
        loading: {
          title: "Carregando ferramentas",
          description: "Preparando o catálogo.",
        },
        empty: {
          title: "Nenhuma ferramenta disponível",
          description: "Novas ferramentas chegam por aqui.",
        },
        error: {
          fallbackTitle: "Não foi possível carregar agora",
          fallbackDescription: "Tente novamente em instantes.",
        },
        isEmpty: (data) => data.tools.length === 0,
      }}
    >
      {() => <CatalogSections controller={controller} />}
    </AppQueryState>
  );
}

function CatalogSections({ controller }: ControllerProps): ReactElement {
  if (controller.emptyResults) {
    return (
      <AppEmptyState
        illustration="wallet"
        title="Nada encontrado para essa busca"
        description="Tente outros termos ou veja todas as ferramentas removendo o filtro."
      />
    );
  }
  return (
    <YStack gap="$4">
      {controller.visibleSections.map((section) => (
        <CategorySection
          key={section.category}
          section={section}
          onOpenTool={controller.handleOpenTool}
        />
      ))}
    </YStack>
  );
}

interface CategorySectionProps {
  readonly section: ToolsCategorySection;
  readonly onOpenTool: (tool: ToolDefinition) => void;
}

function CategorySection({
  section,
  onOpenTool,
}: CategorySectionProps): ReactElement {
  return (
    <AppSurfaceCard title={TOOL_CATEGORY_LABELS[section.category]}>
      <YStack gap="$3">
        {section.tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} onOpen={onOpenTool} />
        ))}
      </YStack>
    </AppSurfaceCard>
  );
}

interface ToolCardProps {
  readonly tool: ToolDefinition;
  readonly onOpen: (tool: ToolDefinition) => void;
}

function ToolCard({ tool, onOpen }: ToolCardProps): ReactElement {
  const handlePress = (): void => {
    if (tool.enabled) {
      onOpen(tool);
    }
  };
  return (
    <Pressable
      onPress={handlePress}
      disabled={!tool.enabled}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ferramenta ${tool.name}`}
      accessibilityState={{ disabled: !tool.enabled }}
      testID={`tool-card-${tool.id}`}
    >
      <YStack
        backgroundColor="$surfaceRaised"
        borderColor={tool.enabled ? "$secondary" : "$borderColor"}
        borderWidth={1}
        borderRadius="$2"
        padding="$3"
        gap="$2"
        opacity={tool.enabled ? 1 : 0.6}
      >
        <XStack alignItems="center" justifyContent="space-between" gap="$2">
          <Paragraph color="$color" fontFamily="$heading" fontSize="$5" flex={1}>
            {tool.name}
          </Paragraph>
          <ToolBadges tool={tool} />
        </XStack>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {tool.description}
        </Paragraph>
        {tool.enabled ? (
          <AppFormMessage tone="muted" text="Disponível agora — toque para abrir." />
        ) : null}
      </YStack>
    </Pressable>
  );
}

function ToolBadges({ tool }: { readonly tool: ToolDefinition }): ReactElement {
  return (
    <XStack gap="$2">
      {tool.requiresPremium ? <AppBadge tone="primary">Premium</AppBadge> : null}
      {tool.enabled ? null : <AppBadge>Em breve</AppBadge>}
    </XStack>
  );
}
