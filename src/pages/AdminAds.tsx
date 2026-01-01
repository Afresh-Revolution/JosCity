import React, { useState, useEffect } from "react";
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Plus,
  Edit,
} from "lucide-react";
import {
  getUsersAds,
  approveUserAd,
  declineUserAd,
  getSystemAds,
  deleteSystemAd,
  type UserAd,
  type SystemAd,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminAds: React.FC = () => {
  const [userAds, setUserAds] = useState<UserAd[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "system">("users");
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
      if (activeTab === "users") {
        const response = await getUsersAds();
        setUserAds(response.data || []);
      } else {
        const response = await getSystemAds();
        setSystemAds(response.data || []);
      }
    } catch (err) {
      console.error("Failed to load ads:", err);
      // Don't set error if it's just an empty result
      if (activeTab === "users") {
        setUserAds([]);
      } else {
        setSystemAds([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    adId: string,
    action: string,
    actionFn: (id: string) => Promise<any>
  ) => {
    try {
      setProcessing(adId);
      setError(null);
      setSuccess(null);
      await actionFn(adId);
      setSuccess(`Ad ${action} successfully`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} ad`);
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
          <BarChart3 size={20} />
          Ads Management
        </h1>
        {activeTab === "system" && (
          <button
            className="admin-action-btn admin-action-btn--primary"
            onClick={() => {
              // TODO: Implement create modal
            }}
          >
            <Plus size={16} />
            Create System Ad
          </button>
        )}
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Ads
        </button>
        <button
          className={`admin-tab ${activeTab === "system" ? "active" : ""}`}
          onClick={() => setActiveTab("system")}
        >
          System Ads
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
          <span>Loading ads...</span>
        </div>
      ) : (
        <>
          {activeTab === "users" ? (
            <div className="admin-ads-grid">
              {userAds.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <BarChart3 size={48} />
                  <p>No user ads yet</p>
                </div>
              ) : (
                userAds.map((ad) => (
                  <div key={ad.ad_id} className="admin-ad-card">
                    <div className="admin-ad-card__header">
                      <h4>{ad.title}</h4>
                      <span className={`badge badge--${ad.status}`}>
                        {ad.status}
                      </span>
                    </div>
                    <div className="admin-ad-card__content">
                      <p>{ad.description}</p>
                      <span>User ID: {ad.user_id}</span>
                      <span>Created: {formatDate(ad.created_at)}</span>
                    </div>
                    <div className="admin-ad-card__actions">
                      {ad.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleAction(ad.ad_id, "approve", approveUserAd)
                            }
                            disabled={processing === ad.ad_id}
                            className="admin-action-btn admin-action-btn--approve"
                          >
                            {processing === ad.ad_id ? (
                              <Loader2 size={16} className="spinner" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAction(ad.ad_id, "decline", declineUserAd)
                            }
                            disabled={processing === ad.ad_id}
                            className="admin-action-btn admin-action-btn--reject"
                          >
                            {processing === ad.ad_id ? (
                              <Loader2 size={16} className="spinner" />
                            ) : (
                              <XCircle size={16} />
                            )}
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="admin-ads-grid">
              {systemAds.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <BarChart3 size={48} />
                  <p>No system ads yet</p>
                </div>
              ) : (
                systemAds.map((ad) => (
                  <div key={ad.ad_id} className="admin-ad-card">
                    <div className="admin-ad-card__header">
                      <h4>{ad.title}</h4>
                      <span
                        className={`badge ${
                          ad.active ? "badge--active" : "badge--inactive"
                        }`}
                      >
                        {ad.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="admin-ad-card__content">
                      <p>{ad.description}</p>
                      {ad.image_url && (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="admin-ad-card__image"
                        />
                      )}
                      <span>Created: {formatDate(ad.created_at)}</span>
                    </div>
                    <div className="admin-ad-card__actions">
                      <button className="admin-action-btn admin-action-btn--edit">
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleAction(ad.ad_id, "delete", deleteSystemAd)
                        }
                        disabled={processing === ad.ad_id}
                        className="admin-action-btn admin-action-btn--delete"
                      >
                        {processing === ad.ad_id ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAds;
