import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe, HelpCircle, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import {
  addAppLanguage,
  deleteAppLanguage,
  getAppLanguages,
  updateAppLanguage,
  type AppLanguageGroup,
  type AppLanguageRow,
} from "../services/adminApi";

type Props = {
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

const AdminAppLanguages = ({ onError, onSuccess }: Props) => {
  const [languages, setLanguages] = useState<AppLanguageRow[]>([]);
  const [english, setEnglish] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<AppLanguageGroup[]>([]);
  const [selected, setSelected] = useState("en");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const applyLanguages = useCallback((next: AppLanguageRow[], keepCode?: string) => {
    setLanguages(next);
    const code = keepCode && next.some((item) => item.code === keepCode) ? keepCode : next[0]?.code || "en";
    setSelected(code);
    const row = next.find((item) => item.code === code);
    setDraft(row?.translations || {});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      onError(null);
      const response = await getAppLanguages();
      if (!response.success || !response.data) {
        throw new Error("Failed to load languages");
      }
      setEnglish(response.data.english || {});
      setGroups(response.data.groups || []);
      applyLanguages(response.data.languages || [], selected);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to load languages.");
    } finally {
      setLoading(false);
    }
  }, [applyLanguages, onError, selected]);

  useEffect(() => {
    void load();
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = languages.find((item) => item.code === selected);

  const selectLanguage = (code: string) => {
    setSelected(code);
    const row = languages.find((item) => item.code === code);
    setDraft(row?.translations || {});
    onSuccess(null);
  };

  const handleAdd = async () => {
    try {
      setSaving(true);
      onError(null);
      onSuccess(null);
      const result = await addAppLanguage(newCode, newLabel);
      if (!result.success) throw new Error(result.message || "Could not add language");
      applyLanguages(result.data.languages, newCode.trim().toLowerCase());
      setNewCode("");
      setNewLabel("");
      onSuccess("Language added. Fill in the translations below, then save.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add language.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!current) return;
    try {
      setSaving(true);
      onError(null);
      onSuccess(null);
      const result = await updateAppLanguage(current.code, { translations: draft });
      if (!result.success) throw new Error(result.message || "Could not save translations");
      applyLanguages(result.data.languages, current.code);
      onSuccess(`${current.label} translations saved`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save translations.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (code: string) => {
    if (!window.confirm(`Remove ${code}? The app will fall back to English.`)) return;
    try {
      setSaving(true);
      onError(null);
      const result = await deleteAppLanguage(code);
      if (!result.success) throw new Error(result.message || "Could not remove language");
      applyLanguages(result.data.languages, "en");
      onSuccess("Language removed");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not remove language.");
    } finally {
      setSaving(false);
    }
  };

  const missingCount = useMemo(() => {
    if (!current || current.code === "en") return 0;
    return Object.keys(english).filter((key) => !String(draft[key] || "").trim()).length;
  }, [current, draft, english]);

  return (
    <section className="admin-settings__section">
      <h2 className="admin-settings__title">
        <Globe size={18} />
        App languages
        <button
          type="button"
          className="admin-settings__guide-btn"
          onClick={() => setGuideOpen(true)}
        >
          <HelpCircle size={16} />
          Guide
        </button>
      </h2>
      <p className="admin-settings__section-description">
        Languages added here appear in the JosCity app Preferences screen. The
        app translates navigation, Home, Explore, Messages, Profile and Wallet
        using the keys below. Empty fields keep English.
      </p>

      {loading ? (
        <div className="admin-settings__feature-loading">
          <Loader2 size={20} className="spinner" />
          Loading languages...
        </div>
      ) : (
        <>
          <div className="admin-settings__lang-add">
            <input
              className="admin-settings__input"
              placeholder="Code (ha, yo, fr)"
              value={newCode}
              maxLength={12}
              onChange={(event) => setNewCode(event.target.value)}
              disabled={saving}
            />
            <input
              className="admin-settings__input"
              placeholder="Language name"
              value={newLabel}
              maxLength={40}
              onChange={(event) => setNewLabel(event.target.value)}
              disabled={saving}
            />
            <button
              type="button"
              className="admin-settings__button"
              onClick={() => void handleAdd()}
              disabled={saving || !newCode.trim() || !newLabel.trim()}
            >
              <Plus size={16} />
              Add language
            </button>
          </div>

          <div className="admin-settings__lang-pills">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`admin-settings__lang-pill${
                  selected === item.code ? " admin-settings__lang-pill--on" : ""
                }`}
                onClick={() => selectLanguage(item.code)}
              >
                {item.label}
                <span>
                  {item.code === "en"
                    ? "source"
                    : `${item.translated_count}/${item.key_count}`}
                </span>
                {!item.is_default ? (
                  <span
                    role="button"
                    tabIndex={0}
                    className="admin-settings__lang-remove"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleRemove(item.code);
                    }}
                  >
                    <Trash2 size={12} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {current ? (
            <>
              <p className="admin-settings__section-description">
                Editing <strong>{current.label}</strong>
                {current.code === "en"
                  ? ". English is the fallback for every screen."
                  : missingCount
                    ? `. ${missingCount} phrase(s) still use English until you fill them.`
                    : ". All phrases have a translation."}
              </p>

              {groups.map((group) => (
                <div key={group.id} className="admin-settings__lang-group">
                  <h3>{group.label}</h3>
                  {group.keys.map((key) => (
                    <label key={key} className="admin-settings__lang-row">
                      <span>
                        <code>{key}</code>
                        <em>{english[key] || ""}</em>
                      </span>
                      <input
                        className="admin-settings__input"
                        value={draft[key] || ""}
                        placeholder={english[key] || ""}
                        onChange={(event) =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            [key]: event.target.value,
                          }))
                        }
                        disabled={saving}
                      />
                    </label>
                  ))}
                </div>
              ))}

              <div className="admin-settings__actions admin-settings__actions--footer">
                <button
                  type="button"
                  className="admin-settings__button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Save {current.label} translations
                </button>
              </div>
            </>
          ) : null}
        </>
      )}

      {guideOpen ? (
        <div className="admin-settings__guide" role="dialog" aria-label="Language guide">
          <div className="admin-settings__guide-card">
            <div className="admin-settings__guide-head">
              <h3>How to add a language</h3>
              <button type="button" onClick={() => setGuideOpen(false)} aria-label="Close guide">
                <X size={18} />
              </button>
            </div>
            <ol>
              <li>
                Enter a short code such as <code>ha</code>, <code>yo</code> or{" "}
                <code>fr</code>, plus the name users will see, then click{" "}
                <strong>Add language</strong>.
              </li>
              <li>
                Select that language above. Each row shows the English source
                phrase. Type the translation in the field next to it.
              </li>
              <li>
                Leave a field blank to keep English for that phrase. Click{" "}
                <strong>Save translations</strong> when you are done.
              </li>
              <li>
                The language appears in the app under Profile → Preferences.
                Users can switch it there; Home, Explore, Messages, Profile and
                Wallet update immediately.
              </li>
              <li>
                Use the trash icon to remove a language. English cannot be
                removed because it is the fallback.
              </li>
            </ol>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default AdminAppLanguages;
