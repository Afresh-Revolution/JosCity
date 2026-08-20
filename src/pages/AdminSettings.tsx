import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Settings,
  Save,
} from "lucide-react";
import {
  getSettings,
  updateSettings,
  settingsMapFromOptions,
  type SystemOption,
} from "../services/adminApi";
import AdminAppFeatures from "../components/AdminAppFeatures";
import "../main.css";
import "../scss/_admin.scss";

const APPROVAL_OPTION_NAMES = new Set([
  "registration_approval_required",
  "business_approval_required",
]);

const formatOptionLabel = (optionName: string): string =>
  optionName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const isOptionEnabled = (value: string): boolean =>
  value === "1" || value.toLowerCase() === "true";

const toOptionValue = (enabled: boolean): string => (enabled ? "1" : "0");

const AdminSettings: React.FC = () => {
  const [groupedSettings, setGroupedSettings] = useState<
    Record<string, SystemOption[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingOptionId, setTogglingOptionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSettings();
      if (!response.success || !response.data) {
        throw new Error("Failed to load settings");
      }
      setGroupedSettings(response.data);
    } catch (err) {
      console.error("Failed to load admin settings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load settings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateLocalOption = (optionId: number, optionValue: string) => {
    setGroupedSettings((prev) => {
      const next: Record<string, SystemOption[]> = {};
      for (const [group, options] of Object.entries(prev)) {
        next[group] = options.map((option) =>
          option.option_id === optionId
            ? { ...option, option_value: optionValue }
            : option
        );
      }
      return next;
    });
  };

  const persistOption = async (
    option: SystemOption,
    nextValue: string,
    successMessage: string
  ) => {
    setTogglingOptionId(option.option_id);
    setError(null);
    setSuccess(null);

    const previousValue = option.option_value;
    updateLocalOption(option.option_id, nextValue);

    try {
      const result = await updateSettings({
        [option.option_name]: nextValue,
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to update setting");
      }
      setSuccess(successMessage);
    } catch (err) {
      updateLocalOption(option.option_id, previousValue);
      setError(
        err instanceof Error ? err.message : "Failed to update setting."
      );
    } finally {
      setTogglingOptionId(null);
    }
  };

  const handleToggle = async (option: SystemOption) => {
    const nextValue = toOptionValue(!isOptionEnabled(option.option_value));
    await persistOption(
      option,
      nextValue,
      `${formatOptionLabel(option.option_name)} ${
        isOptionEnabled(nextValue) ? "enabled" : "disabled"
      }`
    );
  };

  const handleTextChange = (
    optionId: number,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateLocalOption(optionId, event.target.value);
    setSuccess(null);
  };

  const handleSaveGroup = async (groupName: string) => {
    const options = groupedSettings[groupName] || [];
    const textOptions = options.filter((option) => option.option_type !== "boolean");
    if (textOptions.length === 0) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const result = await updateSettings(
        settingsMapFromOptions(textOptions)
      );
      if (!result.success) {
        throw new Error(result.message || "Failed to save settings");
      }
      setSuccess(
        `${groupName.charAt(0).toUpperCase() + groupName.slice(1)} settings saved`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderBooleanToggle = (option: SystemOption) => {
    const enabled = isOptionEnabled(option.option_value);
    const isBusy = togglingOptionId === option.option_id;

    return (
      <div key={option.option_id} className="admin-settings__toggle-row">
        <div className="admin-settings__toggle-copy">
          <span className="admin-settings__toggle-label">
            {formatOptionLabel(option.option_name)}
          </span>
          {option.option_description && (
            <span className="admin-settings__toggle-description">
              {option.option_description}
            </span>
          )}
        </div>
        <button
          type="button"
          className={`admin-settings__toggle${enabled ? " admin-settings__toggle--on" : ""}`}
          onClick={() => handleToggle(option)}
          disabled={isBusy || saving}
          aria-pressed={enabled ? "true" : "false"}
          aria-label={`${formatOptionLabel(option.option_name)}: ${
            enabled ? "on" : "off"
          }`}
        >
          <span className="admin-settings__toggle-track">
            <span className="admin-settings__toggle-thumb">
              {isBusy ? <Loader2 size={12} className="spinner" /> : null}
            </span>
          </span>
          <span className="admin-settings__toggle-state">
            {enabled ? "On" : "Off"}
          </span>
        </button>
      </div>
    );
  };

  const renderTextField = (option: SystemOption) => {
    const isLongText =
      option.option_type === "textarea" ||
      option.option_name.includes("description");

    return (
      <div key={option.option_id} className="admin-settings__field">
        <label
          className="admin-settings__label"
          htmlFor={`option-${option.option_id}`}
        >
          {formatOptionLabel(option.option_name)}
        </label>
        {option.option_description && (
          <p className="admin-settings__hint">{option.option_description}</p>
        )}
        {isLongText ? (
          <textarea
            id={`option-${option.option_id}`}
            className="admin-settings__textarea"
            value={option.option_value}
            onChange={(event) => handleTextChange(option.option_id, event)}
            rows={4}
          />
        ) : (
          <input
            id={`option-${option.option_id}`}
            type={option.option_name.includes("email") ? "email" : "text"}
            className="admin-settings__input"
            value={option.option_value}
            onChange={(event) => handleTextChange(option.option_id, event)}
          />
        )}
      </div>
    );
  };

  const registrationOptions = groupedSettings.registration || [];
  const approvalOptions = registrationOptions.filter((option) =>
    APPROVAL_OPTION_NAMES.has(option.option_name)
  );
  const otherRegistrationOptions = registrationOptions.filter(
    (option) =>
      option.option_type === "boolean" &&
      !APPROVAL_OPTION_NAMES.has(option.option_name)
  );
  const generalOptions = groupedSettings.general || [];
  const generalTextOptions = generalOptions.filter(
    (option) => option.option_type !== "boolean"
  );
  const generalBooleanOptions = generalOptions.filter(
    (option) => option.option_type === "boolean"
  );

  return (
    <div className="admin-dashboard admin-settings">
      <div className="admin-dashboard__header">
        <h1>
          <Settings size={20} />
          Settings
        </h1>
      </div>

      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss success">
            <XCircle size={18} />
          </button>
        </div>
      )}

      <div className="admin-settings__form">
        <AdminAppFeatures onError={setError} onSuccess={setSuccess} />

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span className="admin-dashboard__loading-text">Loading settings...</span>
        </div>
      ) : (
        <>
          {approvalOptions.length > 0 && (
            <section className="admin-settings__section">
              <h2 className="admin-settings__title">Account Approval</h2>
              <p className="admin-settings__section-description">
                Control whether new account registrations require admin approval
                before users can sign in.
              </p>
              <div className="admin-settings__toggle-list">
                {approvalOptions.map(renderBooleanToggle)}
              </div>
            </section>
          )}

          {otherRegistrationOptions.length > 0 && (
            <section className="admin-settings__section">
              <h2 className="admin-settings__title">Registration</h2>
              <div className="admin-settings__toggle-list">
                {otherRegistrationOptions.map(renderBooleanToggle)}
              </div>
            </section>
          )}

          {(generalTextOptions.length > 0 || generalBooleanOptions.length > 0) && (
            <section className="admin-settings__section">
              <h2 className="admin-settings__title">General</h2>
              {generalTextOptions.map(renderTextField)}
              {generalBooleanOptions.length > 0 && (
                <div className="admin-settings__toggle-list">
                  {generalBooleanOptions.map(renderBooleanToggle)}
                </div>
              )}
            </section>
          )}

          {generalTextOptions.length > 0 && (
            <div className="admin-settings__actions admin-settings__actions--footer">
              <button
                type="button"
                className="admin-settings__button"
                onClick={() => handleSaveGroup("general")}
                disabled={saving || togglingOptionId !== null}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save General Settings
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default AdminSettings;
