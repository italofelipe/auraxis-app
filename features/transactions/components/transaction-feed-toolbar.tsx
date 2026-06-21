import { useCallback, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Modal, Pressable } from "react-native";
import { YStack, useTheme } from "tamagui";

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

interface ToolbarButtonProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly accessibilityLabel: string;
  readonly color: string;
  readonly onPress: () => void;
  readonly badgeColor?: string;
  readonly testID?: string;
}

/** Botão só-ícone (44×44) da barra de ferramentas, com dot opcional. */
function ToolbarButton({
  icon,
  accessibilityLabel,
  color,
  onPress,
  badgeColor,
  testID,
}: ToolbarButtonProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
    >
      <MaterialCommunityIcons name={icon} size={iconSizes.lg} color={color} />
      {badgeColor ? (
        <YStack
          position="absolute"
          top={9}
          right={9}
          width={9}
          height={9}
          borderRadius="$5"
          backgroundColor={badgeColor}
        />
      ) : null}
    </Pressable>
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
  const iconColor = theme.muted?.val ?? theme.color?.val ?? "#000000";
  const badgeColor = theme.primary?.val ?? iconColor;

  return (
    <YStack gap="$4" paddingBottom="$2">
      <PeriodNavigator
        periodLabel={controller.periodLabel}
        onPreviousMonth={controller.goToPreviousMonth}
        onNextMonth={controller.goToNextMonth}
      />
      <TxModeToggle value={controller.viewMode} onChange={controller.setViewMode} />
      <YStack alignItems="flex-end">
        <YStack flexDirection="row">
          <ToolbarButton
            icon="filter-variant"
            accessibilityLabel="Filtros"
            color={iconColor}
            badgeColor={controller.hasActiveFilters ? badgeColor : undefined}
            testID="transactions-filter-button"
            onPress={onOpenFilters}
          />
          <ToolbarButton
            icon="tray-arrow-up"
            accessibilityLabel="Exportar"
            color={iconColor}
            testID="transactions-export-button"
            onPress={onOpenExport}
          />
          <ToolbarButton
            icon="trash-can-outline"
            accessibilityLabel="Lixeira de transações"
            color={iconColor}
            testID="transactions-trash-button"
            onPress={() => router.push(appRoutes.private.transactionsTrash)}
          />
        </YStack>
      </YStack>
      {importEnabled ? (
        <AppButton
          tone="secondary"
          size="sm"
          onPress={() => router.push(appRoutes.private.importTransactions)}
        >
          Importar planilha
        </AppButton>
      ) : null}
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
