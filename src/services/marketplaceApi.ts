import { apiUrl } from "../api/config";

const SESSION_STORAGE_KEY = "joscity_marketplace_session_id";
export const CHECKOUT_STORAGE_KEY = "joscity_marketplace_checkout_result";

export type PaymentStatus = "pending" | "approved" | "rejected";
export type OrderStatus =
  | "awaiting_payment"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
    [key: string]: unknown;
  };
}

export interface MarketplaceProduct {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  price: number | string;
  image?: string;
  image_url?: string;
  category?: string;
  [key: string]: unknown;
}

export interface CartItem {
  id: string;
  cbrixi_product_id: string;
  product_name_snapshot: string;
  product_image_snapshot: string | null;
  unit_price_snapshot: number;
  quantity: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceCart {
  cart: {
    id: string;
    user_id: number | null;
    session_id: string | null;
    status: "active" | "checked_out" | "abandoned";
  } | null;
  items: CartItem[];
  subtotal: number;
  total_quantity: number;
  session_id?: string | null;
}

export interface CheckoutInput {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
}

export interface MarketplaceOrder {
  id: string;
  user_id: number | null;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  subtotal: number | string;
  delivery_fee: number | string;
  total_amount: number | string;
  cbrixi_record_sent: boolean;
  cbrixi_record_response?: unknown;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
  payment_logs?: PaymentLog[];
}

export interface CheckoutResult {
  order: MarketplaceOrder;
  invoice_number: string;
  total_amount: number;
  bank_transfer_instructions: {
    bank_name: string;
    account_name: string;
    account_number: string;
    narration: string;
    instruction: string;
  };
  email_sent: boolean;
}

export interface PaymentLogInput {
  bank_name?: string;
  account_name?: string;
  transfer_reference?: string;
  amount: number;
  payment_proof_url?: string;
}

export interface PaymentLog {
  id: string;
  marketplace_order_id: string;
  invoice_number: string;
  amount: number | string;
  bank_name: string | null;
  account_name: string | null;
  transfer_reference: string | null;
  payment_proof_url: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export interface AdminOrderFilters {
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface StoredCheckoutResult extends CheckoutResult {
  order_id: string;
}

function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

function storeSessionId(sessionId: string | null): void {
  if (typeof window === "undefined" || !sessionId) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

function queryString<T extends object>(values: T): string {
  const params = new URLSearchParams();
  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const result = params.toString();
  return result ? `?${result}` : "";
}

function userAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    window.sessionStorage.getItem("token")
  );
}

function adminAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("adminToken");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const bearer = token === undefined ? userAuthToken() : token;
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);

  const sessionId = getStoredSessionId();
  if (sessionId) headers.set("x-marketplace-session-id", sessionId);

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(apiUrl(normalizedPath), {
    ...options,
    headers,
  });

  const returnedSessionId = response.headers.get("x-marketplace-session-id");
  if (returnedSessionId) storeSessionId(returnedSessionId);

  let payload: ApiResponse<T>;
  try {
    const text = await response.text();
    payload = text
      ? (JSON.parse(text) as ApiResponse<T>)
      : ({
          success: false,
          message: "The server returned an empty response.",
          data: {} as T,
        } as ApiResponse<T>);
  } catch {
    payload = {
      success: false,
      message: "The server returned an unreadable response.",
      data: {} as T,
    };
  }

  if (!response.ok || payload.success === false) {
    throw new Error(
      payload.message || payload.error || `Request failed (${response.status})`
    );
  }

  const dataSessionId = (payload.data as { session_id?: string } | undefined)
    ?.session_id;
  if (dataSessionId) storeSessionId(dataSessionId);

  return payload;
}

export function normalizeProductList(data: unknown): MarketplaceProduct[] {
  if (Array.isArray(data)) return data as MarketplaceProduct[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.products)) {
      return record.products as MarketplaceProduct[];
    }
    if (Array.isArray(record.items)) {
      return record.items as MarketplaceProduct[];
    }
  }
  return [];
}

export function normalizeOrderList(data: unknown): MarketplaceOrder[] {
  if (Array.isArray(data)) return data as MarketplaceOrder[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.orders)) return record.orders as MarketplaceOrder[];
  }
  return [];
}

export function normalizePaymentLogList(data: unknown): PaymentLog[] {
  if (Array.isArray(data)) return data as PaymentLog[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.payment_logs)) {
      return record.payment_logs as PaymentLog[];
    }
  }
  return [];
}

