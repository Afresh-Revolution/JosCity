/** Canonical URL for an event (opens Events page and scrolls to the card). */
function getEventShareUrl(id: number): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/events?event=${encodeURIComponent(String(id))}`;
}

export type ShareEventResult = "shared" | "copied" | "cancelled" | "error";

/**
 * Share an event (native share sheet when available). Falls back to copying the URL.
 */
export async function shareEvent({
  id,
  title,
}: {
  id: number;
  title: string;
}): Promise<ShareEventResult> {
  const url = getEventShareUrl(id);
  const text = `Check out "${title}" on JOSCity`;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: title.slice(0, 200),
        text,
        url,
      });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "error";
  }
}
