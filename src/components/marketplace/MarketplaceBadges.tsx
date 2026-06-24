import React from "react";
import type { PaymentStatus, OrderStatus } from "../../services/marketplaceApi";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../../utils/marketplaceDisplay";

const paymentClass: Record<PaymentStatus, string> = {
  pending: "marketplace-badge--payment-pending",
  approved: "marketplace-badge--payment-approved",
  rejected: "marketplace-badge--payment-rejected",
};

const orderClass: Record<OrderStatus, string> = {
  awaiting_payment: "marketplace-badge--order-awaiting",
  processing: "marketplace-badge--order-processing",
  out_for_delivery: "marketplace-badge--order-delivery",
  delivered: "marketplace-badge--order-delivered",
  cancelled: "marketplace-badge--order-cancelled",
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({
  status,
}) => (
  <span className={`marketplace-badge ${paymentClass[status]}`}>
    {PAYMENT_STATUS_LABELS[status]}
  </span>
);

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({
  status,
}) => (
  <span className={`marketplace-badge ${orderClass[status]}`}>
    {ORDER_STATUS_LABELS[status]}
  </span>
);
