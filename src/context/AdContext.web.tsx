import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { fetchRemoteConfig } from "../services/firebase";

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

const PUBLISHER_ID = "ca-pub-8700976366260814";
const AD_SLOT_ID = "YOUR_AD_SLOT_ID";
const CLOSE_DELAY_SECONDS = 5;
const SAFETY_TIMEOUT_MS = 15_000;

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
  const scriptLoadedRef = useRef(false);

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

  // Inject AdSense script when ads are enabled
  useEffect(() => {
    if (!adsEnabled) return;

    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src*="pagead2.googlesyndication.com"]`
    );
    if (existingScript) {
      scriptLoadedRef.current = true;
      setIsAdLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      console.log("[AD] AdSense script loaded");
      scriptLoadedRef.current = true;
      setIsAdLoaded(true);
    };

    script.onerror = () => {
      console.warn("[AD] AdSense script failed to load (ad blocker?)");
      scriptLoadedRef.current = false;
      setIsAdLoaded(false);
    };

    document.head.appendChild(script);
  }, [adsEnabled]);

  const showInterstitialAd = useCallback(async (): Promise<void> => {
    if (__DEV__) {
      console.log("[AD] Skipping interstitial in dev mode");
      return;
    }

    if (!adsEnabled || !scriptLoadedRef.current) {
      console.log("[AD] Ads disabled or script not loaded, skipping interstitial");
      return;
    }

    console.log("[AD] Showing web interstitial overlay");

    return new Promise<void>((resolve) => {
      let resolved = false;
      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        overlay.remove();
        resolve();
      };

      // Safety timeout
      const safetyTimer = setTimeout(cleanup, SAFETY_TIMEOUT_MS);

      // Create overlay
      const overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        zIndex: "99999",
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      });

      // Container for ad + close button
      const container = document.createElement("div");
      Object.assign(container.style, {
        position: "relative",
        width: "min(90vw, 728px)",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      });

      // Close button
      const closeButton = document.createElement("button");
      closeButton.disabled = true;
      let countdown = CLOSE_DELAY_SECONDS;
      closeButton.textContent = `Close (${countdown}s)`;
      Object.assign(closeButton.style, {
        alignSelf: "flex-end",
        padding: "8px 20px",
        fontSize: "16px",
        fontWeight: "600",
        color: "#fff",
        background: "#555",
        border: "none",
        borderRadius: "8px",
        cursor: "not-allowed",
        opacity: "0.6",
        fontFamily: "inherit",
      });

      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          closeButton.textContent = "Close";
          closeButton.disabled = false;
          Object.assign(closeButton.style, {
            cursor: "pointer",
            opacity: "1",
            background: "#e74c3c",
          });
        } else {
          closeButton.textContent = `Close (${countdown}s)`;
        }
      }, 1000);

      closeButton.addEventListener("click", () => {
        if (!closeButton.disabled) {
          clearInterval(countdownInterval);
          clearTimeout(safetyTimer);
          cleanup();
        }
      });

      // Ad container
      const adContainer = document.createElement("div");
      Object.assign(adContainer.style, {
        width: "100%",
        minHeight: "250px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
      });

      // AdSense ins element
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      Object.assign(ins.style, {
        display: "block",
        width: "100%",
        minHeight: "250px",
      });
      ins.setAttribute("data-ad-client", PUBLISHER_ID);
      ins.setAttribute("data-ad-slot", AD_SLOT_ID);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");

      adContainer.appendChild(ins);
      container.appendChild(closeButton);
      container.appendChild(adContainer);
      overlay.appendChild(container);
      document.body.appendChild(overlay);

      // Push ad request
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        console.log("[AD] AdSense ad request pushed");
      } catch (e) {
        console.warn("[AD] Failed to push ad request:", e);
      }
    });
  }, [adsEnabled]);

  return (
    <AdContext.Provider value={{ adsEnabled, showInterstitialAd, isAdLoaded }}>
      {children}
    </AdContext.Provider>
  );
}