export function saveCheckoutResult(result: CheckoutResult): StoredCheckoutResult {
  const stored: StoredCheckoutResult = {
    ...result,
    order_id: result.order.id,
  };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(stored));
  }
  return stored;
}

export function loadCheckoutResult(): StoredCheckoutResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCheckoutResult;
  } catch {
    return null;
  }
}

export function clearCheckoutResult(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  }
}

export const marketplaceApi = {
  getProducts(filters: ProductFilters = {}) {
    return request<MarketplaceProduct[] | Record<string, unknown>>(
      `/marketplace/products${queryString(filters)}`
    );
  },

  getProduct(productId: string) {
    return request<MarketplaceProduct>(
      `/marketplace/products/${encodeURIComponent(productId)}`
    );
  },

  getCart() {
    return request<MarketplaceCart>("/marketplace/cart");
  },

  addToCart(productId: string, quantity = 1) {
    return request<MarketplaceCart & { item: CartItem }>(
      "/marketplace/cart/items",
      {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      }
    );
  },

  increaseCartItem(itemId: string) {
    return request<MarketplaceCart & { item: CartItem }>(
      `/marketplace/cart/items/${itemId}/increase`,
      { method: "PATCH" }
    );
  },

  decreaseCartItem(itemId: string) {
    return request<MarketplaceCart & { item: CartItem | { removed: true } }>(
      `/marketplace/cart/items/${itemId}/decrease`,
      { method: "PATCH" }
    );
  },

  removeCartItem(itemId: string) {
    return request<MarketplaceCart>(`/marketplace/cart/items/${itemId}`, {
      method: "DELETE",
    });
  },

  clearCart() {
    return request<{ removed_items: number }>("/marketplace/cart/clear", {
      method: "DELETE",
    });
  },

  checkout(input: CheckoutInput) {
    return request<CheckoutResult>("/marketplace/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  submitPaymentLog(orderId: string, input: PaymentLogInput) {
    return request<PaymentLog>(`/marketplace/orders/${orderId}/payment-log`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const adminMarketplaceApi = {
  getOrders(filters: AdminOrderFilters = {}, adminToken?: string) {
    return request<MarketplaceOrder[]>(
      `/admin/marketplace/orders${queryString(filters)}`,
      {},
      adminToken ?? adminAuthToken()
    );
  },

  getOrder(orderId: string, adminToken?: string) {
    return request<MarketplaceOrder>(
      `/admin/marketplace/orders/${orderId}`,
      {},
      adminToken ?? adminAuthToken()
    );
  },

  getPaymentLogs(
    filters: { status?: PaymentStatus; page?: number; limit?: number } = {},
    adminToken?: string
  ) {
    return request<PaymentLog[]>(
      `/admin/marketplace/payment-logs${queryString(filters)}`,
      {},
      adminToken ?? adminAuthToken()
    );
  },

  approvePayment(paymentLogId: string, adminToken?: string) {
    return request<{
      order_id: string;
      payment_status: "approved";
      order_status: "processing";
      cbrixi_record_sent: boolean;
      cbrixi_record_response: unknown;
      email_sent: boolean;
    }>(
      `/admin/marketplace/payment-logs/${paymentLogId}/approve`,
      { method: "PATCH" },
      adminToken ?? adminAuthToken()
    );
  },

  rejectPayment(paymentLogId: string, adminNote: string, adminToken?: string) {
    return request<{
      order_id: string;
      payment_status: "rejected";
      email_sent: boolean;
    }>(
      `/admin/marketplace/payment-logs/${paymentLogId}/reject`,
      {
        method: "PATCH",
        body: JSON.stringify({ admin_note: adminNote }),
      },
      adminToken ?? adminAuthToken()
    );
  },

  updateOrderStatus(
    orderId: string,
    orderStatus: Exclude<OrderStatus, "awaiting_payment">,
    adminToken?: string
  ) {
    return request<{ order: MarketplaceOrder; email_sent: boolean }>(
      `/admin/marketplace/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ order_status: orderStatus }),
      },
      adminToken ?? adminAuthToken()
    );
  },
};

export function clearMarketplaceGuestSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// --- Business / local listing marketplace (P2P offers) ---

async function listingRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = userAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(`/marketplace${path}`), {
    ...options,
    headers,
  });
  let body: unknown = {};
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  const record = body as { success?: boolean; data?: T; message?: string };
  if (!res.ok) {
    return {
      success: false,
      message: record.message || `Request failed (${res.status})`,
    };
  }
  return {
    success: record.success !== false,
    data: record.data,
    message: record.message,
  };
}

export interface ApiMediaItem {
  type: string;
  url: string;
}

export interface UploadMediaResult {
  url: string;
  type: string;
}

async function uploadListingMedia(
  file: File
): Promise<{ success: boolean; data?: UploadMediaResult; message?: string }> {
  const token = userAuthToken();
  const fd = new FormData();
  fd.append("file", file);
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(`/marketplace/upload-media`), {
    method: "POST",
    headers,
    body: fd,
  });
  let body: unknown = {};
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  const record = body as {
    success?: boolean;
    data?: UploadMediaResult;
    message?: string;
  };
  if (!res.ok) {
    return {
      success: false,
      message: record.message || `Upload failed (${res.status})`,
    };
  }
  return {
    success: record.success !== false,
    data: record.data,
    message: record.message,
  };
}

export interface ApiMarketplaceListing {
  id: string;
  title: string;
  description?: string;
  price: number;
  image_url: string;
  category: string;
  stock?: number | null;
  quantity_tracked: boolean;
  quantity_note?: string | null;
  is_sold_out: boolean;
  can_purchase: boolean;
  media: ApiMediaItem[];
  seller_user_id: string;
  bank?: {
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
  };
  contact?: {
    name: string;
    phone: string;
    email: string;
    whatsapp: string;
  };
}

export interface ApiCartItem {
  id: string;
  listing_id: string;
  product_id: string;
  listing: ApiMarketplaceListing;
  product: ApiMarketplaceListing;
  quantity: number;
  price: number;
}

export interface CheckoutBuyerPayload {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  notes?: string;
}

export interface CheckoutOrderResult {
  id: number;
  sellerUserId: number;
  totalNaira: number;
  sellerBank: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
  };
  items: {
    listingId: string;
    title: string;
    quantity: number;
    unitPriceNaira: number;
  }[];
}

export interface CheckoutResponseData {
  orders: CheckoutOrderResult[];
  buyer: CheckoutBuyerPayload;
}

export const listingMarketplaceApi = {
  uploadListingMedia,

  listProducts(params: { category?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params.category && params.category !== "All") {
      q.set("category", params.category);
    }
    if (params.search?.trim()) q.set("search", params.search.trim());
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return listingRequest<ApiMarketplaceListing[]>(`/listings${suffix}`);
  },

  myListings() {
    return listingRequest<ApiMarketplaceListing[]>(`/my-listings`);
  },

  createListing(body: {
    title: string;
    description?: string;
    category: string;
    priceNaira: number;
    quantityTracked: boolean;
    stockQuantity?: number | null;
    quantityNote?: string | null;
    media: ApiMediaItem[];
    imageUrl?: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    sellerContactName?: string;
    sellerContactPhone?: string;
    sellerContactEmail?: string;
    sellerContactWhatsapp?: string;
  }) {
    return listingRequest<ApiMarketplaceListing>(`/listings`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateListing(
    id: number,
    body: Partial<{
      title: string;
      description: string;
      category: string;
      priceNaira: number;
      quantityTracked: boolean;
      stockQuantity: number;
      quantityNote: string | null;
      media: ApiMediaItem[];
      imageUrl: string;
      bankName: string;
      bankAccountNumber: string;
      bankAccountName: string;
      sellerContactName: string;
      sellerContactPhone: string;
      sellerContactEmail: string;
      sellerContactWhatsapp: string;
    }>
  ) {
    return listingRequest<ApiMarketplaceListing>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteListing(id: number) {
    return listingRequest<unknown>(`/listings/${id}`, { method: "DELETE" });
  },

  getListingCart() {
    return listingRequest<ApiCartItem[]>(`/listing-cart`);
  },

  addListingToCart(listingId: number, quantity = 1) {
    return listingRequest<unknown>(`/cart`, {
      method: "POST",
      body: JSON.stringify({ listingId, quantity }),
    });
  },

  updateListingCartItem(itemId: number, quantity: number) {
    return listingRequest<unknown>(`/cart/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },

  removeListingCartItem(itemId: number) {
    return listingRequest<unknown>(`/cart/${itemId}`, { method: "DELETE" });
  },

  listingCheckout(payload: CheckoutBuyerPayload) {
    return listingRequest<CheckoutResponseData>(`/listing-checkout`, {
      method: "POST",
      body: JSON.stringify({
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        notes: payload.notes,
      }),
    });
  },
};
