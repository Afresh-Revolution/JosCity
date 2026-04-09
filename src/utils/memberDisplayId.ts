/**
 * Deterministic "member code" derived from numeric user id — looks unique, not sequential.
 * Copy actions for APIs should still use the raw numeric id from getUserId() / user_id.
 */
export function formatMemberDisplayId(numericId: number): string {
  if (!Number.isFinite(numericId) || numericId <= 0) return "";
  let x = (numericId >>> 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  let n = x;
  for (let i = 0; i < 12; i++) {
    s += alphabet[n % alphabet.length];
    n = (Math.floor(n / alphabet.length) + numericId * (i + 17)) >>> 0;
  }
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}
