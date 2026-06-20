import type { ReactElement } from "react";

import { ScrollView } from "tamagui";

import { CardAppBar } from "@/features/credit-cards/components/card-app-bar";
import { InvoiceGroupedItems } from "@/features/credit-cards/components/invoice-grouped-items";
import { InvoiceHero } from "@/features/credit-cards/components/invoice-hero";
import { CardStickyCta } from "@/features/credit-cards/components/card-sticky-cta";
import { OndeFoiGasto } from "@/features/credit-cards/components/onde-foi-gasto";
import {
  type CreditCardBillScreenController,
  useCreditCardBillScreenController,
} from "@/features/credit-cards/hooks/use-credit-card-bill-screen-controller";
import type { CreditCardInvoiceViewModel } from "@/features/credit-cards/model/credit-card-invoice";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSkeletonBlock } from "@/shared/components/app-skeleton-block";
import { formatCurrency } from "@/shared/utils/formatters";

/**
 * Tela "Detalhe da fatura" redesenhada: AppBar (voltar + "Fatura" + nome do
 * cartão), hero com gradiente da marca e navegação de mês, "Onde foi gasto"
 * (barras por categoria), "Itens da fatura" agrupados por categoria e um CTA
 * fixo "Pagar fatura · R$ {total}". View-only — derivação vem do controller.
 *
 * @returns Tela de detalhe da fatura.
 */
export function CreditCardBillScreen(): ReactElement {
  const controller = useCreditCardBillScreenController();

  if (controller.creditCardsQuery.isLoading && controller.creditCard === null) {
    return (
      <AppScreen testID="credit-card-bill-screen">
        <AppSkeletonBlock title="Carregando fatura" lines={6} />
      </AppScreen>
    );
  }

  if (controller.creditCard === null || controller.invoice === null) {
    return (
      <AppScreen testID="credit-card-bill-screen">
        <CardAppBar title="Fatura" onBack={controller.handleBack} />
        <AppEmptyState
          illustration="transactions"
          title="Fatura indisponível"
          description="Não encontramos este cartão ou seus dados de fatura."
          cta={{ label: "Voltar", onPress: controller.handleBack }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable={false} testID="credit-card-bill-screen">
      <CardAppBar
        title="Fatura"
        subtitle={controller.creditCard.name}
        onBack={controller.handleBack}
      />
      <CreditCardBillBody controller={controller} invoice={controller.invoice} />
      <CardStickyCta
        label={`Pagar fatura · ${formatCurrency(controller.invoice.total)}`}
        icon="lightning-bolt"
        onPress={controller.handlePayBill}
        testID="invoice-pay-cta"
      />
    </AppScreen>
  );
}

interface CreditCardBillBodyProps {
  readonly controller: CreditCardBillScreenController;
  readonly invoice: CreditCardInvoiceViewModel;
}

function CreditCardBillBody({
  controller,
  invoice,
}: CreditCardBillBodyProps): ReactElement {
  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 16, paddingTop: 16, paddingBottom: 16 }}
    >
      <InvoiceHero
        gradient={invoice.gradient}
        monthLabel={controller.selectedMonthLabel}
        total={invoice.total}
        status={invoice.status}
        dueDateLabel={invoice.dueDateLabel}
        onPreviousMonth={controller.handlePreviousMonth}
        onNextMonth={controller.handleNextMonth}
      />
      <OndeFoiGasto categories={invoice.groupedByCategory} />
      <InvoiceGroupedItems groups={invoice.groupedByCategory} />
    </ScrollView>
  );
}
