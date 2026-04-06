const TEN_MIN_MS = 10 * 60 * 1000;

export function relativeTimeShort(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Online = active on site; otherwise last seen within 10 minutes or offline. */
export function formatChatPresenceLabel(options: {
  isOnline: boolean;
  lastSeenIso?: string | null;
}): { showDot: boolean; label: string } {
  if (options.isOnline) {
    return { showDot: true, label: "Online" };
  }
  const iso = options.lastSeenIso;
  if (!iso) {
    return { showDot: false, label: "Offline" };
  }
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return { showDot: false, label: "Offline" };
  }
  const ago = Date.now() - t;
  if (ago > TEN_MIN_MS) {
    return { showDot: false, label: "Offline" };
  }
  const rel = relativeTimeShort(iso);
  return {
    showDot: false,
    label: rel ? `Last seen ${rel}` : "Last seen recently",
  };
}
