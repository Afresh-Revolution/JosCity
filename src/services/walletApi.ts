import { apiUrl } from "../api/config";

export type PayoutAccount = {
  bank_name: string;
  account_name: string;
  account_number: string;
  account_number_masked?: string;
  label?: string;
};

export type WalletMember = {
  member_id: string;
  name: string;
  account_type: "personal" | "business";
  account_type_label?: string;
};

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

export type WalletSnapshot = {
  balance: number;
  currency?: string;
  funding?: WalletFundingOptions;
  payout_account?: PayoutAccount | null;
  member_id?: string;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(init.headers),
    },
    signal: init.signal || AbortSignal.timeout(isForm ? 60000 : 30000),
  });
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }
  return (payload.data ?? payload) as T;
}

const PAY_METHOD_KEY = "joscity_wallet_fund_method";

export const walletApi = {
  getWallet: () => request<WalletSnapshot>("/account/wallet"),

  startPaystack: (amount: number, callback_url: string) =>
    request<{ authorization_url?: string; reference: string }>(
      "/account/wallet/fund/paystack",
      {
        method: "POST",
        body: JSON.stringify({ amount, callback_url }),
      }
    ),

  verifyPaystack: (reference: string) =>
    request("/account/wallet/fund/paystack/verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),

  startSafehaven: (amount: number, callback_url: string) =>
    request<{ authorization_url?: string; reference: string }>(
      "/account/wallet/fund/safehaven",
      {
        method: "POST",
        body: JSON.stringify({ amount, callback_url }),
      }
    ),

  verifySafehaven: (reference: string) =>
    request("/account/wallet/fund/safehaven/verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),

  submitManual: (amount: number, proof: File) => {
    const form = new FormData();
    form.append("amount", String(amount));
    form.append("proof", proof);
    return request("/account/wallet/fund/manual", {
      method: "POST",
      body: form,
    });
  },

  withdraw: (amount: number) =>
    request("/account/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  updatePayoutAccount: (input: {
    bank_name: string;
    account_name: string;
    account_number: string;
  }) =>
    request<{ payout_account: PayoutAccount }>("/account/wallet/payout-account", {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  lookupMember: (member_id: string) =>
    request<WalletMember>(
      `/account/wallet/member?member_id=${encodeURIComponent(member_id)}`
    ),

  share: (member_id: string, amount: number) =>
    request<{ amount: number; recipient: WalletMember }>("/account/wallet/share", {
      method: "POST",
      body: JSON.stringify({ member_id, amount }),
    }),

  rememberPayMethod: (method: "paystack" | "safehaven") => {
    sessionStorage.setItem(PAY_METHOD_KEY, method);
  },

  takePayMethod: (): "paystack" | "safehaven" | null => {
    const method = sessionStorage.getItem(PAY_METHOD_KEY);
    sessionStorage.removeItem(PAY_METHOD_KEY);
    return method === "paystack" || method === "safehaven" ? method : null;
  },
};
