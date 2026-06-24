import type {
  MarketplaceProduct,
  OrderStatus,
  PaymentStatus,
} from "../services/marketplaceApi";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Awaiting payment confirmation",
  approved: "Payment approved",
  rejected: "Payment needs attention",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting payment",
  processing: "Processing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function getProductName(product: MarketplaceProduct): string {
  return String(product.name || product.title || "Product");
}

export function getProductImage(product: MarketplaceProduct): string | null {
  const image = product.image || product.image_url;
  return typeof image === "string" && image.trim() ? image : null;
}

export function formatMarketplaceMoney(value: number | string | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
