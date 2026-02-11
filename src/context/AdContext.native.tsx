import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Platform } from "react-native";
import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";
import { fetchRemoteConfig } from "../services/firebase";

// Test ad unit IDs for development
const AD_UNIT_IDS = {
  ios: "ca-app-pub-3940256099942544/4411468910",
  android: "ca-app-pub-3940256099942544/1033173712",
};

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

export function AdProvider({ children }: AdProviderProps) {
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);

  // Fetch remote config on mount
  useEffect(() => {
    fetchRemoteConfig()
      .then((config) => {
        console.log("[AD] Remote config fetched, adsEnabled:", config.adsEnabled);
        setAdsEnabled(config.adsEnabled);
      })
      .catch((error) => {
        console.error("[AD] Failed to fetch remote config:", error);
        setAdsEnabled(false);
      });
  }, []);

  // Load interstitial ad when ads are enabled
  useEffect(() => {
    if (!adsEnabled) {
      return;
    }

    const adUnitId = Platform.OS === "ios" ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;
    console.log("[AD] Creating interstitial ad with unit:", adUnitId);

    const interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log("[AD] Interstitial ad loaded");
        setIsAdLoaded(true);
      }
    );

    const unsubscribeError = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error: any) => {
        console.error("[AD] Interstitial ad failed to load:", error);
        setIsAdLoaded(false);
      }
    );

    const unsubscribeClosed = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("[AD] Interstitial ad closed, reloading...");
        setIsAdLoaded(false);
        // Reload ad for next time
        interstitialAd.load();
      }
    );

    // Load the ad
    interstitialAd.load();
    setInterstitial(interstitialAd);

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
    };
  }, [adsEnabled]);

  const showInterstitialAd = useCallback(async (): Promise<void> => {
    // Skip if ads disabled or ad not loaded
    if (!adsEnabled) {
      console.log("[AD] Ads disabled, skipping interstitial");
      return;
    }

    if (!isAdLoaded || !interstitial) {
      console.log("[AD] Ad not loaded, skipping interstitial");
      return;
    }

    console.log("[AD] Showing interstitial ad");

    return new Promise((resolve) => {
      const unsubscribeClosed = interstitial.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          unsubscribeClosed();
          resolve();
        }
      );

      interstitial.show().catch((error: any) => {
        console.error("[AD] Failed to show interstitial:", error);
        unsubscribeClosed();
        resolve(); // Continue even if ad fails
      });
    });
  }, [adsEnabled, isAdLoaded, interstitial]);

  return (
    <AdContext.Provider value={{ adsEnabled, showInterstitialAd, isAdLoaded }}>
      {children}
    </AdContext.Provider>
  );
}
