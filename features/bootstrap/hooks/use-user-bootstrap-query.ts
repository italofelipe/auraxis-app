import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  UserBootstrap,
  UserBootstrapQuery,
} from "@/features/bootstrap/contracts";
import { bootstrapService } from "@/features/bootstrap/services/bootstrap-service";

export const useUserBootstrapQuery = (
  query: UserBootstrapQuery = {},
) => {
  return createApiQuery<UserBootstrap>(
    [...queryKeys.bootstrap.user(), query],
    () => bootstrapService.getBootstrap(query),
  );
};
