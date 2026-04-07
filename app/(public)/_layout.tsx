import { Redirect, Stack } from "expo-router";

import { usePublicRouteGuard } from "@/core/navigation/use-route-guards";

export default function PublicLayout() {
  const { ready, redirectTo } = usePublicRouteGuard();

  if (!ready) {
    return null;
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
