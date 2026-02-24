import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { Platform } from "react-native";
import { InterstitialAd, AdEventType } from "react-native-google-mobile-ads";
import { fetchRemoteConfig } from "../services/firebase";

const AD_UNIT_IDS = {
  ios: "ca-app-pub-8700976366260814/1896573277",
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
  const interstitialRef = useRef<InterstitialAd | null>(null);
  const loadWaitersRef = useRef<Array<(loaded: boolean) => void>>([]);

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
        const waiters = loadWaitersRef.current;
        loadWaitersRef.current = [];
        waiters.forEach((resolve) => resolve(true));
      }
    );

    const unsubscribeError = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error: any) => {
        console.error("[AD] Interstitial ad failed to load:", error);
        setIsAdLoaded(false);
        const waiters = loadWaitersRef.current;
        loadWaitersRef.current = [];
        waiters.forEach((resolve) => resolve(false));
        console.log("[AD] Retrying ad load in 30s...");
        setTimeout(() => interstitialAd.load(), 30_000);
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
    interstitialRef.current = interstitialAd;
    setInterstitial(interstitialAd);

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
    };
  }, [adsEnabled]);

  const showInterstitialAd = useCallback(async (): Promise<void> => {
    if (!adsEnabled) {
      console.log("[AD] Ads disabled, skipping interstitial");
      return;
    }

    let adToShow = interstitialRef.current;

    if (!isAdLoaded || !adToShow) {
      // Ad may still be loading — wait up to 5s
      console.log("[AD] Ad not yet loaded, waiting up to 5s...");
      const loaded = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        loadWaitersRef.current.push((result) => {
          clearTimeout(timeout);
          resolve(result);
        });
      });

      if (!loaded || !interstitialRef.current) {
        console.log("[AD] Ad did not load in time, skipping");
        return;
      }

      adToShow = interstitialRef.current;
    }

    console.log("[AD] Showing interstitial ad");

    return new Promise((resolve) => {
      const unsubscribeClosed = adToShow!.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          unsubscribeClosed();
          resolve();
        }
      );

      adToShow!.show().catch((error: any) => {
        console.error("[AD] Failed to show interstitial:", error);
        unsubscribeClosed();
        resolve();
      });
    });
  }, [adsEnabled, isAdLoaded]);

  return (
    <AdContext.Provider value={{ adsEnabled, showInterstitialAd, isAdLoaded }}>
      {children}
    </AdContext.Provider>
  );
}
