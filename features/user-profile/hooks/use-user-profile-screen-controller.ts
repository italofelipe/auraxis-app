import { useRouter } from "expo-router";
import { useState } from "react";

import { appRoutes } from "@/core/navigation/routes";
import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import type { UserProfile } from "@/features/user-profile/contracts";
import { useUpdateUserProfileMutation } from "@/features/user-profile/hooks/use-user-profile-mutations";
import { useUserProfileQuery } from "@/features/user-profile/hooks/use-user-profile-query";
import type { UpdateUserProfileFormValues } from "@/features/user-profile/validators";

export type UserProfileFormMode = "read" | "edit";

export interface UserProfileScreenController {
  readonly profileQuery: ReturnType<typeof useUserProfileQuery>;
  readonly profile: UserProfile | null;
  readonly mode: UserProfileFormMode;
  readonly isSaving: boolean;
  readonly isLoggingOut: boolean;
  readonly submitError: unknown | null;
  readonly handleEdit: () => void;
  readonly handleCancel: () => void;
  readonly handleSubmit: (values: UpdateUserProfileFormValues) => Promise<void>;
  readonly handleLogout: () => Promise<void>;
  readonly dismissSubmitError: () => void;
}

/**
 * Canonical controller for the user profile screen. Owns the read/edit
 * mode toggle, the update mutation and the logout flow.
 */
export function useUserProfileScreenController(): UserProfileScreenController {
  const router = useRouter();
  const profileQuery = useUserProfileQuery();
  const updateMutation = useUpdateUserProfileMutation();
  const logoutMutation = useLogoutMutation();
  const [mode, setMode] = useState<UserProfileFormMode>("read");
  const [submitError, setSubmitError] = useState<unknown | null>(null);

  const handleSubmit = async (
    values: UpdateUserProfileFormValues,
  ): Promise<void> => {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync(values);
      setMode("read");
    } catch (error) {
      setSubmitError(error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.replace(appRoutes.public.login);
    }
  };

  return {
    profileQuery,
    profile: profileQuery.data ?? null,
    mode,
    isSaving: updateMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    submitError,
    handleEdit: () => {
      setSubmitError(null);
      setMode("edit");
    },
    handleCancel: () => {
      setSubmitError(null);
      setMode("read");
    },
    handleSubmit,
    handleLogout,
    dismissSubmitError: () => {
      setSubmitError(null);
      updateMutation.reset();
    },
  };
}
