import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Shield,
  User,
  Flag,
} from "lucide-react";
import {
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  getVerifiedUsers,
  getVerifiedPages,
  removeVerification,
  type VerificationRequest,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminVerification: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"requests" | "users" | "pages">("requests");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "requests") {
        const response = await getVerificationRequests();
        setRequests(response.data);
      } else if (activeTab === "users") {
        const response = await getVerifiedUsers();
        setRequests(response.data as any);
      } else if (activeTab === "pages") {
        const response = await getVerifiedPages();
        setRequests(response.data as any);
      }
    } catch (err) {
      console.error("Failed to load verification data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    requestId: string,
    action: "approve" | "reject" | "remove",
    actionFn: (id: string) => Promise<any>
  ) => {
    try {
      setProcessing(requestId);
      setError(null);
      setSuccess(null);
      await actionFn(requestId);
      setSuccess(`Verification ${action}d successfully`);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} verification`
      );
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Shield size={20} />
          Verification Management
        </h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Pending Requests
        </button>
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Verified Users
        </button>
        <button
          className={`admin-tab ${activeTab === "pages" ? "active" : ""}`}
          onClick={() => setActiveTab("pages")}
        >
          Verified Pages
        </button>
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
          <span>Loading verification data...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Shield size={48} />
          <p>
            {activeTab === "requests"
              ? "No pending verification requests"
              : `No verified ${activeTab}`}
          </p>
        </div>
      ) : (
        <div className="admin-verification-list">
          {requests.map((request) => (
            <div key={request.request_id || (request as any).user_id || (request as any).page_id} className="admin-verification-card">
              <div className="admin-verification-card__header">
                {activeTab === "requests" ? (
                  <Shield size={24} />
                ) : activeTab === "users" ? (
                  <User size={24} />
                ) : (
                  <Flag size={24} />
                )}
                <div className="admin-verification-card__info">
                  <h4>
                    {activeTab === "requests"
                      ? `Request #${request.request_id}`
                      : activeTab === "users"
                      ? `User #${(request as any).user_id}`
                      : `Page #${(request as any).page_id}`}
                  </h4>
                  {activeTab === "requests" && (
                    <span className="admin-verification-card__date">
                      Submitted: {formatDate(request.submitted_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="admin-verification-card__actions">
                {activeTab === "requests" && (
                  <>
                    <button
                      onClick={() =>
                        handleAction(
                          request.request_id,
                          "approve",
                          approveVerification
                        )
                      }
                      disabled={processing === request.request_id}
                      className="admin-action-btn admin-action-btn--approve"
                    >
                      {processing === request.request_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleAction(
                          request.request_id,
                          "reject",
                          rejectVerification
                        )
                      }
                      disabled={processing === request.request_id}
                      className="admin-action-btn admin-action-btn--reject"
                    >
                      {processing === request.request_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>
                  </>
                )}
                {(activeTab === "users" || activeTab === "pages") && (
                  <button
                    onClick={() =>
                      handleAction(
                        activeTab === "users"
                          ? (request as any).user_id
                          : (request as any).page_id,
                        "remove",
                        (id) => removeVerification(activeTab === "users" ? "user" : "page", id)
                      )
                    }
                    disabled={
                      processing ===
                      (activeTab === "users"
                        ? (request as any).user_id
                        : (request as any).page_id)
                    }
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing ===
                    (activeTab === "users"
                      ? (request as any).user_id
                      : (request as any).page_id) ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Remove Verification
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerification;

