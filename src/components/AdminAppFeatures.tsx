import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, Smartphone } from "lucide-react";
import {
  getAppFeatures,
  updateAppFeature,
  updateAppFeatures,
  type AppFeatureFlag,
} from "../services/adminApi";


type Props = {
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

const AdminAppFeatures = ({ onError, onSuccess }: Props) => {
  const [features, setFeatures] = useState<AppFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      onError(null);
      const response = await getAppFeatures();
      if (!response.success || !response.data) {
        throw new Error("Failed to load app features");
      }
      setFeatures(response.data);
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "Failed to load app features. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFeatures = (next: AppFeatureFlag[]) => {
    setFeatures(next);
  };

  const handleToggle = async (feature: AppFeatureFlag) => {
    const nextEnabled = !feature.enabled;
    setTogglingKey(feature.feature_key);
    onError(null);
    onSuccess(null);
    setFeatures((current) =>
      current.map((item) =>
        item.feature_key === feature.feature_key
          ? { ...item, enabled: nextEnabled }
          : item
      )
    );

    try {
      const result = await updateAppFeature({
        feature_key: feature.feature_key,
        enabled: nextEnabled,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to update feature");
      }
      if (result.data) applyFeatures(result.data);
      onSuccess(
        `${feature.title} is now ${nextEnabled ? "live in the app" : "coming soon"}`
      );
    } catch (err) {
      setFeatures((current) =>
        current.map((item) =>
          item.feature_key === feature.feature_key
            ? { ...item, enabled: feature.enabled }
            : item
        )
      );
      onError(err instanceof Error ? err.message : "Failed to update feature.");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleLabelChange = (featureKey: string, value: string) => {
    setFeatures((current) =>
      current.map((item) =>
        item.feature_key === featureKey
          ? { ...item, coming_soon_label: value }
          : item
      )
    );
    onSuccess(null);
  };

  const handleSaveLabels = async () => {
    try {
      setSaving(true);
      onError(null);
      onSuccess(null);
      const result = await updateAppFeatures(
        features.map((feature) => ({
          feature_key: feature.feature_key,
          coming_soon_label: feature.coming_soon_label,
        }))
      );
      if (!result.success) {
        throw new Error(result.message || "Failed to save labels");
      }
      if (result.data) applyFeatures(result.data);
      onSuccess("Coming soon labels saved");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save labels.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-settings__section">
      <h2 className="admin-settings__title">
        <Smartphone size={18} />
        Mobile app features
      </h2>
      <p className="admin-settings__section-description">
        Turn a feature on to make it live in the JosCity app. While it is off,
        the app shows the badge text you set below instead of opening the
        feature.
      </p>

      {loading ? (
        <div className="admin-settings__feature-loading">
          <Loader2 size={20} className="spinner" />
          Loading app features...
        </div>
      ) : (
        <>
          <div className="admin-settings__feature-list">
            {features.map((feature) => {
              const busy = togglingKey === feature.feature_key;
              const label = feature.coming_soon_label.trim() || "Coming soon";
              return (
                <article key={feature.feature_key} className="admin-settings__feature-card">
                  <div className="admin-settings__feature-header">
                    <div className="admin-settings__toggle-copy">
                      <span className="admin-settings__toggle-label">
                        {feature.title}
                      </span>
                      <span className="admin-settings__toggle-description">
                        {feature.description}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`admin-settings__toggle${
                        feature.enabled ? " admin-settings__toggle--on" : ""
                      }`}
                      onClick={() => void handleToggle(feature)}
                      disabled={busy || saving}
                      aria-pressed={feature.enabled ? "true" : "false"}
                      aria-label={`${feature.title}: ${feature.enabled ? "on" : "off"}`}
                    >
                      <span className="admin-settings__toggle-track">
                        <span className="admin-settings__toggle-thumb">
                          {busy ? <Loader2 size={12} className="spinner" /> : null}
                        </span>
                      </span>
                      <span className="admin-settings__toggle-state">
                        {feature.enabled ? "Live" : "Off"}
                      </span>
                    </button>
                  </div>

                  <div className="admin-settings__feature-label-field">
                    <label
                      className="admin-settings__label"
                      htmlFor={`coming-soon-${feature.feature_key}`}
                    >
                      Coming soon text
                    </label>
                    <div className="admin-settings__feature-label-row">
                      <input
                        id={`coming-soon-${feature.feature_key}`}
                        type="text"
                        className="admin-settings__input"
                        maxLength={40}
                        value={feature.coming_soon_label}
                        onChange={(event) =>
                          handleLabelChange(feature.feature_key, event.target.value)
                        }
                        placeholder="Coming soon"
                        disabled={saving}
                      />
                      <span className="admin-settings__feature-preview" aria-hidden="true">
                        {label}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="admin-settings__actions admin-settings__actions--footer">
            <button
              type="button"
              className="admin-settings__button"
              onClick={() => void handleSaveLabels()}
              disabled={saving || togglingKey !== null || features.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save coming soon text
                </>
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminAppFeatures;
