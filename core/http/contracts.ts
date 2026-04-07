export interface ApiErrorDescriptor {
  readonly code?: string;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
}

export interface ApiSuccessEnvelope<TData> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data: TData;
}

export interface ApiErrorEnvelope {
  readonly success?: boolean;
  readonly message?: string;
  readonly error?: ApiErrorDescriptor;
}

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | TData;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const hasEnvelopeData = <TData>(
  payload: ApiEnvelope<TData>,
): payload is ApiSuccessEnvelope<TData> => {
  return isRecord(payload) && "data" in payload;
};

export const unwrapEnvelopeData = <TData>(payload: ApiEnvelope<TData>): TData => {
  if (hasEnvelopeData(payload)) {
    return payload.data;
  }

  return payload;
};
