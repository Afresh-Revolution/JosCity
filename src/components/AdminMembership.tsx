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
import {
  DEFAULT_MEMBERSHIP_SETTINGS,
  readCashbackAmount,
  readCashbackDurationMonths,
} from "../services/membershipApi";
import AdminBadgeColorField from "./AdminBadgeColorField";

type Props = {
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
};

type PriceDraft = {
  key: string;
  id: string;
  title: string;
  amount: string;
  discount: string;
  cashback: string;
  cashbackDuration: string;
  description: string;
};

const MAX_ITEMS = 20;
const MAX_CASHBACK_MONTHS = 36;

const formatAmountInput = (amount: number): string => {
  if (!Number.isFinite(amount) || amount === 0) return "";
  return String(amount);
};

const formatDiscountInput = (value?: number): string => {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) {
    return "";
  }
  return String(value);
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

const parseDiscount = (value: string): number => {
  const normalized = value.replace(/%/g, "").trim();
  if (!normalized) {
    throw new Error("Enter a JosRide discount between 0 and 100.");
  }
  const percent = Number(normalized);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error("JosRide discount must be between 0 and 100.");
  }
  return Math.round(percent * 100) / 100;
};

const parseOptionalAmount = (value: string, label: string): number => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`Enter a valid ${label} of 0 or more.`);
  }
  return Math.round(amount * 100) / 100;
};

const parseCashbackDuration = (value: string): number => {
  const normalized = value.trim();
  if (!normalized || normalized === "0") return 0;
  const months = Number(normalized);
  if (
    !Number.isFinite(months) ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > MAX_CASHBACK_MONTHS
  ) {
    throw new Error(
      `Cashback duration must be a whole number of 30-day months between 1 and ${MAX_CASHBACK_MONTHS}.`
    );
  }
  return months;
};

const slugifyId = (value: string, fallback: string): string => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || fallback;
};

const newKey = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const newDraft = (id = ""): PriceDraft => ({
  key: newKey(),
  id,
  title: "",
  amount: "",
  discount: "",
  cashback: "",
  cashbackDuration: "",
  description: "",
});

const hasContent = (item: MembershipPlanItem): boolean =>
  Boolean(String(item.title || "").trim()) ||
  Number(item.amount || 0) > 0 ||
  Number(item.josride_discount_percent || 0) > 0 ||
  readCashbackAmount(item) > 0 ||
  Boolean(String(item.description || "").trim());

const toDrafts = (
  plan: MembershipPlanSettings,
  accountType: "personal" | "business"
): PriceDraft[] => {
  const source =
    plan.items && plan.items.length
      ? plan.items
      : [{ id: "primary", amount: plan.amount, description: plan.description }];
  if (accountType === "personal" && !source.some(hasContent)) {
    return [
      {
        ...newDraft("starter"),
        title: "Starter",
      },
      {
        ...newDraft("plus"),
        title: "Plus",
      },
    ];
  }
  return source.map((item, index) => ({
    key: String(item.id || `item-${index + 1}`),
    id: String(item.id || `item-${index + 1}`),
    title: String(item.title || ""),
    amount: formatAmountInput(Number(item.amount || 0)),
    discount: formatDiscountInput(item.josride_discount_percent),
    cashback: formatAmountInput(readCashbackAmount(item)),
    cashbackDuration: formatAmountInput(readCashbackDurationMonths(item)),
    description: String(item.description || ""),
  }));
};

const toItems = (drafts: PriceDraft[]): MembershipPlanItem[] => {
  const seen = new Set<string>();
  return drafts.map((item, index) => {
    const id = slugifyId(item.id || item.title, `item-${index + 1}`);
    if (seen.has(id)) {
      throw new Error("Each package needs a unique ID (for example starter and plus).");
    }
    seen.add(id);
    const cashbackAmount = parseOptionalAmount(item.cashback, "cashback amount");
    const cashbackMonths =
      cashbackAmount > 0
        ? parseCashbackDuration(item.cashbackDuration)
        : 0;
    if (cashbackAmount > 0 && cashbackMonths <= 0) {
      throw new Error(
        `Set cashback duration (in 30-day months) for ${item.title.trim() || id}.`
      );
    }
    const next: MembershipPlanItem = {
      id,
      title: item.title.trim(),
      amount: parseAmount(item.amount),
      description: item.description.trim(),
      cashback_amount: cashbackAmount,
      cashback_duration_months: cashbackAmount > 0 ? cashbackMonths : 0,
    };
    if (item.discount.trim() !== "") {
      next.josride_discount_percent = parseDiscount(item.discount);
    }
    return next;
  });
};

