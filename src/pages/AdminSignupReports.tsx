import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, FileText, Loader2, XCircle } from "lucide-react";
import {
  getSignupReportWeeks,
  getWeeklySignupReport,
  downloadWeeklySignupReportCsv,
  type SignupReportWeek,
  type WeeklySignupReport,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

/** Parses a "YYYY-MM-DD" string as a local calendar date (avoids the UTC-midnight
 *  pitfall of `new Date("YYYY-MM-DD")`). */
function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatWeekLabel(week: SignupReportWeek): string {
  const start = parseDateOnly(week.week_start);
  const end = parseDateOnly(week.week_end);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const suffix = week.is_current ? " (in progress)" : "";
  return `${startLabel} – ${endLabel} · ${week.total_signups} signup${
    week.total_signups === 1 ? "" : "s"
  }${suffix}`;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = parseDateOnly(weekStart);
  const end = parseDateOnly(weekEnd);
  const startLabel = start.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

function formatSignedUpAt(value: string): string {
  // signed_up_at has no timezone suffix, so the JS engine parses it as local
  // wall-clock time — formatting it locally round-trips with no shift.
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const AdminSignupReports = () => {
  const [weeks, setWeeks] = useState<SignupReportWeek[]>([]);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [report, setReport] = useState<WeeklySignupReport | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setWeeksLoading(true);
        const response = await getSignupReportWeeks(12);
        if (!response.success) throw new Error("Could not load the list of weeks");
        setWeeks(response.data);
        setSelectedWeek((current) => {
          if (current) return current;
          const lastCompleted = response.data.find((week) => !week.is_current);
          return (lastCompleted || response.data[0])?.week_start || "";
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load the list of weeks");
      } finally {
        setWeeksLoading(false);
      }
    })();
  }, []);

  const loadReport = useCallback(async () => {
    if (!selectedWeek) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getWeeklySignupReport({ weekStart: selectedWeek, page, limit: 50 });
      if (!response.success) throw new Error("Could not load the signup report");
      setReport(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the signup report");
    } finally {
      setLoading(false);
    }
  }, [selectedWeek, page]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handleWeekChange = (weekStart: string) => {
    setSelectedWeek(weekStart);
    setPage(1);
  };

  const handleExport = async () => {
    if (!report) return;
    try {
      setExporting(true);
      setError(null);
      await downloadWeeklySignupReportCsv(report.week_start);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export this report");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = report ? Math.max(1, Math.ceil(report.total_signups / report.limit)) : 1;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <FileText size={20} />
          Signup Reports
        </h1>
      </div>

      {error ? (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            <XCircle size={18} />
          </button>
        </div>
      ) : null}

      <div className="admin-signup-reports__toolbar">
        <div className="admin-signup-reports__week-select">
          <select
            value={selectedWeek}
            disabled={weeksLoading || weeks.length === 0}
            onChange={(event) => handleWeekChange(event.target.value)}
          >
            {weeks.map((week) => (
              <option key={week.week_start} value={week.week_start}>
                {formatWeekLabel(week)}
              </option>
            ))}
          </select>
          {report?.is_current ? (
            <span className="admin-signup-reports__badge">Week in progress</span>
          ) : null}
        </div>

        <button
          type="button"
          className="admin-signup-reports__export"
          onClick={() => void handleExport()}
          disabled={!report || report.signups.length === 0 || exporting}
          title={
            report?.is_current
              ? "You can export now, but this week isn't finished yet"
              : "Export this week's signups as CSV"
          }
        >
          {exporting ? <Loader2 size={16} className="spinner" /> : <Download size={16} />}
          Export CSV
        </button>
      </div>

      {loading || !report ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span className="admin-dashboard__loading-text">Loading signup report...</span>
        </div>
      ) : (
        <>
          <div className="admin-signup-reports__summary">
            <div>
              <strong>{report.total_signups}</strong>
              <span>Total signups</span>
            </div>
            <div>
              <strong>{formatWeekRange(report.week_start, report.week_end)}</strong>
              <span>{report.is_current ? "Current week" : "Week"}</span>
            </div>
            <div>
              <strong>{report.signups.filter((row) => row.referred_by_name).length}</strong>
              <span>Referred signups (this page)</span>
            </div>
          </div>

          {report.signups.length === 0 ? (
            <p className="admin-signup-reports__empty">No signups recorded for this week.</p>
          ) : (
            <div className="admin-signup-reports__table-wrap">
              <table className="admin-signup-reports__table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Signed up</th>
                    <th>Referred by</th>
                  </tr>
                </thead>
                <tbody>
                  {report.signups.map((row) => (
                    <tr key={row.user_id}>
                      <td>
                        <strong>{row.name || `User #${row.user_id}`}</strong>
                        <span>#{row.user_id}</span>
                      </td>
                      <td>{row.username || "—"}</td>
                      <td>{row.email || "—"}</td>
                      <td>{formatSignedUpAt(row.signed_up_at)}</td>
                      <td>
                        {row.referred_by_name ? (
                          row.referred_by_name
                        ) : (
                          <span className="admin-signup-reports__referrer">Not referred</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="admin-signup-reports__pager">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={!report.has_more || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AdminSignupReports;
