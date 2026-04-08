import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type {
  UpdateUserProfileCommand,
  UserProfile,
} from "@/features/user-profile/contracts";
import { userProfileService } from "@/features/user-profile/services/user-profile-service";

export const useUpdateUserProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateUserProfileCommand>({
    mutationFn: (command) => userProfileService.updateProfile(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile.root });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap.root });
    },
  });
};
