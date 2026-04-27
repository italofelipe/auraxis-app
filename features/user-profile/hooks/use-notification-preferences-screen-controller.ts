import { useEffect, useState } from "react";

import type { NotificationPreference } from "@/features/user-profile/contracts";
import { useUpdateNotificationPreferencesMutation } from "@/features/user-profile/hooks/use-notification-preferences-mutation";
import { useNotificationPreferencesQuery } from "@/features/user-profile/hooks/use-notification-preferences-query";

export interface NotificationPreferencesScreenController {
  readonly preferencesQuery: ReturnType<typeof useNotificationPreferencesQuery>;
  readonly preferences: readonly NotificationPreference[];
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly togglePreference: (category: string) => void;
  readonly toggleGlobalOptOut: (category: string) => void;
  readonly handleSave: () => Promise<void>;
  readonly dismissSubmitError: () => void;
}

const replaceWhere = <T,>(
  list: readonly T[],
  predicate: (item: T) => boolean,
  next: (item: T) => T,
): T[] => {
  return list.map((item) => (predicate(item) ? next(item) : item));
};

export function useNotificationPreferencesScreenController(): NotificationPreferencesScreenController {
  const preferencesQuery = useNotificationPreferencesQuery();
  const updateMutation = useUpdateNotificationPreferencesMutation();
  const [preferences, setPreferences] = useState<readonly NotificationPreference[]>(
    [],
  );
  const [submitError, setSubmitError] = useState<unknown | null>(null);

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences(preferencesQuery.data.preferences);
    }
  }, [preferencesQuery.data]);

  return {
    preferencesQuery,
    preferences,
    isSubmitting: updateMutation.isPending,
    submitError,
    togglePreference: (category) => {
      setPreferences((current) =>
        replaceWhere(current, (item) => item.category === category, (item) => ({
          ...item,
          enabled: !item.enabled,
        })),
      );
    },
    toggleGlobalOptOut: (category) => {
      setPreferences((current) =>
        replaceWhere(current, (item) => item.category === category, (item) => ({
          ...item,
          globalOptOut: !item.globalOptOut,
        })),
      );
    },
    handleSave: async () => {
      setSubmitError(null);
      try {
        const result = await updateMutation.mutateAsync({ preferences });
        setPreferences(result.preferences);
      } catch (error) {
        setSubmitError(error);
      }
    },
    dismissSubmitError: () => {
      setSubmitError(null);
      updateMutation.reset();
    },
  };
}
