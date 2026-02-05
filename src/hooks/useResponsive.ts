import { useWindowDimensions, Platform } from "react-native";
import { useMemo } from "react";

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const scaleWidth = width / 393;
    const scaleHeight = height / 852;
    const minScale = Math.min(scaleWidth, scaleHeight);

    const sw = (size: number) => Math.round(size * scaleWidth);
    const sh = (size: number) => Math.round(size * scaleHeight);
    const s = (size: number) => Math.round(size * minScale);

    // Gentle font scaling: average of 1.0 and minScale, floored at 0.75x
    const fs = (size: number) => {
      const factor = Math.max(0.75, (1.0 + minScale) / 2);
      return Math.round(size * factor);
    };

    const isSmallScreen = width <= 380 || height <= 700;

    // Main card dimensions (base 136x220, aspect ratio 136:220)
    const mainCardWidth = s(136);
    const mainCardHeight = s(220);

    // Pyramid card dimensions — compute to fit 5 rows in available height
    // Available height ≈ screenHeight - safeArea(~100) - header(~80) - footer(~80) - gaps(~50)
    const availableHeight = height - 310;
    const pyramidCardHeight = Math.min(
      Math.floor(availableHeight / 5.5),
      sh(116)
    );
    const pyramidCardWidth = Math.round(pyramidCardHeight * (80 / 116));

    const previousCardScale = isSmallScreen ? 0.5 : 0.6;
    // Computed layout dimensions for scaled previous cards (136x220 base)
    const previousCardWidth = Math.round(136 * previousCardScale);
    const previousCardHeight = Math.round(220 * previousCardScale);

    const contentPadding = sw(24);
    const gap = s(16);

    return {
      sw,
      sh,
      s,
      fs,
      isSmallScreen,
      mainCard: { width: mainCardWidth, height: mainCardHeight },
      pyramidCard: { width: pyramidCardWidth, height: pyramidCardHeight },
      previousCardScale,
      previousCardWidth,
      previousCardHeight,
      contentPadding,
      gap,
    };
  }, [width, height]);
}
