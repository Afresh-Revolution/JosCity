import { apiUrl } from "../api/config";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import type { MembershipPlanItem, MembershipSettings } from "./adminApi";

export type MembershipPackage = MembershipPlanItem & {
  id: string;
  title: string;
  features: string[];
  sort_order: number;
  josride_discount_percent: number;
  cashback_amount: number;
  cashback_duration_months: number;
};

export type CurrentMembership = {
  package_id: string;
  title: string;
  amount: number;
  status: "ACTIVE" | "EXPIRED";
  cancelled?: boolean;
  renews_at: string | null;
  expires_at: string | null;
  billing: string;
  badge_color: string | null;
  josride_discount_percent: number;
  cashback_amount?: number;
  cashback_duration_months?: number;
  cashback_payments_made?: number;
  cashback_remaining_payments?: number;
  cashback_next_at?: string | null;
  cashback_ends_at?: string | null;
  plan_revised?: boolean;
} | null;

export const PLAN_REVISED_COPY =
  "Plan revised. Resubscribe to activate the new plan.";

export type AccountMembership = {
  user_id: number;
  member_id: string;
  name: string;
  email: string;
  account_status: string;
  account_type: string;
  member_since: string | null;
  nin_verified: boolean;
  verified: boolean;
  membership_enabled: boolean;
  amount: number;
  description: string;
  currency: string;
  items: MembershipPlanItem[];
  packages: MembershipPackage[];
  current: CurrentMembership;
  billing_copy: string;
};

export const DEFAULT_MEMBERSHIP_SETTINGS: MembershipSettings = {
  personal: {
    enabled: false,
    amount: 0,
    description: "",
    currency: "NGN",
    items: [
      {
        id: "starter",
        title: "",
        amount: 0,
        description: "",
        josride_discount_percent: 0,
        cashback_amount: 0,
        cashback_duration_months: 0,
      },
    ],
  },
  business: {
    enabled: true,
    amount: 0,
    description: "",
    currency: "NGN",
    items: [
      {
        id: "primary",
        title: "",
        amount: 0,
        description: "",
        josride_discount_percent: 0,
        cashback_amount: 0,
        cashback_duration_months: 0,
      },
    ],
  },
};

export const isMembershipVisibleForAccount = (
  accountType: string | null | undefined,
  settings: MembershipSettings
): boolean => {
  const type = String(accountType || "personal").trim().toLowerCase();
  if (type === "business") return true;
  return settings.personal.enabled === true;
};

function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & {
    success?: boolean;
    message?: string;
    error?: string;
  };
  if (!response.ok || payload.success === false) {
    const error = new Error(
      payload.message || payload.error || "Request failed"
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload;
}

export type PublicMembershipPlan = {
  id: string;
  title: string;
  amount: number;
  description: string;
  josride_discount_percent: number;
  cashback_amount: number;
  cashback_duration_months: number;
  features: string[];
};

type CashbackSource = {
  cashback_amount?: number;
  cashback?: number;
  wallet_cashback?: number;
  cashback_duration_months?: number;
  cashback_months?: number;
  cashback_duration?: number;
};

export const readCashbackAmount = (item?: CashbackSource | null): number => {
  const raw =
    item?.cashback_amount ?? item?.cashback ?? item?.wallet_cashback ?? 0;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0
    ? Math.round(amount * 100) / 100
    : 0;
};

export const readCashbackDurationMonths = (
  item?: CashbackSource | null
): number => {
  const raw =
    item?.cashback_duration_months ??
    item?.cashback_months ??
    item?.cashback_duration ??
    0;
  const months = Number(raw);
  return Number.isFinite(months) && months > 0 ? Math.round(months) : 0;
};

export const hasMembershipCashback = (
  amount?: number | null,
  months?: number | null
): boolean => Number(amount || 0) > 0 && Number(months || 0) > 0;

export const formatCashbackCopy = (
  amount?: number | null,
  months?: number | null
): string | null => {
  if (!hasMembershipCashback(amount, months)) return null;
  const naira = `₦${Number(amount).toLocaleString("en-NG")}`;
  const duration = Number(months);
  const period = duration === 1 ? "1 month" : `${duration} months`;
  return `${naira} wallet cashback every 30 days for ${period}`;
};

export const formatActiveCashbackCopy = (
  current: NonNullable<CurrentMembership>
): string | null => {
  const amount = readCashbackAmount(current);
  const months = readCashbackDurationMonths(current);
  const remaining = Number(current.cashback_remaining_payments);
  if (Number.isFinite(remaining) && remaining > 0 && amount > 0) {
    const naira = `₦${amount.toLocaleString("en-NG")}`;
    const left = remaining === 1 ? "1 month left" : `${remaining} months left`;
    return `${naira} wallet cashback every 30 days (${left}).`;
  }
  return formatCashbackCopy(amount, months);
};

const normalizePackage = (
  pkg: MembershipPackage,
  index = 0
): MembershipPackage => {
  const cashbackAmount = readCashbackAmount(pkg);
  const cashbackMonths = readCashbackDurationMonths(pkg);
  const cashbackCopy = formatCashbackCopy(cashbackAmount, cashbackMonths);
  const features = Array.isArray(pkg.features)
    ? [...pkg.features]
    : String(pkg.description || "")
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-•*]\s+/, "").trim())
        .filter(Boolean);
  if (
    cashbackCopy &&
    !features.some((line) => /cashback/i.test(line))
  ) {
    features.push(cashbackCopy);
  }
  return {
    ...pkg,
    id: String(pkg.id || `plan-${index + 1}`),
    cashback_amount: cashbackAmount,
    cashback_duration_months: cashbackMonths,
    features,
  };
};

