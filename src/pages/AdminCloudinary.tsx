// Clouds
import { useCallback, useEffect, useState } from "react";
import { Cloud, Loader2 } from "lucide-react";
import {
  getCloudinaryAccounts,
  setActiveCloudinaryAccount,
  type CloudinaryAccount,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminCloudinary = () => {
  const [accounts, setAccounts] = useState<CloudinaryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCloudinaryAccounts();
      setAccounts(response.data?.accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Cloudinary accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = async (account: CloudinaryAccount) => {
    setSwitchingId(account.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await setActiveCloudinaryAccount(account.id);
      setAccounts(response.data?.accounts || []);
      setSuccess(`New uploads now go to ${account.label} (${account.cloud_name}).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch Cloudinary account");
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Cloud size={20} />
          Clry
        </h1>
      </div>
      <p className="admin-panel-lede">
        Choose which Cloudinary account receives new uploads. Files already uploaded stay where they
        are and keep showing for everyone.
      </p>

      {error ? <p className="admin-panel-status admin-panel-status--error">{error}</p> : null}
      {success ? <p className="admin-panel-status">{success}</p> : null}

      {loading ? (
        <p role="status">
          <Loader2 size={16} className="spin" /> Loading accounts…
        </p>
      ) : accounts.length === 0 ? (
        <p className="admin-panel-status">No Cloudinary accounts are configured on the server.</p>
      ) : (
        accounts.map((account) => (
          <div key={account.id} className="admin-panel-card">
            <h3 className="admin-panel-subtitle">
              {account.label} {account.active ? "(active for uploads)" : ""}
            </h3>
            <p>Cloud name: {account.cloud_name}</p>
            {account.active ? null : (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={switchingId !== null}
                onClick={() => void activate(account)}>
                {switchingId === account.id ? "Switching…" : "Use for new uploads"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AdminCloudinary;
