import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { useToolsScreenController } from "@/features/tools/hooks/use-tools-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

/**
 * Canonical tools catalog screen for the mobile app.
 *
 * @returns Catalog composition bound to the tools controller.
 */
export function ToolsScreen(): ReactElement {
  const controller = useToolsScreenController();
  const toolsCatalogQuery = controller.toolsCatalogQuery;
  const tools = toolsCatalogQuery.data?.tools ?? [];

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Ferramentas"
        description="Fluxos administrativos e utilitarios para simular cenarios e ganhar clareza financeira.">
        {toolsCatalogQuery.isPending ? (
          <AsyncStateNotice
            kind="loading"
            title="Carregando ferramentas"
            description="Preparando o catalogo com as opcoes disponiveis para o seu plano."
          />
        ) : null}

        {toolsCatalogQuery.isError ? (
          <AsyncStateNotice
            kind="error"
            title="Nao foi possivel carregar agora"
            description="Tente novamente em instantes para visualizar o catalogo mais recente."
          />
        ) : null}

        {!toolsCatalogQuery.isPending && !toolsCatalogQuery.isError && tools.length === 0 ? (
          <AsyncStateNotice
            kind="empty"
            title="Nenhuma ferramenta disponivel"
            description="Novas simulacoes vao aparecer aqui assim que forem liberadas."
          />
        ) : null}

        {!toolsCatalogQuery.isPending && !toolsCatalogQuery.isError && tools.length > 0 ? (
          <YStack gap="$3">
            {tools.map((tool) => (
              <AppSurfaceCard
                key={tool.id}
                backgroundColor="$surfaceRaised"
                borderColor={tool.enabled ? "$secondary" : "$borderColor"}
                title={tool.name}
                description={tool.description}>
                <XStack alignItems="center" justifyContent="space-between">
                  <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
                    {tool.enabled ? "Disponivel agora" : "Em planejamento"}
                  </Paragraph>
                  <Paragraph
                    color={tool.enabled ? "$secondary" : "$muted"}
                    fontFamily="$body"
                    fontSize="$2">
                    {tool.enabled ? "Ativa" : "Bloqueada"}
                  </Paragraph>
                </XStack>
                {tool.enabled ? (
                  <AppButton
                    tone="secondary"
                    onPress={() => {
                      void controller.handleOpenTool(tool.id);
                    }}>
                    Abrir simulador
                  </AppButton>
                ) : null}
              </AppSurfaceCard>
            ))}
          </YStack>
        ) : null}
      </AppSurfaceCard>
    </AppScreen>
  );
}
