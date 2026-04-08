import { isAxiosError } from "axios";

import type { ApiErrorEnvelope } from "@/core/http/contracts";

const DEFAULT_MESSAGE = "Nao foi possivel concluir a requisicao.";
const DEFAULT_CODE = "REQUEST_FAILED";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const readMessageFromPayload = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.message === "string" && payload.message.length > 0) {
    return payload.message;
  }

  const error = payload.error;
  if (isRecord(error) && typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }

  return null;
};

const readCodeFromPayload = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const error = payload.error;
  if (isRecord(error) && typeof error.code === "string" && error.code.length > 0) {
    return error.code;
  }

  return null;
};

const readDetailsFromPayload = (payload: unknown): Record<string, unknown> => {
  if (!isRecord(payload)) {
    return {};
  }

  const error = payload.error;
  if (isRecord(error) && isRecord(error.details)) {
    return error.details;
  }

  return {};
};

const createSafeAxiosPayload = (
  payload: unknown,
  message: string,
  status: number,
  code: string,
): unknown => {
  if (status > 0) {
    return payload;
  }

  return {
    message,
    status,
    code,
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly payload: unknown;

  constructor(options: {
    message: string;
    status: number;
    code?: string;
    details?: Record<string, unknown>;
    payload?: unknown;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code ?? DEFAULT_CODE;
    this.details = options.details ?? {};
    this.payload = options.payload;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorEnvelope | unknown;
    const message = readMessageFromPayload(payload) ?? error.message ?? DEFAULT_MESSAGE;
    const status = error.response?.status ?? 0;
    const code = readCodeFromPayload(payload) ?? DEFAULT_CODE;
    return new ApiError({
      message,
      status,
      code,
      details: readDetailsFromPayload(payload),
      payload: createSafeAxiosPayload(payload, message, status, code),
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message,
      status: 0,
      payload: error,
    });
  }

  return new ApiError({
    message: DEFAULT_MESSAGE,
    status: 0,
    payload: error,
  });
};
