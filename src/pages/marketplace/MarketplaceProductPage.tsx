import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import LazyImage from "../../components/LazyImage";
import ReportModal from "../../components/ReportModal";
import {
  marketplaceApi,
  type MarketplaceProduct,
} from "../../services/marketplaceApi";
import {
  formatMarketplaceMoney,
  getProductImage,
  getProductName,
} from "../../utils/marketplaceDisplay";
import "../../main.css";
import "../../scss/_marketplace.scss";

const MarketplaceProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void marketplaceApi
      .getProduct(id)
      .then((res) => {
        if (!cancelled) setProduct(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Product not found.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAdd = async () => {
    if (!product) return;
    setAdding(true);
    setError(null);
    setSuccess(null);
    try {
      await marketplaceApi.addToCart(product.id, quantity);
      setSuccess(`Added ${quantity} item(s) to cart.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to cart.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="marketplace-subpage">
        <Loader2 size={32} className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="marketplace-subpage">
        <p>{error || "Product not found."}</p>
        <Link to="/marketplace">Back to marketplace</Link>
      </div>
    );
  }

  const image = getProductImage(product);

  return (
    <div className="marketplace-subpage">
      <button type="button" className="marketplace-subpage__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="marketplace-product-detail">
        {image ? (
          <LazyImage src={image} alt={getProductName(product)} className="marketplace-product-detail__image" />
        ) : (
          <div className="marketplace-product-detail__image marketplace-product-detail__image--placeholder">
            No image
          </div>
        )}
        <div className="marketplace-product-detail__body">
          <h1>{getProductName(product)}</h1>
          {product.category && <p className="marketplace-product-detail__category">{product.category}</p>}
          <p className="marketplace-product-detail__price">
            {formatMarketplaceMoney(product.price)}
          </p>
          {product.description && (
            <p className="marketplace-product-detail__description">{product.description}</p>
          )}

          <label className="marketplace-product-detail__qty">
            Quantity
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>

          {error && <div className="marketplace-banner-error">{error}</div>}
          {success && <div className="marketplace-banner-success">{success}</div>}

          <div className="marketplace-product-detail__actions">
            <button
              type="button"
              className="marketplace-offer-card__add-btn"
              disabled={adding}
              onClick={() => void handleAdd()}
            >
              {adding ? "Adding…" : "Add to cart"}
            </button>
            <button
              type="button"
              className="marketplace-offer-card__ghost-btn"
              onClick={() => navigate("/marketplace")}
            >
              View cart
            </button>
            <button
              type="button"
              className="marketplace-offer-card__ghost-btn"
              onClick={() => setReportOpen(true)}
            >
              Report listing
            </button>
          </div>
        </div>
      </div>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="listing"
        contentId={product.id}
      />
    </div>
  );
};

export default MarketplaceProductPage;
