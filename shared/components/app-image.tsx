import type { ReactElement } from "react";

import { Image, type ImageProps } from "expo-image";

export interface AppImageProps extends ImageProps {
  /**
   * When true, the placeholder fades into the loaded image. Defaults
   * to a 200ms transition so first-paint feels smooth.
   */
  readonly fade?: boolean;
}

const DEFAULT_TRANSITION_MS = 200;

/**
 * Canonical image component. Wraps expo-image with sensible defaults
 * (memory + disk cache, soft fade-in transition) so call sites don't
 * have to remember to opt into them.
 *
 * Always prefer this over the React Native `Image` — caching + lazy
 * decode behaviour is dramatically better, especially for avatars,
 * brand logos, and remote ticker thumbnails.
 *
 * @param props expo-image props plus an optional `fade` toggle.
 * @returns Themed image with cache + transition baked in.
 */
export function AppImage({
  fade = true,
  cachePolicy = "memory-disk",
  transition,
  ...rest
}: AppImageProps): ReactElement {
  const resolvedTransition =
    transition ?? (fade ? DEFAULT_TRANSITION_MS : undefined);
  return (
    <Image cachePolicy={cachePolicy} transition={resolvedTransition} {...rest} />
  );
}
