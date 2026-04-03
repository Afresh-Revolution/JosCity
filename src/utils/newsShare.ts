/** Canonical URL for a published news item (opens News page and scrolls to the article). */
function getNewsArticleShareUrl(id: number): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/news?article=${encodeURIComponent(String(id))}`;
}

export type ShareNewsResult = "shared" | "copied" | "cancelled" | "error";

/**
 * Share a news story (native share sheet when available — Messages, email, etc.).
 * Falls back to copying the article URL to the clipboard.
 */
export async function shareNewsArticle({
  id,
  title,
}: {
  id: number;
  title: string;
}): Promise<ShareNewsResult> {
  const url = getNewsArticleShareUrl(id);
  const text = `Read "${title}" on JOSCity`;

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
