import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Easing } from "react-native";

export const TAB_CAROUSEL_TRANSITION_DURATION_MS = 480;

export const tabCarouselTransitionSpec = {
  animation: "timing",
  config: {
    duration: TAB_CAROUSEL_TRANSITION_DURATION_MS,
    easing: Easing.bezier(0.5, 1, 0.34, 1),
  },
} satisfies NonNullable<BottomTabNavigationOptions["transitionSpec"]>;

export const createTabCarouselSceneStyleInterpolator = (
  screenWidth: number,
): NonNullable<BottomTabNavigationOptions["sceneStyleInterpolator"]> => {
  const distance = Math.max(screenWidth, 1);

  return ({ current }) => ({
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-distance, 0, distance],
            extrapolate: "clamp",
          }),
        },
      ],
    },
  });
};
