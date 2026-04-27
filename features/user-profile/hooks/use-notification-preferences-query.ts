import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { NotificationPreferenceListResponse } from "@/features/user-profile/contracts";
import { userProfileService } from "@/features/user-profile/services/user-profile-service";

export const useNotificationPreferencesQuery = () => {
  return createApiQuery<NotificationPreferenceListResponse>(
    queryKeys.userProfile.notificationPreferences(),
    () => userProfileService.listNotificationPreferences(),
  );
};
