import { useCallback, type ReactElement } from "react";

import { useRouter } from "expo-router";
import { FlatList, Modal, Pressable } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { createAppErrorState } from "@/core/errors/app-error";
import { appRoutes } from "@/core/navigation/routes";
import type {
  ImportMappingFieldKey,
  ImportMappingFieldViewModel,
  ImportTransactionDraft,
} from "@/features/import/contracts";
import {
  useImportScreenController,
  type ImportScreenController,
} from "@/features/import/hooks/use-import-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatShortDate } from "@/shared/utils/formatters";

const listContainerStyle = { paddingBottom: 96 } as const;

const formatAmount = (transaction: ImportTransactionDraft): string => {
  const prefix = transaction.type === "income" ? "+" : "-";
  return `${prefix} R$ ${transaction.amount}`;
};

const transactionKey = (item: ImportTransactionDraft): string => item.id;

function Separator(): ReactElement {
  return <YStack height="$2" />;
}

export function ImportScreen(): ReactElement {
  const controller = useImportScreenController();

  return (
    <AppScreen scrollable={controller.phase !== "preview"}>
      <YStack gap="$3" flex={1}>
        <HeaderCard controller={controller} />
        <ImportErrorFeedback controller={controller} />
        {controller.phase === "select" ? <SelectStep controller={controller} /> : null}
        {controller.phase === "mapping" ? (
          <MappingSheet controller={controller} />
        ) : null}
        {controller.phase === "preview" ? (
          <PreviewStep controller={controller} />
        ) : null}
        {controller.phase === "success" ? (
          <SuccessStep controller={controller} />
        ) : null}
      </YStack>
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: ImportScreenController;
}

function ImportErrorFeedback({ controller }: ControllerProps): ReactElement | null {
  if (!controller.error) {
    return null;
  }

  const errorState = createAppErrorState(controller.error, {
    fallbackTitle: "Nao foi possivel importar a planilha",
    fallbackDescription: "Revise o arquivo e tente novamente.",
  });

  if (errorState.status === 429) {
    return <UpgradeLimitSheet onClose={controller.dismissError} />;
  }

  if (errorState.status === 422) {
    return (
      <AppErrorNotice
        error={controller.error}
        fallbackTitle="Preview expirado"
        fallbackDescription="Faca o upload novamente para gerar uma nova previa."
        actionLabel="Enviar novamente"
        onAction={controller.handleReset}
        secondaryActionLabel="Fechar aviso"
        onSecondaryAction={controller.dismissError}
      />
    );
  }

  return (
    <AppErrorNotice
      error={controller.error}
      fallbackTitle="Nao foi possivel importar a planilha"
      fallbackDescription="Revise o arquivo e tente novamente."
      actionLabel="Fechar aviso"
      onAction={controller.dismissError}
    />
  );
}

interface UpgradeLimitSheetProps {
  readonly onClose: () => void;
}

function UpgradeLimitSheet({ onClose }: UpgradeLimitSheetProps): ReactElement {
  const router = useRouter();
  const handleUpgrade = useCallback(() => {
    onClose();
    router.push(appRoutes.private.subscription);
  }, [onClose, router]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
        <YStack
          backgroundColor="$background"
          padding="$4"
          gap="$3"
          borderTopLeftRadius="$3"
          borderTopRightRadius="$3"
        >
          <AppSurfaceCard
            title="Limite gratuito atingido"
            description="Voce atingiu o limite de 3 importacoes gratuitas. Faca upgrade para importar sem limites."
          >
            <YStack gap="$3">
              <AppButton onPress={handleUpgrade}>Assinar Premium</AppButton>
              <AppButton tone="secondary" onPress={onClose}>
                Fechar
              </AppButton>
            </YStack>
          </AppSurfaceCard>
        </YStack>
      </YStack>
    </Modal>
  );
}

function HeaderCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Importar planilha"
      description="Traga transacoes de arquivos CSV ou XLSX com revisao antes de salvar."
    >
      <YStack gap="$2">
        {controller.file ? (
          <AppKeyValueRow label="Arquivo" value={controller.file.name} />
        ) : null}
        <Paragraph color="$mutedColor">
          O Auraxis detecta colunas, mostra duplicatas e so confirma o que voce
          mantiver selecionado.
        </Paragraph>
      </YStack>
    </AppSurfaceCard>
  );
}

