import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  getMembershipSettings,
  updateMembershipSettings,
  getMembershipBadgeColors,
  saveMembershipBadgeColor,
  type MembershipPlanItem,
  type MembershipPlanSettings,
  type MembershipSettings,
} from "../services/adminApi";
import { DEFAULT_MEMBERSHIP_SETTINGS } from "../services/membershipApi";
import AdminBadgeColorField from "./AdminBadgeColorField";

type Props = {
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

type PriceDraft = {
  id: string;
  title: string;
  amount: string;
  description: string;
};

const MAX_ITEMS = 20;

const formatAmountInput = (amount: number): string => {
  if (!Number.isFinite(amount) || amount === 0) return "";
  return String(amount);
};

const parseAmount = (value: string): number => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid membership amount of 0 or more.");
  }
  return Math.round(amount * 100) / 100;
};

const newDraft = (): PriceDraft => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: "",
  amount: "",
  description: "",
});

const toDrafts = (plan: MembershipPlanSettings): PriceDraft[] => {
  const source =
    plan.items && plan.items.length
      ? plan.items
      : [{ id: "primary", amount: plan.amount, description: plan.description }];
  return source.map((item, index) => ({
    id: String(item.id || `item-${index + 1}`),
    title: String(item.title || ""),
    amount: formatAmountInput(Number(item.amount || 0)),
    description: String(item.description || ""),
  }));
};

const toItems = (drafts: PriceDraft[]): MembershipPlanItem[] =>
  drafts.map((item) => ({
    id: item.id,
    title: item.title.trim(),
    amount: parseAmount(item.amount),
    description: item.description.trim(),
  }));

