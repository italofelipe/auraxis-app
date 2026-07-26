import { useCallback, useState, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Modal, Pressable } from "react-native";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { IMPORT_FEATURE_FLAG_KEY } from "@/features/import/import-config";
import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import { useInsightSection } from "@/features/insights/hooks/use-insight-section";
import { PeriodNavigator } from "@/features/transactions/components/transaction-filters";
import {
  ExportSheet,
  FilterSheet,
  InstallmentGroupFilterNotice,
} from "@/features/transactions/components/transaction-screen-sheets";
import { TxCategoryBreakdown } from "@/features/transactions/components/tx-category-breakdown";
import { TxModeToggle } from "@/features/transactions/components/tx-mode-toggle";
import type { TransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import { useTransactionsExport } from "@/features/transactions/hooks/use-transactions-export";
import { RevealInView } from "@/shared/animations/reveal-in-view";
import { AppButton } from "@/shared/components/app-button";
import { isFeatureEnabled } from "@/shared/feature-flags";
import { useT } from "@/shared/i18n";
import {
  InsightSection,
  buildInsightFluidaParams,
} from "@/shared/insights";
import { iconSizes } from "@/shared/theme";

interface ToolbarActionProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly label: string;
  readonly color: string;
  readonly onPress: () => void;
  readonly tone?: "primary" | "secondary";
  readonly badgeColor?: string;
  readonly testID?: string;
  readonly compact?: boolean;
}

/** Ação legível da barra, com ícone e rótulo (ou overflow compacto). */
function ToolbarAction({
  icon,
  label,
  color,
  onPress,
  tone = "secondary",
  badgeColor,
  testID,
  compact = false,
}: ToolbarActionProps): ReactElement {
  return (
    <AppButton
      tone={tone}
      size="sm"
      flex={compact ? undefined : 1}
      width={compact ? 44 : undefined}
      paddingHorizontal={compact ? 0 : "$2"}
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
    >
      <XStack alignItems="center" justifyContent="center" gap="$1">
        <MaterialCommunityIcons name={icon} size={iconSizes.sm} color={color} />
        {compact ? null : (
          <Paragraph
            color={tone === "primary" ? "$actionPrimaryForeground" : "$color"}
            fontFamily="$body"
            fontSize="$2"
            fontWeight="$6"
          >
            {label}
          </Paragraph>
        )}
        {badgeColor ? (
          <YStack
            position="absolute"
            top={-3}
            right={compact ? -5 : -1}
            width={8}
            height={8}
            borderRadius="$5"
            backgroundColor={badgeColor}
          />
        ) : null}
      </XStack>
    </AppButton>
  );
}

interface FeedToolbarProps {
  readonly controller: TransactionsFeedController;
  readonly onOpenFilters: () => void;
  readonly onOpenExport: () => void;
}

/**
 * Cabeçalho do feed (rola junto com a lista): navegação de período, segmented
 * Fácil/Analítico, ações secundárias (filtros/exportar/lixeira), botão de
 * importar (se habilitado), aviso de parcelas, o painel "Gastos por categoria"
 * (modo Analítico) e o insight de IA.
 */
