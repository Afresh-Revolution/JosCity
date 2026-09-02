import { useEffect, useState } from "react";

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function ymd(year: number, monthIndex: number, day: number) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

/**
 * Calendar expiry day. The API sometimes sends a Date sliced to
 * "Fri Oct 02" (no year) instead of YYYY-MM-DD.
 */
export function toCalendarDate(expiresAt: string | null | undefined): string | null {
  const raw = String(expiresAt || "").trim();
  if (!raw) return null;

  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const named = raw.match(
    /(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/
  );
  if (named) {
    const monthIndex = MONTHS[named[1].slice(0, 3).toLowerCase()];
    const day = Number(named[2]);
    if (monthIndex != null && day >= 1 && day <= 31) {
      const year = named[3] ? Number(named[3]) : new Date().getFullYear();
      return ymd(year, monthIndex, day);
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 2020) return null;
  return ymd(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatExpiryLabel(expiresAt: string | null | undefined): string | null {
  const date = toCalendarDate(expiresAt);
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function msUntilEndOfDay(expiresAt: string | null | undefined): number {
  const date = toCalendarDate(expiresAt);
  if (!date) return 0;
  const end = new Date(`${date}T23:59:59.999`);
  const ms = end.getTime() - Date.now();
  return Number.isFinite(ms) ? Math.max(0, ms) : 0;
}

export function splitCountdown(ms: number) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: totalSeconds <= 0 };
}

export function useExpiryCountdown(expiresAt: string | null | undefined) {
  const [ms, setMs] = useState(() => msUntilEndOfDay(expiresAt));

  useEffect(() => {
    setMs(msUntilEndOfDay(expiresAt));
    const id = window.setInterval(() => {
      setMs(msUntilEndOfDay(expiresAt));
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return splitCountdown(ms);
}

function FlipUnit({
  value,
  label,
  live = false,
}: {
  value: number;
  label: string;
  live?: boolean;
}) {
  const display = pad2(value);
  return (
    <div
      className={`membership-countdown__unit${live ? " membership-countdown__unit--live" : ""}`}
    >
      <div className="membership-countdown__face">
        <span key={display} className="membership-countdown__value">
          {display}
        </span>
      </div>
      <span className="membership-countdown__unit-label">{label}</span>
    </div>
  );
}

function Colon() {
  return (
    <span className="membership-countdown__colon" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

type Props = {
  expiresAt: string | null | undefined;
  cancelled?: boolean;
  className?: string;
};

export default function MembershipCountdown({
  expiresAt,
  cancelled = false,
  className = "",
}: Props) {
  const { days, hours, minutes, seconds, expired } = useExpiryCountdown(expiresAt);
  const endsOn = formatExpiryLabel(expiresAt);
  const urgency =
    expired ? "expired" : days < 1 ? "critical" : days <= 5 ? "soon" : "ok";

  return (
    <div
      className={`membership-countdown membership-countdown--${urgency} ${className}`.trim()}
      role="timer"
      aria-live="polite"
      aria-label={
        expired
          ? "Membership expired"
          : cancelled
            ? `Paid benefits remaining: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
            : `Expires in ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
      }
    >
      <div className="membership-countdown__label">
        <span className="membership-countdown__pulse" aria-hidden="true" />
        <span>
          {expired ? "Plan ended" : cancelled ? "Benefits remaining" : "Time remaining"}
        </span>
      </div>

      {expired ? (
        <p className="membership-countdown__ended">
          {endsOn ? `Expired ${endsOn}` : "This plan has expired"}
        </p>
      ) : (
        <>
          <div className="membership-countdown__clock">
            <FlipUnit value={days} label="Days" />
            <Colon />
            <FlipUnit value={hours} label="Hrs" />
            <Colon />
            <FlipUnit value={minutes} label="Min" />
            <Colon />
            <FlipUnit value={seconds} label="Sec" live />
          </div>
          {endsOn ? (
            <p className="membership-countdown__until">
              {cancelled ? `Paid through ${endsOn} · no renewal` : `Ends ${endsOn}`}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
