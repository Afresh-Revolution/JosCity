import React, { useEffect, useState } from "react";
import {
  Search,
  Flag,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getSafetyReports,
  updateSafetyReport,
  escalateSafetyReport,
  type SafetyReport,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSafetyReports({ page, limit: 20 });
      setReports(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      const nextNotes: Record<number, string> = {};
      for (const row of response.data || []) {
        nextNotes[row.report_id] = row.admin_notes || "";
      }
      setNotes(nextNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, [page]);

  const filtered = reports.filter((report) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      report.reason?.toLowerCase().includes(q) ||
      report.content_type?.toLowerCase().includes(q) ||
      String(report.content_id || "").includes(q) ||
      report.reporter_name?.toLowerCase().includes(q)
    );
  });

  const act = async (id: number, fn: () => Promise<{ success: boolean; message: string }>) => {
    try {
      setProcessing(id);
      setError(null);
      const result = await fn();
      setSuccess(result.message);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Flag size={20} />
          Safety reports
        </h1>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Flag size={48} />
          <p>No reports yet</p>
        </div>
      ) : (
        <>
          <div className="admin-reports-list">
            {filtered.map((report) => (
              <div
                key={report.report_id}
                className={`admin-report-card ${
                  report.priority === "high" ? "admin-report-card--high" : ""
                }`}
              >
                <div className="admin-report-card__header">
                  <div className="admin-report-card__info">
                    <h4>Report #{report.report_id}</h4>
                    <span className="admin-report-card__date">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  {report.priority === "high" ? (
                    <span className="admin-report-card__priority">HIGH PRIORITY</span>
                  ) : null}
                  <span className="badge">{report.status}</span>
                </div>

                <div className="admin-report-card__content">
                  <p>
                    <strong>Reason:</strong> {report.reason.replace("_", " ")}
                  </p>
                  <div className="admin-report-card__meta">
                    <span>Type: {report.content_type}</span>
                    <span>Reference: {report.evidence_ref || report.content_id || "general"}</span>
                    <span>Reporter: {report.reporter_name || report.reporter_id}</span>
                    {report.reported_user_id ? (
                      <span>Reported account: {report.reported_name || report.reported_user_id}</span>
                    ) : null}
                  </div>
                  {report.description ? (
                    <p>
                      <strong>Details:</strong> {report.description}
                    </p>
                  ) : null}
                  <p className="admin-report-card__date">
                    Media is not shown here. Use the content reference in a secure review process.
                  </p>
                  <textarea
                    rows={3}
                    value={notes[report.report_id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [report.report_id]: e.target.value }))
                    }
                    placeholder="Internal notes"
                  />
                </div>

                <div className="admin-report-card__actions">
                  <button
                    className="admin-action-btn"
                    disabled={processing === report.report_id}
                    onClick={() =>
                      void act(report.report_id, () =>
                        updateSafetyReport(report.report_id, {
                          status: "reviewing",
                          admin_notes: notes[report.report_id],
                        })
                      )
                    }
                  >
                    Review
                  </button>
                  <button
                    className="admin-action-btn"
                    disabled={processing === report.report_id}
                    onClick={() =>
                      void act(report.report_id, () =>
                        updateSafetyReport(report.report_id, {
                          status: "actioned",
                          admin_notes: notes[report.report_id],
                        })
                      )
                    }
                  >
                    Record action
                  </button>
                  <button
                    className="admin-action-btn"
                    disabled={processing === report.report_id}
                    onClick={() =>
                      void act(report.report_id, () =>
                        updateSafetyReport(report.report_id, {
                          status: "dismissed",
                          admin_notes: notes[report.report_id],
                        })
                      )
                    }
                  >
                    Dismiss
                  </button>
                  {report.priority === "high" ? (
                    <button
                      className="admin-action-btn"
                      disabled={processing === report.report_id}
                      onClick={() =>
                        void act(report.report_id, () =>
                          escalateSafetyReport(report.report_id)
                        )
                      }
                    >
                      Escalate internally
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-pagination__btn"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-pagination__btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReports;
