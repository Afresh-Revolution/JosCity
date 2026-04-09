import { apiUrl } from "../api/config";

const getToken = (): string | null =>
  localStorage.getItem("token") || localStorage.getItem("authToken");

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
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
  const token = getToken();
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
  const record = body as { success?: boolean; data?: UploadMediaResult; message?: string };
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

export const marketplaceApi = {
  uploadListingMedia,

  listProducts(params: { category?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.search?.trim()) q.set("search", params.search.trim());
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return request<ApiMarketplaceListing[]>(`/products${suffix}`);
  },

  myListings() {
    return request<ApiMarketplaceListing[]>(`/my-listings`);
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
    return request<ApiMarketplaceListing>(`/listings`, {
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
    return request<ApiMarketplaceListing>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteListing(id: number) {
    return request<unknown>(`/listings/${id}`, { method: "DELETE" });
  },

  getCart() {
    return request<ApiCartItem[]>(`/cart`);
  },

  addToCart(listingId: number, quantity = 1) {
    return request<unknown>(`/cart`, {
      method: "POST",
      body: JSON.stringify({ listingId, quantity }),
    });
  },

  updateCartItem(itemId: number, quantity: number) {
    return request<unknown>(`/cart/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },

  removeCartItem(itemId: number) {
    return request<unknown>(`/cart/${itemId}`, { method: "DELETE" });
  },

  checkout(payload: CheckoutBuyerPayload) {
    return request<CheckoutResponseData>(`/checkout`, {
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