const normalizeCurrent = (current: CurrentMembership): CurrentMembership => {
  if (!current) return current;
  return {
    ...current,
    cashback_amount: readCashbackAmount(current),
    cashback_duration_months: readCashbackDurationMonths(current),
    plan_revised: Boolean(current.plan_revised),
  };
};

const toItemList = (raw: unknown): MembershipPlanItem[] => {
  if (Array.isArray(raw)) return raw as MembershipPlanItem[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const plansFromMembershipSettings = (
  settings: MembershipSettings | null | undefined,
  account: "personal" | "business" = "personal"
): PublicMembershipPlan[] => {
  const plan = settings?.[account];
  const items = toItemList(plan?.items);
  const packages = toItemList(
    (plan as { packages?: unknown } | undefined)?.packages
  );
  const source = items.length ? items : packages;
  return source
    .map((item, index) => {
      const percent = Number(
        item.josride_discount_percent ??
          (item as { ride_discount_percent?: number }).ride_discount_percent ??
          (item as { discount_percent?: number }).discount_percent ??
          0
      );
      const cashbackAmount = readCashbackAmount(item);
      const cashbackMonths = readCashbackDurationMonths(item);
      const cashbackCopy = formatCashbackCopy(cashbackAmount, cashbackMonths);
      const features = String(item.description || "")
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-•*]\s+/, "").trim())
        .filter(Boolean);
      if (percent > 0 && !features.some((line) => line.includes(`${percent}%`))) {
        features.unshift(`${percent}% off every JosRide trip`);
      }
      if (
        cashbackCopy &&
        !features.some((line) => /cashback/i.test(line))
      ) {
        features.push(cashbackCopy);
      }
      return {
        id: String(item.id || `plan-${index + 1}`),
        title: String(item.title || "").trim() || "Membership",
        amount: Number(item.amount || 0),
        description: String(item.description || ""),
        josride_discount_percent: Number.isFinite(percent) ? percent : 0,
        cashback_amount: cashbackAmount,
        cashback_duration_months: cashbackMonths,
        features,
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount || b.josride_discount_percent - a.josride_discount_percent);
};

function unwrapMembershipSettings(payload: unknown): MembershipSettings | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const nested = obj.data;
  if (nested && typeof nested === "object" && nested !== null && "personal" in nested) {
    return nested as MembershipSettings;
  }
  if ("personal" in obj) return payload as MembershipSettings;
  return null;
}

export const getPublicMembershipSettings = async (): Promise<MembershipSettings> => {
  const response = await fetchWithTimeout(apiUrl("/membership"), {
    method: "GET",
    headers: { Accept: "application/json" },
    timeout: 15000,
  });
  const data = await readJson<unknown>(response);
  const settings = unwrapMembershipSettings(data);
  if (!settings) {
    throw new Error("Unable to load membership settings.");
  }
  return settings;
};

export const getPublicMembershipCatalog = async (): Promise<{
  enabled: boolean;
  plans: PublicMembershipPlan[];
}> => {
  const settings = await getPublicMembershipSettings();
  return {
    enabled: Boolean(settings.personal?.enabled),
    plans: plansFromMembershipSettings(settings, "personal"),
  };
};

export const getAccountMembership = async (): Promise<AccountMembership> => {
  const response = await fetch(apiUrl("/account/membership"), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    signal: AbortSignal.timeout(20000),
  });
  const data = await readJson<{ data: AccountMembership }>(response);
  const membership = data.data;
  if (!membership) return membership;
  return {
    ...membership,
    packages: (membership.packages || []).map(normalizePackage),
    current: normalizeCurrent(membership.current),
  };
};

export const subscribeMembership = async (
  packageId: string
): Promise<CurrentMembership> => {
  const response = await fetch(apiUrl("/account/membership/subscribe"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ package_id: packageId }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await readJson<{ data: { current: CurrentMembership } }>(
    response
  );
  return normalizeCurrent(data.data.current);
};

export const cancelMembership = async (): Promise<CurrentMembership> => {
  const response = await fetch(apiUrl("/account/membership/cancel"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    signal: AbortSignal.timeout(20000),
  });
  const data = await readJson<{ data: { current: CurrentMembership } }>(
    response
  );
  return normalizeCurrent(data.data.current);
};

export const resumeMembership = async (): Promise<CurrentMembership> => {
  const response = await fetch(apiUrl("/account/membership/resume"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    signal: AbortSignal.timeout(20000),
  });
  const data = await readJson<{ data: { current: CurrentMembership } }>(
    response
  );
  return normalizeCurrent(data.data.current);
};