function FeedToolbar({
  controller,
  onOpenFilters,
  onOpenExport,
}: FeedToolbarProps): ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const importEnabled = isFeatureEnabled(IMPORT_FEATURE_FLAG_KEY);
  const insightSection = useInsightSection("transactions");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const iconColor = theme.muted?.val ?? theme.color?.val ?? "#000000";
  const badgeColor = theme.primary?.val ?? iconColor;
  const primaryIconColor =
    theme.actionPrimaryForeground?.val ?? theme.background?.val ?? "#ffffff";

  return (
    <YStack gap="$4" paddingBottom="$2">
      <PeriodNavigator
        periodLabel={controller.periodLabel}
        onPreviousMonth={controller.goToPreviousMonth}
        onNextMonth={controller.goToNextMonth}
      />
      <TxModeToggle value={controller.viewMode} onChange={controller.setViewMode} />
      <XStack gap="$2" alignItems="center" testID="transactions-action-bar">
        {importEnabled ? (
          <ToolbarAction
            icon="file-import-outline"
            label="Importar"
            color={primaryIconColor}
            tone="primary"
            testID="transactions-import-button"
            onPress={() => router.push(appRoutes.private.importTransactions)}
          />
        ) : null}
        <ToolbarAction
          icon="filter-variant"
          label="Filtrar"
          color={iconColor}
          badgeColor={controller.hasActiveFilters ? badgeColor : undefined}
          testID="transactions-filter-button"
          onPress={onOpenFilters}
        />
        <ToolbarAction
          icon="tray-arrow-up"
          label="Exportar"
          color={iconColor}
          testID="transactions-export-button"
          onPress={onOpenExport}
        />
        <ToolbarAction
          icon="dots-horizontal"
          label="Mais opções"
          color={iconColor}
          compact
          testID="transactions-options-button"
          onPress={() => setOptionsOpen(true)}
        />
      </XStack>
      <InstallmentGroupFilterNotice controller={controller} />
      {controller.viewMode === "analitico" ? (
        <RevealInView index={1}>
          <TxCategoryBreakdown categories={controller.categoryBars} />
        </RevealInView>
      ) : null}
      <InsightSection
        vm={insightSection}
        onReadFull={() => router.push(buildInsightFluidaParams("transactions"))}
      />
      <AiInsightSurface dimension="transactions" />
      <Modal
        visible={optionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsOpen(false)}
      >
        <YStack
          flex={1}
          backgroundColor="rgba(0,0,0,0.35)"
          justifyContent="flex-end"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar opções"
            onPress={() => setOptionsOpen(false)}
            style={{ flex: 1 }}
          />
          <YStack
            backgroundColor="$background"
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            padding="$5"
            gap="$4"
            testID="transactions-options-sheet"
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Paragraph fontFamily="$heading" fontSize="$5" fontWeight="$7">
                Opções de transações
              </Paragraph>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar opções"
                onPress={() => setOptionsOpen(false)}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={iconSizes.lg}
                  color={iconColor}
                />
              </Pressable>
            </XStack>
            <AppButton
              tone="danger"
              testID="transactions-trash-button"
              onPress={() => {
                setOptionsOpen(false);
                router.push(appRoutes.private.transactionsTrash);
              }}
            >
              Abrir lixeira
            </AppButton>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
  );
}

/** Props do cabeçalho do feed com os sheets de filtro/exportação. */
export interface TransactionFeedToolbarProps {
  readonly controller: TransactionsFeedController;
  readonly filterOpen: boolean;
  readonly setFilterOpen: (open: boolean) => void;
  readonly exportOpen: boolean;
  readonly setExportOpen: (open: boolean) => void;
}

/**
 * Cabeçalho do feed + os sheets de filtro/exportação. Mantém o fluxo de
 * exportação (CSV/PDF) e os controles de filtro existentes — só a fonte do
 * controller mudou para o feed.
 *
 * @param props Controller do feed e o estado de abertura dos sheets.
 * @returns Cabeçalho do feed com os modais.
 */
export function TransactionFeedToolbar({
  controller,
  filterOpen,
  setFilterOpen,
  exportOpen,
  setExportOpen,
}: TransactionFeedToolbarProps): ReactElement {
  const { t } = useT();
  const exportRunner = useTransactionsExport();

  const handleExportFormat = useCallback(
    async (format: "csv" | "pdf"): Promise<void> => {
      await exportRunner.exportNow({ format });
      setExportOpen(false);
    },
    [exportRunner, setExportOpen],
  );

  return (
    <>
      <FeedToolbar
        controller={controller}
        onOpenFilters={() => setFilterOpen(true)}
        onOpenExport={() => setExportOpen(true)}
      />
      <FilterSheet
        visible={filterOpen}
        controller={controller}
        onClose={() => setFilterOpen(false)}
      />
      <Modal
        visible={exportOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setExportOpen(false)}
      >
        <ExportSheet
          onClose={() => setExportOpen(false)}
          onExport={handleExportFormat}
          isExporting={exportRunner.isExporting}
          error={exportRunner.error}
          dismissError={exportRunner.dismissError}
          translate={t}
        />
      </Modal>
    </>
  );
}
