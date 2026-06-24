import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  DollarSign,
  Eye,
} from "lucide-react";
import {
  adminMarketplaceApi,
  normalizeOrderList,
  normalizePaymentLogList,
  type MarketplaceOrder,
  type PaymentLog,
  type OrderStatus,
} from "../services/marketplaceApi";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "../components/marketplace/MarketplaceBadges";
import { formatMarketplaceMoney } from "../utils/marketplaceDisplay";
import "../main.css";
import "../scss/_admin.scss";

const DELIVERY_STATUSES: Exclude<OrderStatus, "awaiting_payment">[] = [
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const AdminMarket: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"orders" | "payments">("orders");
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersMeta, setOrdersMeta] = useState({ total: 0, total_pages: 1 });

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setError(null);
    try {
      const response = await adminMarketplaceApi.getOrders({ page: ordersPage, limit: 20 });
      setOrders(normalizeOrderList(response.data));
      setOrdersMeta({
        total: response.meta?.total ?? 0,
        total_pages: response.meta?.total_pages ?? 1,
      });
    } catch (err) {
      setOrders([]);
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage]);

  const loadPaymentLogs = useCallback(async () => {
    setPaymentsLoading(true);
    setError(null);
    try {
      const response = await adminMarketplaceApi.getPaymentLogs({ limit: 50 });
      setPaymentLogs(normalizePaymentLogList(response.data));
    } catch (err) {
      setPaymentLogs([]);
      setError(err instanceof Error ? err.message : "Failed to load payment logs");
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "orders") void loadOrders();
    else void loadPaymentLogs();
  }, [activeTab, loadOrders, loadPaymentLogs]);

  const loadOrderDetail = async (orderId: string) => {
    setOrderDetailLoading(true);
    setError(null);
    try {
      const response = await adminMarketplaceApi.getOrder(orderId);
      setSelectedOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleApprovePayment = async (log: PaymentLog) => {
    setProcessingPaymentId(log.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await adminMarketplaceApi.approvePayment(log.id);
      const result = response.data;
      setSuccess(
        result.cbrixi_record_sent
          ? "Payment approved and order moved to processing."
          : "Payment approved. Warning: Cbrixi sync did not complete — review order details."
      );
      await loadPaymentLogs();
      if (selectedOrder?.id === log.marketplace_order_id) {
        await loadOrderDetail(log.marketplace_order_id);
      }
      if (activeTab === "orders") await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve payment");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleRejectPayment = async (log: PaymentLog) => {
    const note = rejectNote[log.id]?.trim();
    if (!note) {
      setError("Enter a rejection note for the administrator record.");
      return;
    }
    setProcessingPaymentId(log.id);
    setError(null);
    setSuccess(null);
    try {
      await adminMarketplaceApi.rejectPayment(log.id, note);
      setSuccess("Payment rejected. Customer was notified.");
      await loadPaymentLogs();
      if (selectedOrder?.id === log.marketplace_order_id) {
        await loadOrderDetail(log.marketplace_order_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject payment");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleOrderStatusUpdate = async (
    orderId: string,
    orderStatus: Exclude<OrderStatus, "awaiting_payment">
  ) => {
    setProcessingOrderId(orderId);
    setError(null);
    setSuccess(null);
    try {
      await adminMarketplaceApi.updateOrderStatus(orderId, orderStatus);
      setSuccess(`Order status updated to ${orderStatus.replace(/_/g, " ")}.`);
      await loadOrderDetail(orderId);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <ShoppingBag size={20} />
          Marketplace (Cbrixi)
        </h1>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <DollarSign size={16} />
          Payment logs
        </button>
      </div>

      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {activeTab === "orders" && (
        <>
          {ordersLoading ? (
            <div className="admin-dashboard__loading">
              <Loader2 size={32} className="spinner" />
              <span>Loading orders…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="admin-dashboard__empty-state">
              <ShoppingBag size={48} />
              <p>No marketplace orders yet</p>
            </div>
          ) : (
            <div className="admin-market-list">
              {orders.map((order) => (
                <div key={order.id} className="admin-market-order-card">
                  <div className="admin-market-order-card__header">
                    <h4>{order.invoice_number}</h4>
                    <div className="admin-market-order-card__badges">
                      <PaymentStatusBadge status={order.payment_status} />
                      <OrderStatusBadge status={order.order_status} />
                    </div>
                  </div>
                  <p>{order.customer_name} · {order.customer_email}</p>
                  <p>Total: {formatMarketplaceMoney(order.total_amount)}</p>
                  <p>{formatDate(order.created_at)}</p>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--view"
                    onClick={() => void loadOrderDetail(order.id)}
                  >
                    <Eye size={16} /> View details
                  </button>
                </div>
              ))}
            </div>
          )}

          {ordersMeta.total_pages > 1 && (
            <div className="admin-pagination">
              <button
                type="button"
                className="admin-pagination__btn"
                disabled={ordersPage <= 1}
                onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>
                Page {ordersPage} of {ordersMeta.total_pages} ({ordersMeta.total} orders)
              </span>
              <button
                type="button"
                className="admin-pagination__btn"
                disabled={ordersPage >= ordersMeta.total_pages}
                onClick={() => setOrdersPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "payments" && (
        <>
          {paymentsLoading ? (
            <div className="admin-dashboard__loading">
              <Loader2 size={32} className="spinner" />
              <span>Loading payment logs…</span>
            </div>
          ) : paymentLogs.length === 0 ? (
            <div className="admin-dashboard__empty-state">
              <DollarSign size={48} />
              <p>No payment submissions yet</p>
            </div>
          ) : (
            <div className="admin-market-payments-list">
              {paymentLogs.map((log) => (
                <div key={log.id} className="admin-market-payment-card">
                  <div className="admin-market-payment-card__header">
                    <h4>{log.invoice_number}</h4>
                    <PaymentStatusBadge status={log.status} />
                  </div>
                  <p>Amount: {formatMarketplaceMoney(log.amount)}</p>
                  <p>Reference: {log.transfer_reference || "—"}</p>
                  <p>Bank: {log.bank_name || "—"} · {log.account_name || "—"}</p>
                  <p>{formatDate(log.created_at)}</p>

                  {log.status === "pending" && (
                    <div className="admin-market-payment-card__actions">
                      <textarea
                        className="admin-settings__textarea"
                        placeholder="Rejection note (required to reject)"
                        value={rejectNote[log.id] || ""}
                        onChange={(e) =>
                          setRejectNote((prev) => ({ ...prev, [log.id]: e.target.value }))
                        }
                        rows={2}
                      />
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--approve"
                        disabled={processingPaymentId === log.id}
                        onClick={() => void handleApprovePayment(log)}
                      >
                        {processingPaymentId === log.id ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--delete"
                        disabled={processingPaymentId === log.id}
                        onClick={() => void handleRejectPayment(log)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="admin-event-modal admin-market-order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-event-modal__header">
              <h2>Order {selectedOrder.invoice_number}</h2>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <XCircle size={20} />
              </button>
            </div>

            {orderDetailLoading ? (
              <div className="admin-dashboard__loading">
                <Loader2 size={28} className="spinner" />
              </div>
            ) : (
              <div className="admin-market-order-modal__body">
                <div className="admin-market-order-card__badges">
                  <PaymentStatusBadge status={selectedOrder.payment_status} />
                  <OrderStatusBadge status={selectedOrder.order_status} />
                </div>

                {!selectedOrder.cbrixi_record_sent && selectedOrder.payment_status === "approved" && (
                  <div className="admin-dashboard__message admin-dashboard__message--error">
                    Cbrixi sync warning: payment was approved but the Cbrixi record was not sent.
                  </div>
                )}

                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                <p><strong>Delivery:</strong> {selectedOrder.delivery_address}</p>
                <p><strong>Total:</strong> {formatMarketplaceMoney(selectedOrder.total_amount)}</p>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="admin-market-order-modal__items">
                    <h3>Items</h3>
                    <ul>
                      {selectedOrder.items.map((item) => (
                        <li key={item.id}>
                          {item.product_name_snapshot} × {item.quantity} —{" "}
                          {formatMarketplaceMoney(item.total_price)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="admin-market-order-modal__status">
                  <h3>Update delivery status</h3>
                  <div className="admin-market-order-modal__status-btns">
                    {DELIVERY_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="admin-action-btn admin-action-btn--edit"
                        disabled={
                          processingOrderId === selectedOrder.id ||
                          selectedOrder.order_status === status
                        }
                        onClick={() => void handleOrderStatusUpdate(selectedOrder.id, status)}
                      >
                        {status.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarket;
