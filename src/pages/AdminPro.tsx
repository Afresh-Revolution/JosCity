import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  Package,
  Users,
} from "lucide-react";
import {
  getPackages,
  deletePackage,
  getSubscribers,
  type ProPackage,
  type ProSubscriber,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminPro: React.FC = () => {
  const [packages, setPackages] = useState<ProPackage[]>([]);
  const [subscribers, setSubscribers] = useState<ProSubscriber[]>([]);
  const [activeTab, setActiveTab] = useState<"packages" | "subscribers">("packages");
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
      if (activeTab === "packages") {
        const response = await getPackages();
        setPackages(response.data);
      } else {
        const response = await getSubscribers();
        setSubscribers(response.data);
      }
    } catch (err) {
      console.error("Failed to load pro data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (packageId: string) => {
    try {
      setProcessing(packageId);
      setError(null);
      setSuccess(null);
      await deletePackage(packageId);
      setSuccess("Package deleted successfully");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete package");
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
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
          <TrendingUp size={20} />
          Pro System Management
        </h1>
        {activeTab === "packages" && (
          <button className="admin-action-btn admin-action-btn--primary">
            <Plus size={16} />
            Create Package
          </button>
        )}
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "packages" ? "active" : ""}`}
          onClick={() => setActiveTab("packages")}
        >
          <Package size={16} />
          Packages
        </button>
        <button
          className={`admin-tab ${activeTab === "subscribers" ? "active" : ""}`}
          onClick={() => setActiveTab("subscribers")}
        >
          <Users size={16} />
          Subscribers
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
          <span>Loading pro system data...</span>
        </div>
      ) : (
        <>
          {activeTab === "packages" ? (
            <div className="admin-pro-packages-grid">
              {packages.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <Package size={48} />
                  <p>No packages yet</p>
                </div>
              ) : (
                packages.map((pkg) => (
                  <div key={pkg.package_id} className="admin-pro-package-card">
                    <div className="admin-pro-package-card__header">
                      <h3>{pkg.name}</h3>
                      <span className={`badge ${pkg.active ? "badge--active" : "badge--inactive"}`}>
                        {pkg.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="admin-pro-package-card__content">
                      <p>{pkg.description}</p>
                      <div className="admin-pro-package-card__price">
                        {formatCurrency(pkg.price)} / {pkg.duration} days
                      </div>
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="admin-pro-package-card__features">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="admin-pro-package-card__actions">
                      <button className="admin-action-btn admin-action-btn--edit">
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.package_id)}
                        disabled={processing === pkg.package_id}
                        className="admin-action-btn admin-action-btn--delete"
                      >
                        {processing === pkg.package_id ? (
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
          ) : (
            <div className="admin-pro-subscribers-list">
              {subscribers.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <Users size={48} />
                  <p>No subscribers yet</p>
                </div>
              ) : (
                subscribers.map((subscriber) => (
                  <div key={subscriber.subscription_id} className="admin-pro-subscriber-card">
                    <div className="admin-pro-subscriber-card__header">
                      <h4>Subscription #{subscriber.subscription_id}</h4>
                      <span className={`badge badge--${subscriber.status}`}>
                        {subscriber.status}
                      </span>
                    </div>
                    <div className="admin-pro-subscriber-card__content">
                      <p>User ID: {subscriber.user_id}</p>
                      <p>Package ID: {subscriber.package_id}</p>
                      <p>Start: {formatDate(subscriber.start_date)}</p>
                      <p>End: {formatDate(subscriber.end_date)}</p>
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

export default AdminPro;

