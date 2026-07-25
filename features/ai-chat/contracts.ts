/**
 * Request accepted by the snapshot-grounded financial assistant.
 */
export interface AskFinancialQuestionCommand {
  readonly question: string;
}

/**
 * Mobile domain representation of a successful AI chat answer.
 *
 * Usage metadata is intentionally kept out of product analytics. It remains
 * available here for diagnostics and future quota UI driven by the API.
 */
export interface AiChatAnswer {
  readonly answer: string;
  readonly model: string;
  readonly tokensUsed: number;
  readonly costUsd: number;
  readonly periodLabel: string | null;
  readonly toolRounds: number | null;
}

export type AiChatMessageRole = "user" | "assistant";

export interface AiChatMessage {
  readonly id: string;
  readonly role: AiChatMessageRole;
  readonly content: string;
  readonly createdAt: string;
  readonly periodLabel?: string;
}

export type AiChatErrorKind =
  "entitlement" | "consent" | "budget" | "validation" | "timeout" | "server";
