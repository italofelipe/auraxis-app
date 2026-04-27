import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  NotificationPreferenceListResponse,
  UpdateNotificationPreferencesCommand,
} from "@/features/user-profile/contracts";
import { userProfileService } from "@/features/user-profile/services/user-profile-service";

export const useUpdateNotificationPreferencesMutation = () => {
  const queryClient = useQueryClient();
  return createApiMutation<
    NotificationPreferenceListResponse,
    UpdateNotificationPreferencesCommand
  >((command) => userProfileService.updateNotificationPreferences(command), {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile.notificationPreferences(),
      });
    },
  });
};
