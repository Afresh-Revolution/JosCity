/**
 * Resolve creator user id from API event payloads (JOSCITY uses `event_admin` on the server).
 */
export function pickEventCreatorUserId(event: unknown): number | undefined {
  if (!event || typeof event !== "object") return undefined;
  const e = event as Record<string, unknown>;
  const tryOne = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) {
      const n = Number(v);
      if (n > 0) return n;
    }
    return undefined;
  };
  return (
    tryOne(e.event_admin) ??
    tryOne(e.user_id) ??
    tryOne(e.created_by) ??
    tryOne(e.creator_id) ??
    tryOne(e.organizer_id) ??
    tryOne(e.event_user_id) ??
    tryOne(e.userId)
  );
}
