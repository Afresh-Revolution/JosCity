import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import LazyImage from "../LazyImage";
import type { ApiMarketplaceListing } from "../../services/marketplaceApi";

export interface OfferCardProps {
  listing: ApiMarketplaceListing;
  variant: "market" | "mine";
  expanded: boolean;
  onToggleExpand: () => void;
  onAddToCart?: (listing: ApiMarketplaceListing, quantity: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Personal accounts: show add to cart when listing is purchasable */
  showCartActions: boolean;
  /** Business dashboard: show ⋮ edit/delete */
  showOwnerMenu: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({
  listing,
  variant,
  expanded,
  onToggleExpand,
  onAddToCart,
  onEdit,
  onDelete,
  showCartActions,
  showOwnerMenu,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setSelectedQty(1);
  }, [listing.id]);

  const previewDescription =
    listing.description && listing.description.length > 100
      ? `${listing.description.slice(0, 100).trim()}…`
      : listing.description || "";

  const stockLabel = listing.quantity_tracked
    ? `${listing.stock ?? 0} in stock`
    : listing.quantity_note || "Service / custom — not sold by unit";
  const contact = listing.contact;
  const hasContact =
    !!contact && !!(contact.name || contact.phone || contact.email || contact.whatsapp);
  const maxQty = listing.quantity_tracked
    ? Math.max(1, Number(listing.stock) || 1)
    : 99;
  const canAdjustQty = showCartActions && listing.can_purchase && maxQty > 1;
  const displayTotal = listing.price * selectedQty;

  return (
    <div
      className={`marketplace-offer-card ${listing.is_sold_out ? "marketplace-offer-card--sold-out" : ""} ${expanded ? "marketplace-offer-card--expanded" : ""}`}
    >
      {listing.is_sold_out && (
        <div className="marketplace-offer-card__sold-badge" aria-label="Sold out">
          Sold out
        </div>
      )}

      {showOwnerMenu && (
        <div className="marketplace-offer-card__menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="marketplace-offer-card__menu-btn"
            aria-label="Offer options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <div className="marketplace-offer-card__menu-dropdown">
              <button
                type="button"
                className="marketplace-offer-card__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.();
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="marketplace-offer-card__menu-item marketplace-offer-card__menu-item--danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.();
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      <div className="marketplace-offer-card__highlight">
        <div className="marketplace-offer-card__media">
          {listing.image_url ? (
            <LazyImage
              src={listing.image_url}
              alt={listing.title}
              className="marketplace-offer-card__thumb"
            />
          ) : (
            <div className="marketplace-offer-card__thumb-placeholder">No image</div>
          )}
        </div>
        <div className="marketplace-offer-card__body">
          <h3 className="marketplace-offer-card__title">{listing.title}</h3>
          <p className="marketplace-offer-card__preview">{previewDescription}</p>
          <p className="marketplace-offer-card__meta">{stockLabel}</p>
          <div className="marketplace-offer-card__row">
            <span className="marketplace-offer-card__price-wrap">
              <span className="marketplace-offer-card__price">
                ₦{displayTotal.toLocaleString()}
              </span>
              {selectedQty > 1 && (
                <span className="marketplace-offer-card__multiplier">x{selectedQty}</span>
              )}
            </span>
            {canAdjustQty && (
              <div className="marketplace-offer-card__qty" aria-label="Choose quantity">
                <button
                  type="button"
                  className="marketplace-offer-card__qty-btn"
                  onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                  disabled={selectedQty <= 1}
                  aria-label="Reduce quantity"
                >
                  −
                </button>
                <span className="marketplace-offer-card__qty-value">{selectedQty}</span>
                <button
                  type="button"
                  className="marketplace-offer-card__qty-btn"
                  onClick={() => setSelectedQty((q) => Math.min(maxQty, q + 1))}
                  disabled={selectedQty >= maxQty}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
            <div className="marketplace-offer-card__actions">
              <button
                type="button"
                className="marketplace-offer-card__ghost-btn"
                onClick={onToggleExpand}
              >
                {expanded ? (
                  <>
                    <ChevronUp size={18} /> Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} /> View more
                  </>
                )}
              </button>
              {showCartActions && listing.can_purchase && (
                <button
                  type="button"
                  className="marketplace-offer-card__add-btn"
                  onClick={() => onAddToCart?.(listing, selectedQty)}
                >
                  Add to cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expand"
            className="marketplace-offer-card__expand-inner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="marketplace-offer-card__expand-content">
              {listing.description && (
                <div className="marketplace-offer-card__detail-block">
                  <h4>Description</h4>
                  <p>{listing.description}</p>
                </div>
              )}
              {listing.media && listing.media.length > 0 && (
                <div className="marketplace-offer-card__gallery">
                  <h4>Gallery</h4>
                  <div className="marketplace-offer-card__gallery-grid">
                    {listing.media.map((m, i) => (
                      <div key={`${m.url}-${i}`} className="marketplace-offer-card__gallery-item">
                        {m.type === "video" ? (
                          <video src={m.url} controls className="marketplace-offer-card__video" />
                        ) : (
                          <LazyImage
                            src={m.url}
                            alt=""
                            className="marketplace-offer-card__gallery-img"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="marketplace-offer-card__detail-block">
                <h4>Details</h4>
                <ul className="marketplace-offer-card__detail-list">
                  <li>
                    <span>Category</span> {listing.category}
                  </li>
                  <li>
                    <span>Price</span> ₦{listing.price.toLocaleString()} (NGN)
                  </li>
                  <li>
                    <span>Availability</span> {stockLabel}
                  </li>
                </ul>
              </div>
              {hasContact && (
                <div className="marketplace-offer-card__detail-block">
                  <h4>Seller contact</h4>
                  <ul className="marketplace-offer-card__detail-list">
                    {contact?.name && (
                      <li>
                        <span>Name</span> {contact.name}
                      </li>
                    )}
                    {contact?.phone && (
                      <li>
                        <span>Phone</span>
                        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                      </li>
                    )}
                    {contact?.email && (
                      <li>
                        <span>Email</span>
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </li>
                    )}
                    {contact?.whatsapp && (
                      <li>
                        <span>WhatsApp</span>
                        <a
                          href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {contact.whatsapp}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {showCartActions && listing.can_purchase && variant === "market" && (
                <button
                  type="button"
                  className="marketplace-offer-card__add-btn marketplace-offer-card__add-btn--wide"
                  onClick={() => onAddToCart?.(listing, selectedQty)}
                >
                  Add to cart
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfferCard;
