/* eslint-disable react-refresh/only-export-components -- hook + provider share one module */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PWAInstallContextValue = {
  /** Chromium/Edge/Android Chrome: install dialog is available */
  canPromptInstall: boolean;
  /** Running as installed PWA (standalone / iOS home screen) */
  isStandalone: boolean;
  /** Opens the browser install UI when supported; returns true if user accepted */
  promptInstall: () => Promise<boolean>;
  /** iOS Safari has no programmatic install — show manual steps instead */
  needsManualIOSInstall: boolean;
};

const defaultValue: PWAInstallContextValue = {
  canPromptInstall: false,
  isStandalone: false,
  promptInstall: async () => false,
  needsManualIOSInstall: false,
};

const PWAInstallContext = createContext<PWAInstallContextValue>(defaultValue);

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return true;
  if (/iPad/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(getIsStandalone);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const needsManualIOSInstall = isAppleTouchDevice() && !isStandalone;

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isStandalone) return false;

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (outcome === "accepted") {
          setIsStandalone(true);
          return true;
        }
        return false;
      } catch {
        setDeferredPrompt(null);
        return false;
      }
    }

    if (needsManualIOSInstall) {
      setShowIOSHelp(true);
      return false;
    }

    return false;
  }, [deferredPrompt, isStandalone, needsManualIOSInstall]);

  const value = useMemo<PWAInstallContextValue>(
    () => ({
      canPromptInstall: Boolean(deferredPrompt),
      isStandalone,
      promptInstall,
      needsManualIOSInstall,
    }),
    [deferredPrompt, isStandalone, promptInstall, needsManualIOSInstall]
  );

  const showFab =
    !isStandalone && (Boolean(deferredPrompt) || needsManualIOSInstall);

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
      {showFab && (
        <button
          type="button"
          className="pwa-install-fab"
          onClick={() => void promptInstall()}
          aria-label={
            deferredPrompt ? "Install JosCity app" : "How to add JosCity to Home Screen"
          }
        >
          {deferredPrompt ? "Install app" : "Add to Home Screen"}
        </button>
      )}
      {showIOSHelp && (
        <div className="pwa-install-ios-backdrop" role="presentation" onClick={() => setShowIOSHelp(false)}>
          <div
            className="pwa-install-ios-dialog"
            role="dialog"
            aria-labelledby="pwa-ios-install-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="pwa-ios-install-title" className="pwa-install-ios-dialog__title">
              Install JosCity on your iPhone or iPad
            </h2>
            <ol className="pwa-install-ios-dialog__steps">
              <li>Tap the <strong>Share</strong> button <span aria-hidden>(□↑)</span> in Safari.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong>. Open JosCity from your home screen for the full app experience.</li>
            </ol>
            <button type="button" className="pwa-install-ios-dialog__btn" onClick={() => setShowIOSHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall(): PWAInstallContextValue {
  return useContext(PWAInstallContext);
}
