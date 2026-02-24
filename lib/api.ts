const DEFAULT_API_BASE_URL = "http://localhost:5000";

const removeTrailingSlashes = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

const normalizePath = (path: string): string => {
  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
};

const resolveBaseUrlFromEnv = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
  return removeTrailingSlashes(envUrl);
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

export type ApiRequestError = Error & {
  status: number;
  payload: unknown;
};

const createApiRequestError = (status: number, payload: unknown): ApiRequestError => {
  const error = new Error(`Request failed with status ${status}`) as ApiRequestError;
  error.name = "ApiRequestError";
  error.status = status;
  error.payload = payload;
  return error;
};

export interface HealthResponse {
  readonly status: string;
  readonly message?: string;
}

export class ApiClient {
  private readonly baseUrl: string;

  public constructor(baseUrl = resolveBaseUrlFromEnv()) {
    this.baseUrl = removeTrailingSlashes(baseUrl);
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...(init ?? {}), method: "GET" });
  }

  public async checkHealth(): Promise<HealthResponse> {
    return this.get<HealthResponse>("/health");
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${normalizePath(path)}`;
    const response = await fetch(url, init);

    if (!response.ok) {
      const errorPayload = await parseResponse<unknown>(response);
      throw createApiRequestError(response.status, errorPayload);
    }

    return parseResponse<T>(response);
  }
}

export const apiClient = new ApiClient();

export const checkApiHealth = async (): Promise<HealthResponse> => apiClient.checkHealth();
