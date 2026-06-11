import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  DetectSpendingPatternsCommand,
  SpendingPattern,
  SpendingPatternPayload,
  SpendingPatternSeverity,
  SpendingPatternTransactionInput,
  SpendingPatternsDetectResponse,
  SpendingPatternsLatest,
  SpendingPatternsLatestResponse,
} from "@/features/spending-patterns/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

const DEFAULT_PERIOD_DAYS = 90;

const SEVERITY_RANK: Record<SpendingPatternSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Numeric weight for a severity — higher means more severe. Used to order
 * patterns most-severe first.
 */
export const severityRank = (severity: SpendingPatternSeverity): number =>
  SEVERITY_RANK[severity] ?? 0;

const mapPattern = (payload: SpendingPatternPayload): SpendingPattern => ({
  description: payload.description,
  frequency: payload.frequency,
  averageValue: payload.average_value,
  suggestedAction: payload.suggested_action,
  severity: payload.severity,
});

const mapPatternsBySeverity = (
  payloads: readonly SpendingPatternPayload[] | undefined,
): SpendingPattern[] =>
  (payloads ?? [])
    .map(mapPattern)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

interface TransactionLike {
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly dueDate: string;
  readonly title: string;
}

/**
 * Builds the LGPD-safe transaction inputs from the user's transactions: keeps
 * only expenses with a positive, finite amount and forwards just
 * amount/date/coarse-label (no personal identifiers). Mirrors the web builder.
 */
export const buildTransactionInputs = (
  transactions: readonly TransactionLike[],
): SpendingPatternTransactionInput[] => {
  const inputs: SpendingPatternTransactionInput[] = [];
  for (const tx of transactions) {
    if (tx.type !== "expense") {
      continue;
    }
    const amount = Number.parseFloat(tx.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }
    inputs.push({
      amount,
      occurredOn: tx.dueDate,
      ...(tx.title ? { category: tx.title } : {}),
      kind: "expense",
    });
  }
  return inputs;
};

/**
 * HTTP adapter for the spending-patterns radar. `getLatest` is read-only and
 * never consumes the AI daily quota; `detect` triggers an on-demand analysis.
 */
export const createSpendingPatternsService = (client: AxiosInstance) => {
  return {
    getLatest: async (): Promise<SpendingPatternsLatest> => {
      const response = await client.get(apiContractMap.spendingPatternsLatest.path);
      const payload = unwrapEnvelopeData<SpendingPatternsLatestResponse>(response.data);
      return {
        patterns: mapPatternsBySeverity(payload.patterns),
        generatedAt: payload.generated_at ?? null,
        periodLabel: payload.period_label ?? null,
      };
    },
    detect: async (
      command: DetectSpendingPatternsCommand,
    ): Promise<SpendingPattern[]> => {
      const response = await client.post(apiContractMap.spendingPatternsDetect.path, {
        transactions: command.transactions.map((input) => ({
          amount: input.amount,
          occurred_on: input.occurredOn,
          ...(input.category ? { category: input.category } : {}),
          kind: input.kind,
        })),
        period_days: command.periodDays ?? DEFAULT_PERIOD_DAYS,
      });
      const payload = unwrapEnvelopeData<SpendingPatternsDetectResponse>(response.data);
      return mapPatternsBySeverity(payload.patterns);
    },
  };
};

export const spendingPatternsService = createSpendingPatternsService(httpClient);
