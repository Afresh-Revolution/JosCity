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

/**
 * Update-available badge: when a new deployment is live, show a small banner
 * asking the user to click to upgrade.
 */
function UpdateBadge({ onUpdate, onDismiss }: { onUpdate: () => void; onDismiss: () => void }) {
  return (
    <div className="pwa-update-badge" role="status">
      <span className="pwa-update-badge__text">New version available</span>
      <button type="button" className="pwa-update-badge__btn" onClick={onUpdate}>
        Update
      </button>
      <button
        type="button"
        className="pwa-update-badge__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/**
 * PWAProvider: registers SW, shows update badge, and enables pull-to-refresh.
 */
export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [showUpdateBadge, setShowUpdateBadge] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const startY = useRef(0);

  const onRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(e: unknown) {
      console.warn("SW registration error:", e);
    },
  });

  useEffect(() => {
    if (needRefresh) setShowUpdateBadge(true);
  }, [needRefresh]);

  const handleUpdate = useCallback(() => {
    updateServiceWorker(true);
    setShowUpdateBadge(false);
  }, [updateServiceWorker]);

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
      {children}
      {showUpdateBadge && (
        <UpdateBadge
          onUpdate={handleUpdate}
          onDismiss={() => setShowUpdateBadge(false)}
        />
      )}
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
