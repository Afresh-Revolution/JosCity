export function parseMoneyInput(value?: string | number | null): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const cleaned = String(value)
    .trim()
    .replace(/^(NGN|₦)/i, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function formatMoneyInput(value?: string | number | null): string {
  if (value == null || value === "") return "";
  const raw = String(value);
  const negative = /^\s*-/.test(raw.replace(/[₦,\s]/g, ""));
  let cleaned = raw
    .replace(/^(NGN|₦)/i, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "");
  cleaned = cleaned.replace(/[^\d.]/g, "");
  if (!cleaned) return negative ? "-" : "";
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, "")}`;
  }
  const endsWithDot = cleaned.endsWith(".");
  const [wholePart, fracPart] = cleaned.split(".");
  const whole = wholePart.replace(/^0+(?=\d)/, "") || "0";
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let next = grouped;
  if (endsWithDot) next = `${grouped}.`;
  else if (fracPart != null) next = `${grouped}.${fracPart.slice(0, 2)}`;
  return negative ? `-${next}` : next;
}