const AdminMembership = ({ onError, onSuccess }: Props) => {
  const [settings, setSettings] = useState<MembershipSettings>(
    DEFAULT_MEMBERSHIP_SETTINGS
  );
  const [personalItems, setPersonalItems] = useState<PriceDraft[]>([
    newDraft("starter"),
    newDraft("plus"),
  ]);
  const [businessItems, setBusinessItems] = useState<PriceDraft[]>([newDraft("primary")]);
  const [packageColors, setPackageColors] = useState<Record<string, string>>({});
  const [colorSaving, setColorSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const applySettings = (next: MembershipSettings) => {
    setSettings(next);
    setPersonalItems(toDrafts(next.personal, "personal"));
    setBusinessItems(toDrafts(next.business, "business"));
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
      if (result.data) {
        setSettings((current) => ({
          ...current,
          personal: {
            ...current.personal,
            enabled: Boolean(result.data.personal?.enabled),
          },
          business: result.data.business ?? current.business,
        }));
      }
      onSuccess(
        nextEnabled
          ? "Personal subscription UI is now shown in the mobile app"
          : "Personal subscription UI is now hidden in the mobile app"
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
    key: string,
    field: keyof Omit<PriceDraft, "key">,
    value: string
  ) => {
    const setter = accountType === "personal" ? setPersonalItems : setBusinessItems;
    setter((current) =>
      current.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
    onSuccess(null);
  };

  const addItem = (accountType: "personal" | "business") => {
    const setter = accountType === "personal" ? setPersonalItems : setBusinessItems;
    setter((current) => {
      if (current.length >= MAX_ITEMS) return current;
      const used = new Set(current.map((item) => item.id));
      const suggested =
        accountType === "personal" && !used.has("starter")
          ? "starter"
          : accountType === "personal" && !used.has("plus")
            ? "plus"
            : `plan-${current.length + 1}`;
      return [...current, newDraft(suggested)];
    });
    onSuccess(null);
  };

  const removeItem = (accountType: "personal" | "business", key: string) => {
    const setter = accountType === "personal" ? setPersonalItems : setBusinessItems;
    setter((current) =>
      current.length <= 1 ? current : current.filter((item) => item.key !== key)
    );
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
            badge_color: packageColors[packageId] || packageColors[item.id || ""] || "",
          }).catch(() => undefined);
        })
      );
      onSuccess("Membership prices, JosRide discounts, cashback and badge colors saved");
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
      setColorSaving(item.key);
      onError(null);
      onSuccess(null);
      const packageId = slugifyId(item.id || item.title, item.key);
      const result = await saveMembershipBadgeColor({
        package_id: packageId,
        package_name: item.title.trim() || packageId,
        badge_color: packageColors[packageId] || packageColors[item.id] || "",
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
        <div key={item.key} className="admin-settings__membership-item">
          <div className="admin-settings__membership-item-head">
            <span className="admin-settings__label">Package {index + 1}</span>
            {items.length > 1 ? (
              <button
                type="button"
                className="admin-settings__item-remove"
                onClick={() => removeItem(accountType, item.key)}
                disabled={saving}
                aria-label={`Remove package ${index + 1}`}
              >
                <Trash2 size={14} />
                Remove
              </button>
            ) : null}
          </div>
          <div className="admin-settings__membership-grid">
            <div className="admin-settings__field">
              <label
                className="admin-settings__label"
                htmlFor={`${accountType}-membership-id-${item.key}`}
              >
                Package ID
              </label>
              <input
                id={`${accountType}-membership-id-${item.key}`}
                type="text"
                className="admin-settings__input"
                value={item.id}
                onChange={(event) =>
                  updateItem(accountType, item.key, "id", event.target.value)
                }
                placeholder={accountType === "personal" ? "starter" : "primary"}
                disabled={saving}
              />
            </div>
            <div className="admin-settings__field">
              <label
                className="admin-settings__label"
                htmlFor={`${accountType}-membership-title-${item.key}`}
              >
                Title
              </label>
              <input
                id={`${accountType}-membership-title-${item.key}`}
                type="text"
                className="admin-settings__input"
                value={item.title}
                onChange={(event) =>
                  updateItem(accountType, item.key, "title", event.target.value)
                }
                placeholder="Starter"
                disabled={saving}
              />
            </div>
          </div>
          <div className="admin-settings__membership-grid">
            <div className="admin-settings__field">
              <label
                className="admin-settings__label"
                htmlFor={`${accountType}-membership-amount-${item.key}`}
              >
                Amount (NGN)
              </label>
              <div className="admin-settings__amount-row">
                <span className="admin-settings__amount-prefix">₦</span>
                <input
                  id={`${accountType}-membership-amount-${item.key}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="admin-settings__input"
                  value={item.amount}
                  onChange={(event) =>
                    updateItem(accountType, item.key, "amount", event.target.value)
                  }
                  placeholder="0"
                  disabled={saving}
                />
              </div>
              <p className="admin-settings__hint">
                Membership fee deducted from the member&apos;s wallet. Not a ride fare.
              </p>
            </div>
            <div className="admin-settings__field">
              <label
                className="admin-settings__label"
                htmlFor={`${accountType}-membership-discount-${item.key}`}
              >
                JosRide discount (%)
              </label>
              <input
                id={`${accountType}-membership-discount-${item.key}`}
                type="number"
                min="0"
                max="100"
                step="1"
                inputMode="decimal"
                className="admin-settings__input"
                value={item.discount}
                onChange={(event) =>
                  updateItem(
                    accountType,
                    item.key,
                    "discount",
                    event.target.value
                  )
                }
                placeholder="0"
                disabled={saving}
              />
              <p className="admin-settings__hint">
                This percent is taken off the original JosRide fare for 30 days
                after the member pays. The membership fee itself is not a ride
                credit.
              </p>
            </div>
          </div>
          <div className="admin-settings__membership-grid">
            <div className="admin-settings__field">
              <label
                className="admin-settings__label"
                htmlFor={`${accountType}-membership-cashback-${item.key}`}
              >
                Wallet cashback (NGN, optional)
              </label>
              <div className="admin-settings__amount-row">
                <span className="admin-settings__amount-prefix">₦</span>
                <input
                  id={`${accountType}-membership-cashback-${item.key}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="admin-settings__input"
                  value={item.cashback}
                  onChange={(event) =>
                    updateItem(
                      accountType,
                      item.key,
                      "cashback",
                      event.target.value
                    )
                  }
                  placeholder="0"
                  disabled={saving}
                />
              </div>
              <p className="admin-settings__hint">
                Optional. Credited to the member&apos;s wallet every 30 days
                after purchase. Leave blank for no cashback.
              </p>
            </div>
            <div className="admin-settings__field">
              <label
                className="admin-settings__label"
                htmlFor={`${accountType}-membership-cashback-duration-${item.key}`}
              >
                Cashback duration (30-day months)
              </label>
              <input
                id={`${accountType}-membership-cashback-duration-${item.key}`}
                type="number"
                min="0"
                max={MAX_CASHBACK_MONTHS}
                step="1"
                inputMode="numeric"
                className="admin-settings__input"
                value={item.cashbackDuration}
                onChange={(event) =>
                  updateItem(
                    accountType,
                    item.key,
                    "cashbackDuration",
                    event.target.value
                  )
                }
                placeholder="10"
                disabled={saving}
              />
              <p className="admin-settings__hint">
                Required only when cashback is set. 10 means 10 credits, one
                every 30 days from approval. Continues even if they cancel or
                do not resubscribe.
              </p>
            </div>
          </div>
          <div className="admin-settings__field">
            <label
              className="admin-settings__label"
              htmlFor={`${accountType}-membership-description-${item.key}`}
            >
              Description / benefits (one per line)
            </label>
            <textarea
              id={`${accountType}-membership-description-${item.key}`}
              className="admin-settings__textarea"
              rows={3}
              value={item.description}
              onChange={(event) =>
                updateItem(
                  accountType,
                  item.key,
                  "description",
                  event.target.value
                )
              }
              placeholder="10% off every JosRide trip for 30 days"
              disabled={saving}
            />
          </div>
          <div className="admin-settings__field">
            <span className="admin-settings__label">Name badge color</span>
            <AdminBadgeColorField
              value={packageColors[item.id] || packageColors[item.key] || ""}
              onChange={(hex) =>
                setPackageColors((current) => ({
                  ...current,
                  [item.id || item.key]: hex,
                }))
              }
              onSave={() => void saveItemColor(item)}
              saving={colorSaving === item.key}
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
        Create the plans members pay for on the website. Amount is the wallet
        fee. JosRide discount is the percent taken off every ride for 30 days.
        Optional wallet cashback is credited every 30 days for the duration you
        set, even if the member cancels or does not resubscribe. Landing-page
        plans stay
        visible. These toggles only show or hide the in-app subscription UI for
        that account type.
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
                    Show the subscription UI in the mobile app for personal
                    accounts. The website landing page still lists these plans.
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
                    Business plans on the website. The submitted mobile app does
                    not use a separate business subscription toggle, so this
                    stays on.
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
