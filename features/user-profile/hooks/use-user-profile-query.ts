import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { UserProfile } from "@/features/user-profile/contracts";
import { userProfileService } from "@/features/user-profile/services/user-profile-service";

export const useUserProfileQuery = () => {
  return createApiQuery<UserProfile>(queryKeys.userProfile.detail(), () =>
    userProfileService.getProfile(),
  );
};