const AdminMembership = ({ onError, onSuccess }: Props) => {
  const [settings, setSettings] = useState<MembershipSettings>(
    DEFAULT_MEMBERSHIP_SETTINGS
  );
  const [personalItems, setPersonalItems] = useState<PriceDraft[]>([newDraft()]);
  const [businessItems, setBusinessItems] = useState<PriceDraft[]>([newDraft()]);
  const [packageColors, setPackageColors] = useState<Record<string, string>>({});
  const [colorSaving, setColorSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const applySettings = (next: MembershipSettings) => {
    setSettings(next);
    setPersonalItems(toDrafts(next.personal));
    setBusinessItems(toDrafts(next.business));
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      onError(null);
      const response = await getMembershipSettings();
      if (!response.success || !response.data) {
        throw new Error("Failed to load membership settings");
      }
      applySettings(response.data);
      const colors = await getMembershipBadgeColors().catch(() => ({
        success: false,
        data: [],
      }));
      const mapped: Record<string, string> = {};
      for (const row of colors.data || []) {
        mapped[row.package_id] = row.badge_color;
      }
      setPackageColors(mapped);
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "Failed to load membership settings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePersonalToggle = async () => {
    const nextEnabled = !settings.personal.enabled;
    setToggling(true);
    onError(null);
    onSuccess(null);
    setSettings((current) => ({
      ...current,
      personal: { ...current.personal, enabled: nextEnabled },
    }));

    try {
      const result = await updateMembershipSettings({
        personal: { enabled: nextEnabled },
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to update membership");
      }
      if (result.data) applySettings(result.data);
      onSuccess(
        nextEnabled
          ? "Personal account membership is now on"
          : "Personal account membership is now off"
      );
    } catch (err) {
      setSettings((current) => ({
        ...current,
        personal: { ...current.personal, enabled: !nextEnabled },
      }));
      onError(
        err instanceof Error ? err.message : "Failed to update membership."
      );
    } finally {
      setToggling(false);
    }
  };

  const updateItem = (
    accountType: "personal" | "business",
    itemId: string,
    field: keyof Pick<PriceDraft, "title" | "amount" | "description">,
    value: string
  ) => {
    const setter = accountType === "personal" ? setPersonalItems : setBusinessItems;
    setter((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
    onSuccess(null);
  };

  const addItem = (accountType: "personal" | "business") => {
    const setter = accountType === "personal" ? setPersonalItems : setBusinessItems;
    setter((current) =>
      current.length >= MAX_ITEMS ? current : [...current, newDraft()]
    );
    onSuccess(null);
  };

  const removeItem = (accountType: "personal" | "business", itemId: string) => {
    const setter = accountType === "personal" ? setPersonalItems : setBusinessItems;
    setter((current) => (current.length <= 1 ? current : current.filter((item) => item.id !== itemId)));
    onSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      onError(null);
      onSuccess(null);
      const personalParsed = toItems(personalItems);
      const businessParsed = toItems(businessItems);
      const result = await updateMembershipSettings({
        personal: {
          amount: personalParsed[0]?.amount ?? 0,
          description: personalParsed[0]?.description ?? "",
          items: personalParsed,
        },
        business: {
          amount: businessParsed[0]?.amount ?? 0,
          description: businessParsed[0]?.description ?? "",
          items: businessParsed,
        },
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to save membership settings");
      }
      if (result.data) applySettings(result.data);
      const allItems = [...personalParsed, ...businessParsed];
      await Promise.all(
        allItems.map((item) => {
          const packageId = item.id || item.title || "primary";
          return saveMembershipBadgeColor({
            package_id: packageId,
            package_name: item.title || packageId,
            badge_color: packageColors[packageId] || "",
          }).catch(() => undefined);
        })
      );
      onSuccess("Membership prices, descriptions and badge colors saved");
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : "Failed to save membership settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveItemColor = async (item: PriceDraft) => {
    try {
      setColorSaving(item.id);
      onError(null);
      onSuccess(null);
      const result = await saveMembershipBadgeColor({
        package_id: item.id,
        package_name: item.title.trim() || item.id,
        badge_color: packageColors[item.id] || "",
      });
      if (!result.success) {
        throw new Error(result.message || "Failed to save badge color");
      }
      onSuccess(`Badge color saved for ${item.title.trim() || "this package"}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save badge color");
    } finally {
      setColorSaving(null);
    }
  };

  const personalEnabled = settings.personal.enabled;
  const busy = toggling || saving;

  const renderItems = (
    accountType: "personal" | "business",
    items: PriceDraft[]
  ) => (
    <div className="admin-settings__membership-fields">
      {items.map((item, index) => (
        <div key={item.id} className="admin-settings__membership-item">
          <div className="admin-settings__membership-item-head">
            <span className="admin-settings__label">
              Package {index + 1}
            </span>
            {items.length > 1 ? (
              <button
                type="button"
                className="admin-settings__item-remove"
                onClick={() => removeItem(accountType, item.id)}
                disabled={saving}
                aria-label={`Remove price ${index + 1}`}
              >
                <Trash2 size={14} />
                Remove
              </button>
            ) : null}
          </div>
          <div className="admin-settings__field">
            <label
              className="admin-settings__label"
              htmlFor={`${accountType}-membership-title-${item.id}`}
            >
              Package name
            </label>
            <input
              id={`${accountType}-membership-title-${item.id}`}
              type="text"
              className="admin-settings__input"
              value={item.title}
              onChange={(event) =>
                updateItem(accountType, item.id, "title", event.target.value)
              }
              placeholder="Gold Membership Package"
              disabled={saving}
            />
          </div>
          <div className="admin-settings__field">
            <label
              className="admin-settings__label"
              htmlFor={`${accountType}-membership-amount-${item.id}`}
            >
              Amount (₦)
            </label>
            <div className="admin-settings__amount-row">
              <span className="admin-settings__amount-prefix">₦</span>
              <input
                id={`${accountType}-membership-amount-${item.id}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="admin-settings__input"
                value={item.amount}
                onChange={(event) =>
                  updateItem(accountType, item.id, "amount", event.target.value)
                }
                placeholder="0"
                disabled={saving}
              />
            </div>
          </div>
          <div className="admin-settings__field">
            <label
              className="admin-settings__label"
              htmlFor={`${accountType}-membership-description-${item.id}`}
            >
              Benefits (one per line)
            </label>
            <textarea
              id={`${accountType}-membership-description-${item.id}`}
              className="admin-settings__textarea"
              rows={3}
              value={item.description}
              onChange={(event) =>
                updateItem(
                  accountType,
                  item.id,
                  "description",
                  event.target.value
                )
              }
              placeholder="10% Discount&#10;Premium Partners&#10;VIP perks"
              disabled={saving}
            />
          </div>
          <div className="admin-settings__field">
            <span className="admin-settings__label">Name badge color</span>
            <AdminBadgeColorField
              value={packageColors[item.id] || ""}
              onChange={(hex) =>
                setPackageColors((current) => ({ ...current, [item.id]: hex }))
              }
              onSave={() => void saveItemColor(item)}
              saving={colorSaving === item.id}
              disabled={saving}
              showSave
              hint="Members on this package show this color on their name badge."
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className="admin-settings__button admin-settings__button--secondary"
        onClick={() => addItem(accountType)}
        disabled={saving || items.length >= MAX_ITEMS}
      >
        <Plus size={16} />
        Add another package
      </button>
    </div>
  );

  return (
    <section className="admin-settings__section">
      <h2 className="admin-settings__title">
        <BadgeCheck size={18} />
        Membership
      </h2>
      <p className="admin-settings__section-description">
        Personal accounts stay off membership until you turn this on. Business
        accounts always use the prices and descriptions you set here. Extra
        prices appear in the app as soon as you save.
      </p>

      {loading ? (
        <div className="admin-settings__feature-loading">
          <Loader2 size={20} className="spinner" />
          Loading membership settings...
        </div>
      ) : (
        <>
          <div className="admin-settings__feature-list">
            <article className="admin-settings__feature-card">
              <div className="admin-settings__feature-header">
                <div className="admin-settings__toggle-copy">
                  <span className="admin-settings__toggle-label">
                    Personal accounts
                  </span>
                  <span className="admin-settings__toggle-description">
                    When this is off, the app hides the membership section for
                    personal accounts.
                  </span>
                </div>
                <button
                  type="button"
                  className={`admin-settings__toggle${
                    personalEnabled ? " admin-settings__toggle--on" : ""
                  }`}
                  onClick={() => void handlePersonalToggle()}
                  disabled={busy}
                  aria-pressed={personalEnabled ? "true" : "false"}
                  aria-label={`Personal membership: ${
                    personalEnabled ? "on" : "off"
                  }`}
                >
                  <span className="admin-settings__toggle-track">
                    <span className="admin-settings__toggle-thumb">
                      {toggling ? (
                        <Loader2 size={12} className="spinner" />
                      ) : null}
                    </span>
                  </span>
                  <span className="admin-settings__toggle-state">
                    {personalEnabled ? "On" : "Off"}
                  </span>
                </button>
              </div>
              {renderItems("personal", personalItems)}
            </article>

            <article className="admin-settings__feature-card">
              <div className="admin-settings__feature-header">
                <div className="admin-settings__toggle-copy">
                  <span className="admin-settings__toggle-label">
                    Business accounts
                  </span>
                  <span className="admin-settings__toggle-description">
                    Business membership stays available. Set the prices and copy
                    shown in the app.
                  </span>
                </div>
                <span className="admin-settings__membership-always-on">
                  Always on
                </span>
              </div>
              {renderItems("business", businessItems)}
            </article>
          </div>

          <div className="admin-settings__actions admin-settings__actions--footer">
            <button
              type="button"
              className="admin-settings__button"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save membership
                </>
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminMembership;
