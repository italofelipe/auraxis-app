import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { TagForm } from "@/features/tags/components/tag-form";
import type { Tag } from "@/features/tags/contracts";
import {
  useTagsScreenController,
  type TagsScreenController,
} from "@/features/tags/hooks/use-tags-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function TagsScreen(): ReactElement {
  const controller = useTagsScreenController();

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <TagForm
          initialTag={
            controller.formMode.kind === "edit" ? controller.formMode.tag : null
          }
          isSubmitting={controller.isSubmitting}
          submitError={controller.submitError}
          onSubmit={controller.handleSubmit}
          onCancel={controller.handleCloseForm}
          onDismissError={controller.dismissSubmitError}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SummaryCard controller={controller} />
      <TagsListCard controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: TagsScreenController;
}

function SummaryCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Tags"
      description="Categorias para classificar transacoes e orcamentos."
    >
      <YStack gap="$3">
        <AppButton onPress={controller.handleOpenCreate}>Nova tag</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function TagsListCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Lista de tags"
      description="Tags ativas para o usuario."
    >
      <AppQueryState
        query={controller.tagsQuery}
        options={{
          loading: {
            title: "Carregando tags",
            description: "Buscando categorias registradas.",
          },
          empty: {
            title: "Nenhuma tag registrada",
            description: "Crie a primeira tag para classificar transacoes.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar as tags",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.tags.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                isDeleting={controller.deletingTagId === tag.id}
                onEdit={() => controller.handleOpenEdit(tag)}
                onDelete={() => {
                  void controller.handleDelete(tag.id);
                }}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface TagRowProps {
  readonly tag: Tag;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function TagRow({ tag, isDeleting, onEdit, onDelete }: TagRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={tag.name}
        value={
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {tag.color ?? "sem cor"}
          </Paragraph>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={onEdit} disabled={isDeleting}>
          Editar
        </AppButton>
        <AppButton tone="secondary" onPress={onDelete} disabled={isDeleting}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
