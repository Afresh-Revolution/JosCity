import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

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

  // Pull-to-refresh (touch only) – use refs so handlers see current values
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pullingRef.current = true;
        setPulling(true);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current || window.scrollY > 0) return;
      const y = e.touches[0].clientY;
      const diff = Math.max(0, y - startY.current);
      const d = Math.min(diff, MAX_PULL);
      pullDistanceRef.current = d;
      setPullDistance(d);
    };
    const handleTouchEnd = () => {
      if (pullDistanceRef.current >= PULL_THRESHOLD) onRefresh();
      pullingRef.current = false;
      pullDistanceRef.current = 0;
      setPulling(false);
      setPullDistance(0);
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

  return (
    <>
      {children}
      {showUpdateBadge && (
        <UpdateBadge
          onUpdate={handleUpdate}
          onDismiss={() => setShowUpdateBadge(false)}
        />
      )}
      <PullToRefreshIndicator pullDistance={pullDistance} active={pulling} />
    </>
  );
}
