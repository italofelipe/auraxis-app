import { createApiQuery } from "@/core/query/create-api-query";
import type {
  UserBootstrap,
  UserBootstrapQuery,
} from "@/features/bootstrap/contracts";
import { bootstrapService } from "@/features/bootstrap/services/bootstrap-service";

export const useUserBootstrapQuery = (
  query: UserBootstrapQuery = {},
) => {
  return createApiQuery<UserBootstrap>(
    ["user", "bootstrap", query],
    () => bootstrapService.getBootstrap(query),
  );
};
