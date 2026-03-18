import React, { useState, useEffect } from "react";
import {
  Search,
  Flag,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  getReports,
  markReportSeen,
  deleteReport,
  type Report,
  type ReportsResponse,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadReports();
  }, [page]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ReportsResponse = await getReports({
        page,
        limit: 20,
      });
      setReports(response.data);
      setFilteredReports(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReports(reports);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredReports(
        reports.filter(
          (report) =>
            report.reason?.toLowerCase().includes(query) ||
            report.node_id?.includes(query)
        )
      );
    }
  }, [searchQuery, reports]);

  const handleMarkSeen = async (reportId: string) => {
    try {
      setProcessing(reportId);
      setError(null);
      setSuccess(null);
      await markReportSeen(reportId);
      setSuccess("Report marked as seen");
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark report as seen");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      setProcessing(reportId);
      setError(null);
      setSuccess(null);
      await deleteReport(reportId);
      setSuccess("Report deleted successfully");
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Flag size={20} />
          Reports Management
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
      ) : filteredReports.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Flag size={48} />
          <p>No reports yet</p>
        </div>
      ) : (
        <>
          <div className="admin-reports-list">
            {filteredReports.map((report) => (
              <div
                key={report.report_id}
                className={`admin-report-card ${report.seen === "0" ? "unseen" : ""}`}
              >
                <div className="admin-report-card__header">
                  <div className="admin-report-card__info">
                    <h4>Report #{report.report_id}</h4>
                    <span className="admin-report-card__date">
                      {formatDate(report.time)}
                    </span>
                  </div>
                  {report.seen === "0" && (
                    <span className="badge badge--pending">New</span>
                  )}
                </div>

                <div className="admin-report-card__content">
                  <p className="admin-report-card__reason">
                    <strong>Reason:</strong> {report.reason}
                  </p>
                  <div className="admin-report-card__meta">
                    <span>Type: {report.node_type}</span>
                    <span>Node ID: {report.node_id}</span>
                    <span>Reporter ID: {report.reporter_id}</span>
                  </div>
                </div>

                <div className="admin-report-card__actions">
                  {report.seen === "0" && (
                    <button
                      onClick={() => handleMarkSeen(report.report_id)}
                      disabled={processing === report.report_id}
                      className="admin-action-btn admin-action-btn--view"
                    >
                      {processing === report.report_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <Eye size={16} />
                      )}
                      Mark Seen
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(report.report_id)}
                    disabled={processing === report.report_id}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === report.report_id ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
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

