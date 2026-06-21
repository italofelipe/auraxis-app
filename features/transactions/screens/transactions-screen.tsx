import type { ReactElement } from "react";

import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { FinancialCalendar } from "@/features/transactions/components/financial-calendar";
import { PeriodNavigator } from "@/features/transactions/components/transaction-filters";
import { TransactionFeed } from "@/features/transactions/components/transaction-feed-list";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { TxHero } from "@/features/transactions/components/tx-hero";
import { useTransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import { RevealInView } from "@/shared/animations/reveal-in-view";
import { AppScreen } from "@/shared/components/app-screen";

/**
 * Tela canônica de "Transações" (feed redesenhado): herói teal, segmented
 * Fácil/Analítico, filtros e o feed em cards (ou o calendário existente).
 * Mantém intactos o formulário de criar/editar, os filtros, a exportação, a
 * navegação para importação/lixeira, o calendário e as ações de swipe — toda
 * a lógica vive no controller e nos componentes do feed; a tela só compõe.
 *
 * @returns Tela de transações, ou o formulário ativo.
 */
export function TransactionsScreen(): ReactElement {
  const controller = useTransactionsFeedController();
  const isDark = useResolvedTheme() === "auraxis_dark";
  const setThemePreference = useAppShellStore(
    (state) => state.setThemePreference,
  );

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <TransactionForm
          initialTransaction={
            controller.formMode.kind === "edit"
              ? controller.formMode.transaction
              : null
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

  const hero = (
    <RevealInView index={0}>
      <TxHero
        periodLabel={controller.periodLabel}
        kpis={controller.heroKpis}
        isDark={isDark}
        onToggleTheme={() => setThemePreference(isDark ? "light" : "dark")}
        onToggleCalendar={controller.toggleCalendar}
        calendarActive={controller.calendarActive}
      />
    </RevealInView>
  );

  if (controller.calendarActive) {
    return (
      <AppScreen scrollable testID="transactions-screen">
        {hero}
        <PeriodNavigator
          periodLabel={controller.periodLabel}
          onPreviousMonth={controller.goToPreviousMonth}
          onNextMonth={controller.goToNextMonth}
        />
        <FinancialCalendar transactions={controller.transactions} />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable={false} testID="transactions-screen">
      {hero}
      <TransactionFeed controller={controller} />
    </AppScreen>
  );
}
