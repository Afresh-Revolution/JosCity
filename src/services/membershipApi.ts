import { apiUrl } from "../api/config";
import type { MembershipSettings } from "./adminApi";

export const DEFAULT_MEMBERSHIP_SETTINGS: MembershipSettings = {
  personal: {
    enabled: false,
    amount: 0,
    description: "",
    currency: "NGN",
    items: [{ id: "primary", amount: 0, description: "" }],
  },
  business: {
    enabled: true,
    amount: 0,
    description: "",
    currency: "NGN",
    items: [{ id: "primary", amount: 0, description: "" }],
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

export const getPublicMembershipSettings = async (): Promise<MembershipSettings> => {
  const response = await fetch(apiUrl("/membership"), {
    method: "GET",
    signal: AbortSignal.timeout(15000),
  });
  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: MembershipSettings;
    message?: string;
  };
  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.message || "Unable to load membership settings.");
  }
  return data.data;
};
