import React, { createContext, useContext, ReactNode } from "react";

interface AdContextValue {
  adsEnabled: boolean;
  showInterstitialAd: () => Promise<void>;
  isAdLoaded: boolean;
}

const AdContext = createContext<AdContextValue>({
  adsEnabled: false,
  showInterstitialAd: async () => {},
  isAdLoaded: false,
});

export function useAds(): AdContextValue {
  return useContext(AdContext);
}

interface AdProviderProps {
  children: ReactNode;
}

// Web stub - ads are not supported on web
export function AdProvider({ children }: AdProviderProps) {
  return (
    <AdContext.Provider
      value={{
        adsEnabled: false,
        showInterstitialAd: async () => {
          console.log("[AD] Ads not supported on web");
        },
        isAdLoaded: false,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}
