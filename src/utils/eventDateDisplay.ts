/**
 * JosCity events are shown in a single display timezone so UI, emails, and DB
 * agree (avoids UTC server email showing a different hour than the browser).
 */
export const JOSCITY_EVENT_TIMEZONE = "Africa/Lagos";

/** ISO datetime for API: wall clock + browser offset so PostgreSQL timestamptz is unambiguous. */
export function buildEventDateTimeIsoFromForm(
  dateStr: string,
  time24: string,
): string {
  const [hStr, mStr] = time24.split(":");
  const hh = parseInt(hStr, 10);
  const mm = parseInt(mStr, 10);
  if (!dateStr || Number.isNaN(hh) || Number.isNaN(mm)) {
    return `${dateStr}T${time24}`;
  }
  const [y, mo, d] = dateStr.split("-").map(Number);
  const local = new Date(y, mo - 1, d, hh, mm, 0, 0);
  const offsetMin = -local.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, "0");
  const om = String(abs % 60).padStart(2, "0");
  const hhP = String(hh).padStart(2, "0");
  const mmP = String(mm).padStart(2, "0");
  return `${dateStr}T${hhP}:${mmP}:00${sign}${oh}:${om}`;
}

/** Format stored instant for cards / landing (Lagos wall time). */
export function formatEventDateTimeDisplay(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JOSCITY_EVENT_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatEventDateOnly(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JOSCITY_EVENT_TIMEZONE,
    dateStyle: "medium",
  }).format(d);
}

export function formatEventTimeOnly(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: JOSCITY_EVENT_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** Date + time parts for the edit form, aligned with Lagos display. */
export function getLagosFormPartsFromIso(iso: string | undefined | null): {
  dateStr: string;
  timeHour: string;
  timeMinute: string;
  timePeriod: "AM" | "PM";
} | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: JOSCITY_EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JOSCITY_EVENT_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);

  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value;
  const hour = get("hour");
  const minute = get("minute")?.padStart(2, "0") ?? "00";
  const dp = (get("dayPeriod") || "am").toLowerCase();
  const timePeriod: "AM" | "PM" = dp.startsWith("p") ? "PM" : "AM";

  if (!hour) return null;

  return {
    dateStr,
    timeHour: hour,
    timeMinute: minute,
    timePeriod,
  };
}
