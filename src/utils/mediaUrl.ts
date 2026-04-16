/**
 * Blob URLs from URL.createObjectURL are only valid in the same document session
 * and must never be persisted. Detect them for safe display and API payloads.
 */
export function isBlobUrl(url: string | undefined | null): boolean {
  if (url == null || typeof url !== "string") return false;
  return url.trim().toLowerCase().startsWith("blob:");
}

export function eventCoverForDisplay(
  url: string | undefined | null,
  fallback: string,
): string {
  const t = url != null && typeof url === "string" ? url.trim() : "";
  if (!t || isBlobUrl(t)) return fallback;
  return t;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("Failed to read image"));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}
