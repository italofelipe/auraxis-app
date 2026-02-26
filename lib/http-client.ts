import axios, { type AxiosInstance, type AxiosRequestHeaders , type InternalAxiosRequestConfig } from "axios";

import { useSessionStore } from "@/stores/session-store";

const DEFAULT_API_BASE_URL = "http://localhost:5000";

export const normalizeBaseUrl = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

const resolveApiBaseUrl = (): string => {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
  return normalizeBaseUrl(apiBaseUrl);
};

const attachAuthorizationHeader = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const accessToken = useSessionStore.getState().accessToken;

  if (!accessToken) {
    return config;
  }

  const headers = (config.headers ?? {}) as AxiosRequestHeaders;
  headers.Authorization = `Bearer ${accessToken}`;
  config.headers = headers;

  return config;
};

export const createHttpClient = (baseUrl: string): AxiosInstance => {
  const client = axios.create({
    baseURL: normalizeBaseUrl(baseUrl),
    timeout: 15_000,
  });

  client.interceptors.request.use(attachAuthorizationHeader);
  return client;
};

export const httpClient = createHttpClient(resolveApiBaseUrl());
