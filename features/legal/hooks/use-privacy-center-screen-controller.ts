import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";

import { appRoutes } from "@/core/navigation/routes";
import {
  loadAnalyticsOptOutPreference,
  persistAnalyticsOptOutPreference,
} from "@/core/observability/analytics-preferences";
import { setAnalyticsCollectionEnabled } from "@/core/observability/analytics-runtime";
import { PRIVACY_SUPPORT_EMAIL } from "@/features/legal/privacy-center-config";

export type DataExportRequestState = "idle" | "loading" | "success" | "error";

const dataExportSubject = "Solicitação de exportação de dados LGPD";
const dataExportBody =
  "Ola, quero solicitar a exportacao dos meus dados pessoais tratados pelo Auraxis.";

export const DATA_EXPORT_REQUEST_URL =
  `mailto:${PRIVACY_SUPPORT_EMAIL}` +
  `?subject=${encodeURIComponent(dataExportSubject)}` +
  `&body=${encodeURIComponent(dataExportBody)}`;

export interface PrivacyCenterScreenController {
  readonly exportRequestState: DataExportRequestState;
  readonly exportRequestError: Error | null;
  readonly handleOpenPrivacyPolicy: () => void;
  readonly handleOpenTermsOfService: () => void;
  readonly handleOpenCookiesInfo: () => void;
  readonly handleOpenDeleteAccount: () => void;
  readonly handleRequestDataExport: () => Promise<void>;
  readonly analyticsPreferenceHydrated: boolean;
  readonly analyticsCollectionEnabled: boolean;
  readonly handleAnalyticsCollectionChange: (enabled: boolean) => Promise<void>;
  readonly dismissExportRequestFeedback: () => void;
}

const toExportRequestError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error("Nao foi possivel abrir o canal de privacidade.");
};

export function usePrivacyCenterScreenController(): PrivacyCenterScreenController {
  const router = useRouter();
  const [exportRequestState, setExportRequestState] =
    useState<DataExportRequestState>("idle");
  const [exportRequestError, setExportRequestError] = useState<Error | null>(null);
  const [analyticsPreferenceHydrated, setAnalyticsPreferenceHydrated] =
    useState(false);
  const [analyticsCollectionEnabled, setAnalyticsCollectionEnabledState] =
    useState(true);

  useEffect(() => {
    let active = true;

    void loadAnalyticsOptOutPreference().then((preference) => {
      if (!active) {
        return;
      }

      const enabled = !preference.optedOut;
      setAnalyticsCollectionEnabledState(enabled);
      setAnalyticsCollectionEnabled(enabled);
      setAnalyticsPreferenceHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleRequestDataExport = async (): Promise<void> => {
    setExportRequestState("loading");
    setExportRequestError(null);

    try {
      const canOpen = await Linking.canOpenURL(DATA_EXPORT_REQUEST_URL);
      if (!canOpen) {
        throw new Error("Canal de email indisponivel neste dispositivo.");
      }
      await Linking.openURL(DATA_EXPORT_REQUEST_URL);
      setExportRequestState("success");
    } catch (error) {
      setExportRequestError(toExportRequestError(error));
      setExportRequestState("error");
    }
  };

  const handleAnalyticsCollectionChange = useCallback(
    async (enabled: boolean): Promise<void> => {
      setAnalyticsCollectionEnabledState(enabled);
      setAnalyticsCollectionEnabled(enabled);
      await persistAnalyticsOptOutPreference(!enabled);
    },
    [],
  );

  return {
    exportRequestState,
    exportRequestError,
    handleOpenPrivacyPolicy: () => router.push(appRoutes.legal.privacyPolicy),
    handleOpenTermsOfService: () => router.push(appRoutes.legal.termsOfService),
    handleOpenCookiesInfo: () => router.push(appRoutes.legal.privacyPolicy),
    handleOpenDeleteAccount: () => router.push(appRoutes.private.dangerZone),
    handleRequestDataExport,
    analyticsPreferenceHydrated,
    analyticsCollectionEnabled,
    handleAnalyticsCollectionChange,
    dismissExportRequestFeedback: () => {
      setExportRequestState("idle");
      setExportRequestError(null);
    },
  };
}
