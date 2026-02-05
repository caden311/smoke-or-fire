import { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useCallback } from "react";

export function useCardAnimation() {
  const rotation = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  const flip = useCallback(() => {
    rotation.value = withTiming(180, {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
    });
    isFlipped.value = true;
  }, [rotation, isFlipped]);

  const reset = useCallback(() => {
    rotation.value = 0;
    isFlipped.value = false;
  }, [rotation, isFlipped]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotation.value + 180}deg` }],
      backfaceVisibility: "hidden" as const,
      position: "absolute" as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation.value}deg` },
      ],
      backfaceVisibility: "hidden" as const,
      position: "absolute" as const,
    };
  });

  return { flip, reset, frontAnimatedStyle, backAnimatedStyle };
}
