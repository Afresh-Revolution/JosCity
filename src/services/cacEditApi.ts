import { apiUrl } from "../api/config";

export type WalletFundingOptions = {
  min_amount?: number;
  paystack?: { enabled: boolean; public_key?: string };
  safehaven?: { enabled: boolean; client_id?: string; environment?: string };
  manual?: {
    enabled: boolean;
    bank_name?: string;
    account_name?: string;
    account_number?: string;
  };
};

export type WalletCheckout = {
  authorization_url?: string;
  reference: string;
};

export type CacEditPending = {
  id: string;
  amount: number;
  method?: string | null;
  status: "awaiting_payment" | "pending_review" | string;
  proof_url?: string | null;
  reference?: string | null;
};

export type CacEditState = {
  can_edit: boolean;
  has_cac: boolean;
  free_used: boolean;
  credits: number;
  next_price: number;
  paid_purchases: number;
  pending_request: CacEditPending | null;
  funding?: WalletFundingOptions;
};

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(init.headers),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }
  return (payload.data ?? payload) as T;
}

const PAY_METHOD_KEY = "joscity_cac_edit_method";

export const cacEditApi = {
  getState: () => request<CacEditState>("/users/cac-edit"),
  startPaystack: (callback_url: string) =>
    request<WalletCheckout>("/users/cac-edit/paystack", {
      method: "POST",
      body: JSON.stringify({ callback_url }),
    }),
  verifyPaystack: (reference: string) =>
    request("/users/cac-edit/paystack/verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),
  startSafehaven: (callback_url: string) =>
    request<WalletCheckout>("/users/cac-edit/safehaven", {
      method: "POST",
      body: JSON.stringify({ callback_url }),
    }),
  verifySafehaven: (reference: string) =>
    request("/users/cac-edit/safehaven/verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),
  submitManual: (proof: File) => {
    const form = new FormData();
    form.append("proof", proof);
    return request("/users/cac-edit/manual", { method: "POST", body: form });
  },
  rememberPayMethod: (method: "paystack" | "safehaven") => {
    sessionStorage.setItem(PAY_METHOD_KEY, method);
  },
  takePayMethod: (): "paystack" | "safehaven" | null => {
    const method = sessionStorage.getItem(PAY_METHOD_KEY);
    sessionStorage.removeItem(PAY_METHOD_KEY);
    return method === "paystack" || method === "safehaven" ? method : null;
  },
};
