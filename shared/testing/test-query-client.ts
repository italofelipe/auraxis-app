import type { QueryClient } from "@tanstack/react-query";

import { createAppQueryClient } from "@/core/query/query-client";

export const createTestQueryClient = (): QueryClient => {
  return createAppQueryClient({
    mode: "test",
  });
};
