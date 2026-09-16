import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { PWAInstallProvider } from "../contexts/PWAInstallContext";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;
const SCROLL_TOP_THRESHOLD = 300;

/** Get the scroll container that contains el (or document). Returns scroll top in pixels. */
function getScrollTopFromTarget(target: EventTarget | null): number {
  let el = target as HTMLElement | null;
  while (el) {
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    if (el.scrollHeight > el.clientHeight && /auto|scroll|overlay/.test(overflowY)) {
      return el.scrollTop;
    }
    el = el.parentElement;
  }
  return typeof window !== "undefined" ? window.scrollY : 0;
}

/** True only when the page is at the top (for pull-to-refresh). */
function isAtTop(target: EventTarget | null): boolean {
  const scrollTop = getScrollTopFromTarget(target);
  const winTop = typeof window !== "undefined" ? window.scrollY : 0;
  return scrollTop <= 0 && winTop <= 0;
}

export function PullToRefreshIndicator({
  pullDistance,
  active,
}: {
  pullDistance: number;
  active: boolean;
}) {
  if (!active && pullDistance === 0) return null;
  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  return (
    <div
      className="pwa-pull-indicator"
      aria-hidden
      style={{
        opacity: active ? 1 : 0,
        transform: `translateY(${Math.min(pullDistance, MAX_PULL)}px)`,
      }}
    >
      <div
        className="pwa-pull-indicator__spinner"
        style={{ transform: `rotate(${progress * 360}deg)` }}
      />
      <span className="pwa-pull-indicator__text">
        {pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
      </span>
    </div>
  );
}

/** Register in production and detect deployments promptly while the app is visible. */
function ProductionServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  useRegisterSW({
    immediate: true,
    onRegistered: setRegistration,
    onRegisterError(error: unknown) {
      console.warn("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (!registration) return;
    let checking = false;
    const checkForUpdate = async () => {
      if (checking || !navigator.onLine || document.visibilityState !== "visible" || registration.installing) return;
      checking = true;
      try {
        await registration.update();
      } catch (error) {
        // Keep the existing offline app usable and retry on the next check.
        console.warn("SW update check failed:", error);
      } finally {
        checking = false;
      }
    };
    void checkForUpdate();
    const interval = window.setInterval(checkForUpdate, 30_000);
    window.addEventListener("focus", checkForUpdate);
    window.addEventListener("online", checkForUpdate);
    document.addEventListener("visibilitychange", checkForUpdate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForUpdate);
      window.removeEventListener("online", checkForUpdate);
      document.removeEventListener("visibilitychange", checkForUpdate);
    };
  }, [registration]);

  return null;
}

/**
 * PWAProvider: registers SW (prod only), applies updates automatically, and enables pull-to-refresh.
 */
export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const startY = useRef(0);

  const onRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Pull-to-refresh (touch only): only when at top of scroll container (fixes newsfeed glitch)
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const touchTargetRef = useRef<EventTarget | null>(null);
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.touches[0]?.target ?? null;
      if (isAtTop(target)) {
        touchTargetRef.current = target;
        startY.current = e.touches[0].clientY;
        pullingRef.current = true;
        setPulling(true);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return;
      const target = touchTargetRef.current;
      if (!isAtTop(target)) {
        pullingRef.current = false;
        pullDistanceRef.current = 0;
        setPulling(false);
        setPullDistance(0);
        return;
      }
      const y = e.touches[0].clientY;
      const diff = Math.max(0, y - startY.current);
      const d = Math.min(diff, MAX_PULL);
      pullDistanceRef.current = d;
      setPullDistance(d);
    };
    const handleTouchEnd = () => {
      const shouldRefresh = pullingRef.current && pullDistanceRef.current >= PULL_THRESHOLD && isAtTop(touchTargetRef.current);
      pullingRef.current = false;
      pullDistanceRef.current = 0;
      touchTargetRef.current = null;
      setPulling(false);
      setPullDistance(0);
      if (shouldRefresh) onRefresh();
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh]);

  // Scroll-to-top: show when user has scrolled down (window or .newsfeed-main)
  useEffect(() => {
    const updateShow = () => {
      const main = document.querySelector(".newsfeed-main");
      const mainScroll = main ? (main as HTMLElement).scrollTop : 0;
      const winScroll = window.scrollY;
      setShowScrollTop(winScroll > SCROLL_TOP_THRESHOLD || mainScroll > SCROLL_TOP_THRESHOLD);
    };
    window.addEventListener("scroll", updateShow, { passive: true });
    const id = setInterval(() => {
      updateShow();
      const main = document.querySelector(".newsfeed-main");
      if (main && !(main as HTMLElement & { _scrollTopListener?: boolean })._scrollTopListener) {
        (main as HTMLElement & { _scrollTopListener?: boolean })._scrollTopListener = true;
        main.addEventListener("scroll", updateShow, { passive: true });
      }
    }, 400);
    return () => {
      window.removeEventListener("scroll", updateShow);
      const main = document.querySelector(".newsfeed-main");
      if (main) {
        (main as HTMLElement & { _scrollTopListener?: boolean })._scrollTopListener = false;
        main.removeEventListener("scroll", updateShow);
      }
      clearInterval(id);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector(".newsfeed-main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <PWAInstallProvider>
      {import.meta.env.PROD && <ProductionServiceWorkerRegistration />}
      {children}
      <PullToRefreshIndicator pullDistance={pullDistance} active={pulling} />
      {showScrollTop && (
        <button
          type="button"
          className="pwa-scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          ↑
        </button>
      )}
    </PWAInstallProvider>
  );
}
