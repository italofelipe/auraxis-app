import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { TransactionBottomSheet } from "@/features/transactions/components/transaction-bottom-sheet";
import { TransactionFilterControls } from "@/features/transactions/components/transaction-filters";
import type { TransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

/** Props compartilhadas que recebem o controller do feed. */
export interface FeedControllerProps {
  readonly controller: TransactionsFeedController;
}

/** Props do bottom sheet de filtros. */
export interface FilterSheetProps extends FeedControllerProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

/**
 * Bottom sheet com os controles de filtro (tipo/status/tag) — reusa os
 * controles existentes; só muda a fonte do controller (feed).
 *
 * @param props Visibilidade, controller e handler de fechar.
 * @returns Sheet de filtros.
 */
export function FilterSheet({
  visible,
  controller,
  onClose,
}: FilterSheetProps): ReactElement {
  return (
    <TransactionBottomSheet
      visible={visible}
      onClose={onClose}
      testID="transaction-filter-sheet"
    >
      <Paragraph fontFamily="$body" fontWeight="$7" fontSize="$5" color="$color">
        Filtros
      </Paragraph>
      <TransactionFilterControls
        typeFilter={controller.typeFilter}
        onTypeFilterChange={controller.setTypeFilter}
        statusFilter={controller.statusFilter}
        onStatusFilterChange={controller.setStatusFilter}
        tagFilter={controller.tagFilter}
        onTagFilterChange={controller.setTagFilter}
        onClearFilters={controller.clearFilters}
      />
      <AppButton onPress={onClose}>Aplicar</AppButton>
    </TransactionBottomSheet>
  );
}

/** Aviso de filtro por grupo de parcelas ("mesma compra"). */
export function InstallmentGroupFilterNotice({
  controller,
}: FeedControllerProps): ReactElement | null {
  if (!controller.installmentGroupFilter) {
    return null;
  }
  return (
    <XStack alignItems="center" gap="$2">
      <Paragraph color="$muted" flex={1} fontFamily="$body" fontSize="$2">
        Mostrando parcelas da mesma compra.
      </Paragraph>
      <AppButton
        tone="secondary"
        size="sm"
        onPress={controller.handleClearInstallmentGroupFilter}
      >
        Mostrar todas
      </AppButton>
    </XStack>
  );
}

/** Props do sheet de exportação. */
export interface ExportSheetProps {
  readonly onClose: () => void;
  readonly onExport: (format: "csv" | "pdf") => Promise<void>;
  readonly isExporting: boolean;
  readonly error: unknown | null;
  readonly dismissError: () => void;
  readonly translate: (key: string) => string;
}

/**
 * Sheet de exportação (CSV/PDF) — preserva o fluxo existente de export.
 *
 * @param props Handlers, estado de export e tradutor.
 * @returns Sheet de exportação.
 */
export function ExportSheet({
  onClose,
  onExport,
  isExporting,
  error,
  dismissError,
  translate,
}: ExportSheetProps): ReactElement {
  return (
    <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" justifyContent="flex-end">
      <YStack
        backgroundColor="$background"
        padding="$4"
        gap="$3"
        borderTopLeftRadius="$3"
        borderTopRightRadius="$3"
      >
        <AppSurfaceCard
          title={translate("transactions.export.title")}
          description={translate("transactions.export.description")}
        >
          <YStack gap="$3">
            <XStack gap="$2">
              <AppButton
                flex={1}
                onPress={() => {
                  void onExport("csv");
                }}
                disabled={isExporting}
              >
                {translate("transactions.export.csv")}
              </AppButton>
              <AppButton
                flex={1}
                onPress={() => {
                  void onExport("pdf");
                }}
                disabled={isExporting}
              >
                {translate("transactions.export.pdf")}
              </AppButton>
            </XStack>
            {isExporting ? (
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                {translate("transactions.export.submitting")}
              </Paragraph>
            ) : null}
            {error ? (
              <AppErrorNotice
                error={error}
                fallbackTitle={translate("transactions.export.errorTitle")}
                fallbackDescription={translate(
                  "transactions.export.errorDescription",
                )}
                secondaryActionLabel="Fechar"
                onSecondaryAction={dismissError}
              />
            ) : null}
            <AppButton tone="secondary" onPress={onClose}>
              Fechar
            </AppButton>
          </YStack>
        </AppSurfaceCard>
      </YStack>
    </YStack>
  );
}
