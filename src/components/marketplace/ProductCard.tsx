import React from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LazyImage from "../LazyImage";
import type { MarketplaceProduct } from "../../services/marketplaceApi";
import {
  formatMarketplaceMoney,
  getProductImage,
  getProductName,
} from "../../utils/marketplaceDisplay";

interface ProductCardProps {
  product: MarketplaceProduct;
  onAddToCart: (productId: string) => Promise<void>;
  addPending?: boolean;
  addMessage?: string | null;
  addError?: string | null;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  addPending = false,
  addMessage,
  addError,
}) => {
  const navigate = useNavigate();
  const image = getProductImage(product);
  const name = getProductName(product);

  return (
    <article className="marketplace-offer-card marketplace-product-card">
      <div className="marketplace-offer-card__highlight">
        <button
          type="button"
          className="marketplace-product-card__image-btn"
          onClick={() => navigate(`/marketplace/products/${product.id}`)}
        >
          {image ? (
            <LazyImage src={image} alt={name} className="marketplace-offer-card__thumb" />
          ) : (
            <div className="marketplace-offer-card__thumb-placeholder">No image</div>
          )}
        </button>
        <div className="marketplace-offer-card__body">
          <h3 className="marketplace-offer-card__title">{name}</h3>
          {product.category && (
            <p className="marketplace-offer-card__meta">{String(product.category)}</p>
          )}
          {product.description && (
            <p className="marketplace-offer-card__preview">
              {String(product.description).slice(0, 120)}
              {String(product.description).length > 120 ? "…" : ""}
            </p>
          )}
          <div className="marketplace-offer-card__row">
            <span className="marketplace-offer-card__price">
              {formatMarketplaceMoney(product.price)}
            </span>
            <div className="marketplace-offer-card__actions">
              <button
                type="button"
                className="marketplace-offer-card__ghost-btn"
                onClick={() => navigate(`/marketplace/products/${product.id}`)}
              >
                View
              </button>
              <button
                type="button"
                className="marketplace-offer-card__add-btn"
                disabled={addPending}
                onClick={() => void onAddToCart(product.id)}
              >
                {addPending ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Adding…
                  </>
                ) : (
                  "Add to cart"
                )}
              </button>
            </div>
          </div>
          {addMessage && (
            <p className="marketplace-product-card__feedback marketplace-product-card__feedback--success">
              {addMessage}
            </p>
          )}
          {addError && (
            <p className="marketplace-product-card__feedback marketplace-product-card__feedback--error">
              {addError}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