function SelectStep({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Selecione o arquivo"
      description="Use um CSV ou XLSX com colunas de data, descricao, valor e tipo."
    >
      <YStack gap="$3">
        <Paragraph color="$mutedColor">
          Arquivos ficam em cache local durante o fluxo e sao enviados para o
          backend apenas para detectar, gerar preview e confirmar.
        </Paragraph>
        <AppButton
          onPress={() => {
            void controller.handlePickFile();
          }}
          disabled={controller.isBusy}
        >
          {controller.isBusy ? "Detectando colunas..." : "Selecionar planilha"}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function MappingSheet({ controller }: ControllerProps): ReactElement {
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={controller.handleCancelMapping}
    >
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
        <YStack
          backgroundColor="$background"
          padding="$4"
          gap="$3"
          borderTopLeftRadius="$3"
          borderTopRightRadius="$3"
        >
          <MappingStep controller={controller} />
        </YStack>
      </YStack>
    </Modal>
  );
}

function MappingStep({ controller }: ControllerProps): ReactElement | null {
  const field = controller.currentMappingField;
  if (!field || !controller.detectResult) {
    return null;
  }

  const isFirst = controller.currentMappingIndex === 0;
  const isLast = controller.currentMappingIndex === controller.mappingFields.length - 1;

  return (
    <AppSurfaceCard
      title="Mapear colunas"
      description={`Passo ${controller.currentMappingIndex + 1} de ${
        controller.mappingFields.length
      }`}
    >
      <YStack gap="$3">
        <Paragraph fontWeight="700">
          Passo {controller.currentMappingIndex + 1} de{" "}
          {controller.mappingFields.length}
        </Paragraph>
        <MappingField
          field={field}
          headers={controller.detectResult.headers}
          onChange={controller.handleMappingChange}
        />
        <XStack gap="$2">
          <AppButton
            flex={1}
            tone="secondary"
            onPress={isFirst ? controller.handleCancelMapping : controller.handlePreviousMappingField}
          >
            {isFirst ? "Cancelar" : "Voltar"}
          </AppButton>
          <AppButton
            flex={1}
            onPress={isLast ? () => {
              void controller.handleConfirmMapping();
            } : controller.handleNextMappingField}
            disabled={controller.isBusy}
          >
            {isLast
              ? controller.isBusy
                ? "Gerando preview..."
                : "Confirmar campos"
              : "Proximo"}
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}

interface MappingFieldProps {
  readonly field: ImportMappingFieldViewModel;
  readonly headers: readonly string[];
  readonly onChange: (field: ImportMappingFieldKey, value: string) => void;
}

function MappingField({
  field,
  headers,
  onChange,
}: MappingFieldProps): ReactElement {
  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2" flexWrap="wrap">
        <Paragraph fontWeight="700">{field.label}</Paragraph>
        <AppBadge>{Math.round(field.confidence * 100)}% confianca</AppBadge>
      </XStack>
      <YStack gap="$2">
        {headers.map((header) => (
          <AppButton
            key={header}
            tone={field.value === header ? "primary" : "secondary"}
            onPress={() => onChange(field.key, header)}
            accessibilityState={{ selected: field.value === header }}
          >
            {header}
          </AppButton>
        ))}
      </YStack>
      <YStack gap="$1">
        <Paragraph color="$mutedColor">Preview da coluna selecionada</Paragraph>
        {field.sampleValues.length > 0 ? (
          field.sampleValues.map((value) => (
            <Paragraph key={value}>• {value}</Paragraph>
          ))
        ) : (
          <Paragraph>Nenhum valor de amostra.</Paragraph>
        )}
      </YStack>
    </YStack>
  );
}

function PreviewStep({ controller }: ControllerProps): ReactElement | null {
  const renderItem = useCallback(
    ({ item }: { readonly item: ImportTransactionDraft }) => (
      <TransactionPreviewRow
        transaction={item}
        selected={controller.isTransactionSelected(item.id)}
        onToggle={controller.handleToggleTransaction}
      />
    ),
    [controller],
  );
  const preview = controller.preview;
  if (!preview) {
    return null;
  }

  return (
    <YStack flex={1} gap="$3">
      <AppSurfaceCard
        title="Revisar transacoes"
        description={`Importar ${controller.selectedImportCount} de ${controller.totalPreviewCount} transacoes`}
      >
        <YStack gap="$3">
          {controller.duplicateCount > 0 ? (
            <AppBadge tone="danger">
              {controller.duplicateCount} possivel duplicata
            </AppBadge>
          ) : null}
          <Paragraph>
            Importar {controller.selectedImportCount} de{" "}
            {controller.totalPreviewCount} transacoes
          </Paragraph>
          <XStack gap="$2">
            <AppButton flex={1} tone="secondary" onPress={controller.handleReset}>
              Voltar
            </AppButton>
            <AppButton
              flex={1}
              disabled={controller.isBusy || controller.selectedImportCount === 0}
              onPress={() => {
                void controller.handleConfirmImport();
              }}
            >
              {controller.isBusy ? "Confirmando..." : "Confirmar importacao"}
            </AppButton>
          </XStack>
        </YStack>
      </AppSurfaceCard>
      <YStack flex={1} minHeight={320}>
        <FlatList
          data={preview.transactions}
          keyExtractor={transactionKey}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={listContainerStyle}
          testID="import-preview-list"
        />
      </YStack>
    </YStack>
  );
}

interface TransactionPreviewRowProps {
  readonly transaction: ImportTransactionDraft;
  readonly selected: boolean;
  readonly onToggle: (transactionId: string) => void;
}

function TransactionPreviewRow({
  transaction,
  selected,
  onToggle,
}: TransactionPreviewRowProps): ReactElement {
  const handleToggle = useCallback(
    () => onToggle(transaction.id),
    [onToggle, transaction.id],
  );
  const tone = transaction.type === "income" ? "primary" : "danger";

  return (
    <Pressable
      onPress={handleToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      testID={`import-transaction-toggle-${transaction.id}`}
    >
      <AppSurfaceCard>
        <YStack gap="$2">
          <XStack justifyContent="space-between" gap="$3">
            <YStack flex={1}>
              <Paragraph fontWeight="700">{transaction.description}</Paragraph>
              <Paragraph color="$mutedColor">
                {formatShortDate(transaction.date)}
              </Paragraph>
            </YStack>
            <Paragraph fontWeight="700">{formatAmount(transaction)}</Paragraph>
          </XStack>
          <XStack gap="$2" flexWrap="wrap">
            <AppBadge tone={tone}>{transaction.category ?? "Sem categoria"}</AppBadge>
            {transaction.isDuplicate ? (
              <AppBadge tone="danger">Possivel duplicata</AppBadge>
            ) : null}
            <AppBadge>{selected ? "Selecionada" : "Ignorada"}</AppBadge>
          </XStack>
        </YStack>
      </AppSurfaceCard>
    </Pressable>
  );
}

function SuccessStep({ controller }: ControllerProps): ReactElement {
  const router = useRouter();
  const handleOpenDashboard = useCallback(() => {
    router.push(appRoutes.private.dashboard);
  }, [router]);

  return (
    <AppSurfaceCard
      title="Importacao concluida"
      description="As transacoes selecionadas foram enviadas para sua lista."
    >
      <YStack gap="$3">
        {controller.confirmationResult ? (
          <>
            <AppKeyValueRow
              label="Importadas"
              value={String(controller.confirmationResult.importedCount)}
            />
            <AppKeyValueRow
              label="Ignoradas"
              value={String(controller.confirmationResult.skippedCount)}
            />
          </>
        ) : null}
        <XStack gap="$2">
          <AppButton flex={1} onPress={handleOpenDashboard}>
            Ver no dashboard
          </AppButton>
          <AppButton flex={1} tone="secondary" onPress={controller.handleReset}>
            Importar outra
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}
