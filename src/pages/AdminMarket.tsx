import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Trash2,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  DollarSign,
  Package,
  Plus,
} from "lucide-react";
import {
  getProducts,
  deleteProduct,
  getOrders,
  getMarketCategories,
  deleteMarketCategory,
  getMarketPayments,
  approveMarketPayment,
  type MarketProduct,
  type MarketOrder,
  type MarketCategory,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminMarket: React.FC = () => {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "categories" | "payments">("products");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "products") {
        const response = await getProducts();
        setProducts(response.data);
      } else if (activeTab === "orders") {
        const response = await getOrders();
        setOrders(response.data);
      } else if (activeTab === "categories") {
        const response = await getMarketCategories();
        setCategories(response.data);
      } else if (activeTab === "payments") {
        const response = await getMarketPayments();
        setPayments(response.data);
      }
    } catch (err) {
      console.error("Failed to load market data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    try {
      setProcessing(id);
      setError(null);
      setSuccess(null);
      if (type === "product") {
        await deleteProduct(id);
      } else if (type === "category") {
        await deleteMarketCategory(id);
      }
      setSuccess(`${type} deleted successfully`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete ${type}`);
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <ShoppingBag size={20} />
          Marketplace Management
        </h1>
        {activeTab === "categories" && (
          <button className="admin-action-btn admin-action-btn--primary">
            <Plus size={16} />
            Create Category
          </button>
        )}
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Package size={16} />
          Products
        </button>
        <button
          className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          className={`admin-tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
        <button
          className={`admin-tab ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <DollarSign size={16} />
          Payments
        </button>
      </div>

      {error && (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-dashboard__message admin-dashboard__message--success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading marketplace data...</span>
        </div>
      ) : (
        <>
          {activeTab === "products" && (
            <div className="admin-market-grid">
              {products.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <Package size={48} />
                  <p>No products yet</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.product_id} className="admin-market-card">
                    <h4>{product.title}</h4>
                    <p>{product.description}</p>
                    <div className="admin-market-card__price">
                      {formatCurrency(product.price)}
                    </div>
                    <div className="admin-market-card__actions">
                      <button
                        onClick={() => handleDelete(product.product_id, "product")}
                        disabled={processing === product.product_id}
                        className="admin-action-btn admin-action-btn--delete"
                      >
                        {processing === product.product_id ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="admin-market-list">
              {orders.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <ShoppingBag size={48} />
                  <p>No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.order_id} className="admin-market-order-card">
                    <h4>Order #{order.order_id}</h4>
                    <p>Buyer ID: {order.buyer_id}</p>
                    <p>Product ID: {order.product_id}</p>
                    <p>Quantity: {order.quantity}</p>
                    <p>Total: {formatCurrency(order.total_price)}</p>
                    <p>Status: {order.status}</p>
                    <p>Date: {formatDate(order.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="admin-market-categories-list">
              {categories.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <Package size={48} />
                  <p>No categories yet</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div key={category.category_id} className="admin-market-category-card">
                    <h4>{category.name}</h4>
                    <p>{category.description}</p>
                    <span className={`badge ${category.active ? "badge--active" : "badge--inactive"}`}>
                      {category.active ? "Active" : "Inactive"}
                    </span>
                    <div className="admin-market-category-card__actions">
                      <button className="admin-action-btn admin-action-btn--edit">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.category_id, "category")}
                        disabled={processing === category.category_id}
                        className="admin-action-btn admin-action-btn--delete"
                      >
                        {processing === category.category_id ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="admin-market-payments-list">
              {payments.length === 0 ? (
                <div className="admin-dashboard__empty-state">
                  <DollarSign size={48} />
                  <p>No payments yet</p>
                </div>
              ) : (
                payments.map((payment: any) => (
                  <div key={payment.payment_id} className="admin-market-payment-card">
                    <h4>Payment #{payment.payment_id}</h4>
                    <p>Amount: {formatCurrency(payment.amount)}</p>
                    <p>Status: {payment.status}</p>
                    {payment.status === "pending" && (
                      <button
                        onClick={async () => {
                          try {
                            await approveMarketPayment(payment.payment_id);
                            setSuccess("Payment approved");
                            await loadData();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Failed to approve");
                          }
                        }}
                        className="admin-action-btn admin-action-btn--approve"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminMarket;

