import { useMemo } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { buildCreditCardBillPath } from "@/core/navigation/routes";
import type { CreditCard } from "@/features/credit-cards/contracts";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";

export interface UseCreditCardDetailScreenControllerOptions {
  /** Overrides the route param — used in tests. */
  readonly creditCardId?: string;
}

export interface CreditCardDetailScreenController {
  readonly creditCardId: string;
  readonly creditCardsQuery: ReturnType<typeof useCreditCardsQuery>;
  readonly creditCard: CreditCard | null;
  readonly hasCycleConfig: boolean;
  readonly utilizationQuery: ReturnType<typeof useCreditCardUtilizationQuery>;
  readonly notFound: boolean;
  readonly handleViewBill: () => void;
  readonly handleBack: () => void;
}

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

/**
 * Orchestrates the credit card detail screen: resolves the card from the list
 * query, classifies whether its bill cycle is configured (gating the
 * utilization query and the missing-cycle alert), and exposes navigation to
 * the bill. The screen stays view-only.
 */
export function useCreditCardDetailScreenController(
  options: UseCreditCardDetailScreenControllerOptions = {},
): CreditCardDetailScreenController {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const creditCardId = options.creditCardId ?? resolveStringParam(params.id);
  const creditCardsQuery = useCreditCardsQuery();

  const creditCard = useMemo<CreditCard | null>(
    () =>
      creditCardsQuery.data?.creditCards.find((card) => card.id === creditCardId) ??
      null,
    [creditCardsQuery.data, creditCardId],
  );

  const hasCycleConfig =
    creditCard !== null &&
    creditCard.closingDay !== null &&
    creditCard.dueDay !== null;

  const utilizationQuery = useCreditCardUtilizationQuery(creditCardId, {
    enabled: hasCycleConfig,
  });

  return {
    creditCardId,
    creditCardsQuery,
    creditCard,
    hasCycleConfig,
    utilizationQuery,
    notFound: !creditCardsQuery.isLoading && creditCard === null,
    handleViewBill: () => router.push(buildCreditCardBillPath(creditCardId)),
    handleBack: () => router.back(),
  };
}
