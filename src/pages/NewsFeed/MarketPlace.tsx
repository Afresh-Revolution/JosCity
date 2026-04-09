import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShoppingCart, Plus, Store } from "lucide-react";
import moviesBg from "../../image/movies-bg.jpg";
import moviesImg from "../../image/movies-imgg.png";
import "../../main.css";
import "../../scss/_newsfeed.scss";
import "../../scss/_marketplace.scss";
import LazyImage from "../../components/LazyImage";
import NewsFeedHeader from "./NewsFeedHeader";
import FindFriendsModal from "../../components/FindFriendsModal";
import ChatPanel from "../../components/ChatPanel";
import OfferCard from "../../components/marketplace/OfferCard";
import CreateListingModal from "../../components/marketplace/CreateListingModal";
import CheckoutModal from "../../components/marketplace/CheckoutModal";
import {
  getProfileUsername,
  isAuthenticated,
  isBusinessUser,
  isPersonalConsumerUser,
  getUserEmail,
  getUserId,
} from "../../utils/userUtils";
import {
  marketplaceApi,
  type ApiCartItem,
  type ApiMarketplaceListing,
  type ApiMediaItem,
  type CheckoutBuyerPayload,
} from "../../services/marketplaceApi";

interface CartRow {
  id: string;
  listing_id: string;
  listing: ApiMarketplaceListing;
  quantity: number;
  price: number;
}

function mapApiCartItem(row: ApiCartItem): CartRow {
  const listing = row.listing || row.product;
  return {
    id: row.id,
    listing_id: row.listing_id,
    listing,
    quantity: row.quantity,
    price: row.price,
  };
}

const MarketPlace: React.FC = () => {
  const navigate = useNavigate();
  const businessAccount = isBusinessUser();
  const personalConsumer = isPersonalConsumerUser();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"market" | "my-offers" | "cart">("market");
  const [marketListings, setMarketListings] = useState<ApiMarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<ApiMarketplaceListing[]>([]);
  const [cartItems, setCartItems] = useState<CartRow[]>([]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiMarketplaceListing | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications] = useState<any[]>([]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  const handleNotificationClick = () => setIsNotificationPanelOpen(true);
  const handleMessageClick = () => setIsChatPanelOpen(true);
  const handleAddFriendClick = () => setIsAddFriendModalOpen(true);

  const [categories] = useState<string[]>([
    "All",
    "Apparel & accessories",
    "Autos & vehicles",
    "Baby & children's products",
    "Beauty products & services",
    "Computers & peripherals",
    "Consumers & Electronics",
    "Dating Services",
    "Financial service",
    "Gifts & Occasions",
    "Home & Garden",
    "Other",
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [myOffersLoading, setMyOffersLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setExpandedId(null);
  }, [activeTab]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated() || !personalConsumer) {
      setCartItems([]);
      return;
    }
    setIsCartLoading(true);
    const res = await marketplaceApi.getCart();
    setIsCartLoading(false);
    if (res.success && Array.isArray(res.data)) {
      setCartItems(res.data.map(mapApiCartItem));
      setError(null);
    } else {
      setCartItems([]);
      if (res.message) setError(res.message);
    }
  }, [personalConsumer]);

  const loadMyListings = useCallback(async () => {
    if (!businessAccount || !isAuthenticated()) {
      setMyListings([]);
      return;
    }
    setMyOffersLoading(true);
    const res = await marketplaceApi.myListings();
    setMyOffersLoading(false);
    if (res.success && Array.isArray(res.data)) {
      setMyListings(res.data);
    } else {
      setMyListings([]);
    }
  }, [businessAccount]);

  useEffect(() => {
    if (activeTab !== "market") return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    void marketplaceApi
      .listProducts({
        category: selectedCategory,
        search: debouncedSearch,
      })
      .then((res) => {
        if (cancelled) return;
        setIsLoading(false);
        if (res.success && Array.isArray(res.data)) {
          setMarketListings(res.data);
        } else {
          setMarketListings([]);
          setError(res.message ?? "Could not load marketplace.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, debouncedSearch, activeTab]);

  useEffect(() => {
    if (activeTab !== "my-offers") return;
    void loadMyListings();
  }, [activeTab, loadMyListings]);

  useEffect(() => {
    if (activeTab !== "cart") return;
    void loadCart();
  }, [activeTab, loadCart]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const displayListings = useMemo(() => {
    if (activeTab === "market") return marketListings;
    if (activeTab === "my-offers") return myListings;
    return [];
  }, [activeTab, marketListings, myListings]);

  const handleAddToCart = async (listing: ApiMarketplaceListing, quantity = 1) => {
    if (!isAuthenticated()) {
      setError("Please sign in to add items to your cart.");
      return;
    }
    if (!personalConsumer) {
      setError("Only personal accounts can add items to the cart.");
      return;
    }
    if (Number(listing.seller_user_id) === getUserId()) {
      setError("You cannot add your own offer to the cart.");
      return;
    }
    setError(null);
    const res = await marketplaceApi.addToCart(Number(listing.id), Math.max(1, quantity));
    if (!res.success) {
      setError(res.message ?? "Could not add to cart.");
      return;
    }
    setCartSuccess(
      `${quantity} × ${listing.title} added to cart. Continue shopping or go to checkout.`
    );
    if (activeTab === "cart") void loadCart();
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    if (!personalConsumer) return;
    const res = await marketplaceApi.removeCartItem(Number(cartItemId));
    if (res.success) void loadCart();
    else setError(res.message ?? "Could not remove item.");
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (!personalConsumer) return;
    if (quantity <= 0) {
      await handleRemoveFromCart(cartItemId);
      return;
    }
    setError(null);
    const res = await marketplaceApi.updateCartItem(Number(cartItemId), quantity);
    if (res.success) void loadCart();
    else setError(res.message ?? "Could not update quantity.");
  };

  const handleSaveListing = async (payload: {
    title: string;
    description: string;
    category: string;
    priceNaira: number;
    quantityTracked: boolean;
    stockQuantity: number | null;
    quantityNote: string | null;
    media: ApiMediaItem[];
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    sellerContactName: string;
    sellerContactPhone: string;
    sellerContactEmail: string;
    sellerContactWhatsapp: string;
  }) => {
    if (editTarget) {
      const res = await marketplaceApi.updateListing(Number(editTarget.id), {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priceNaira: payload.priceNaira,
        quantityTracked: payload.quantityTracked,
        stockQuantity: payload.quantityTracked ? payload.stockQuantity ?? 0 : 0,
        quantityNote: payload.quantityNote,
        media: payload.media,
        bankName: payload.bankName,
        bankAccountNumber: payload.bankAccountNumber,
        bankAccountName: payload.bankAccountName,
        sellerContactName: payload.sellerContactName,
        sellerContactPhone: payload.sellerContactPhone,
        sellerContactEmail: payload.sellerContactEmail,
        sellerContactWhatsapp: payload.sellerContactWhatsapp,
      });
      if (res.success) void loadMyListings();
      return { success: !!res.success, message: res.message };
    }
    const res = await marketplaceApi.createListing(payload);
    if (res.success) void loadMyListings();
    return { success: !!res.success, message: res.message };
  };

  const handleDeleteListing = async (listing: ApiMarketplaceListing) => {
    if (!window.confirm(`Remove “${listing.title}” from your offers?`)) return;
    const res = await marketplaceApi.deleteListing(Number(listing.id));
    if (res.success) void loadMyListings();
    else setError(res.message ?? "Could not delete.");
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
    [cartItems]
  );

  const handleCheckoutSubmit = async (payload: CheckoutBuyerPayload) => {
    const res = await marketplaceApi.checkout(payload);
    if (res.success && res.data) {
      setCartSuccess(null);
      void loadCart();
      void marketplaceApi.listProducts({ category: selectedCategory, search: debouncedSearch }).then((r) => {
        if (r.success && r.data) setMarketListings(r.data);
      });
    }
    return { success: !!res.success, data: res.data, message: res.message };
  };

  return (
    <div className="marketplace-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onProfileClick={handleProfileClick}
        onNotificationClick={handleNotificationClick}
        onMessageClick={handleMessageClick}
        onAddFriendClick={handleAddFriendClick}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      <div className="marketplace-container">
        {isLeftSidebarOpen && (
          <div
            className="marketplace-overlay"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        <section
          className="marketplace-hero"
          style={{ backgroundImage: `url(${moviesBg})` }}
        >
          <div className="marketplace-hero__content">
            <div className="marketplace-hero__image">
              <LazyImage src={moviesImg} alt="MarketPlace Store Illustration" />
            </div>
            <div className="marketplace-hero__text">
              <h1 className="marketplace-hero__title">MarketPlace</h1>
              <p className="marketplace-hero__subtitle">Discover new products from local businesses</p>
              <form onSubmit={handleSearch} className="marketplace-hero__search">
                <input
                  type="text"
                  placeholder="Search for products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="marketplace-hero__search-input"
                />
                <button
                  type="submit"
                  className="marketplace-hero__search-icon"
                  aria-label="Search"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </section>

        <div className="marketplace-tabs-card">
          <div className="marketplace-tabs marketplace-tabs--three">
            <button
              className={`marketplace-tabs__item ${
                activeTab === "market" ? "marketplace-tabs__item--active" : ""
              }`}
              onClick={() => setActiveTab("market")}
            >
              Market
            </button>
            {businessAccount && (
              <button
                className={`marketplace-tabs__item ${
                  activeTab === "my-offers" ? "marketplace-tabs__item--active" : ""
                }`}
                onClick={() => setActiveTab("my-offers")}
              >
                <Store size={18} />
                My offers
              </button>
            )}
            <button
              className={`marketplace-tabs__item ${
                activeTab === "cart" ? "marketplace-tabs__item--active" : ""
              }`}
              onClick={() => setActiveTab("cart")}
            >
              <ShoppingCart size={18} />
              Shopping cart
            </button>
            {businessAccount && isAuthenticated() && (
              <button
                type="button"
                className="marketplace-hero__create-btn marketplace-tabs__create-offer"
                onClick={() => {
                  setEditTarget(null);
                  setCreateModalOpen(true);
                }}
              >
                <Plus size={20} />
                Create offer
              </button>
            )}
          </div>
        </div>

        <div className="marketplace-content-section">
          <div className="marketplace-main-layout">
            <aside
              className={`marketplace-sidebar-container ${
                isLeftSidebarOpen ? "marketplace-sidebar-container--open" : ""
              }`}
            >
              <div className="marketplace-sidebar">
                <div className="marketplace-sidebar__header">
                  <h3>Categories</h3>
                  <button
                    className="marketplace-sidebar__close"
                    onClick={() => setIsLeftSidebarOpen(false)}
                    aria-label="Close sidebar"
                  >
                    <X size={20} />
                  </button>
                </div>
                <nav className="marketplace-sidebar__nav">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`marketplace-sidebar__item ${
                        selectedCategory === category ? "marketplace-sidebar__item--active" : ""
                      }`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <main className="marketplace-content-container">
              <div className="marketplace-content">
                {cartSuccess && (
                  <div className="marketplace-banner-success" role="status" aria-live="polite">
                    {cartSuccess}
                    <button type="button" onClick={() => setCartSuccess(null)} aria-label="Dismiss">
                      ×
                    </button>
                  </div>
                )}
                {error && (activeTab === "market" || activeTab === "cart") && (
                  <div className="marketplace-banner-error" role="alert">
                    {error}
                    <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
                      ×
                    </button>
                  </div>
                )}

                {activeTab === "cart" ? (
                  isCartLoading ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">Loading…</h2>
                    </div>
                  ) : !personalConsumer ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">Cart is for personal accounts</h2>
                      <p className="marketplace-empty__message">
                        Business accounts publish offers under <strong>My offers</strong>. Switch to a personal
                        profile to shop and checkout.
                      </p>
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">Your cart is empty</h2>
                      <p className="marketplace-empty__message">Browse the Market tab to add items.</p>
                    </div>
                  ) : (
                    <div className="marketplace-cart-page">
                      <div className="marketplace-cart-summary">
                        <span>Total</span>
                        <strong>₦{cartTotal.toLocaleString()}</strong>
                      </div>
                      <div className="marketplace-cart">
                        {cartItems.map((item) => (
                          <div key={item.id} className="marketplace-cart-item">
                            <LazyImage
                              src={item.listing.image_url}
                              alt={item.listing.title}
                              className="marketplace-cart-item__image"
                            />
                            <div className="marketplace-cart-item__content">
                              <h3 className="marketplace-cart-item__title">{item.listing.title}</h3>
                              <p className="marketplace-cart-item__price">
                                ₦{item.price.toLocaleString()} each
                              </p>
                              <div className="marketplace-cart-item__actions-row">
                                <button
                                  type="button"
                                  className="marketplace-cart-item__action-link"
                                  onClick={() => void handleRemoveFromCart(item.id)}
                                >
                                  Remove from cart
                                </button>
                                <div className="marketplace-cart-item__controls">
                                  <button
                                    type="button"
                                    className="marketplace-cart-item__btn"
                                    onClick={() =>
                                      void handleUpdateQuantity(item.id, item.quantity - 1)
                                    }
                                  >
                                    −
                                  </button>
                                  <span className="marketplace-cart-item__quantity">{item.quantity}</span>
                                  <button
                                    type="button"
                                    className="marketplace-cart-item__btn marketplace-cart-item__btn--add-more"
                                    onClick={() =>
                                      void handleUpdateQuantity(item.id, item.quantity + 1)
                                    }
                                  >
                                    + Add more
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="marketplace-cart-checkout-wrap">
                        <button
                          type="button"
                          className="marketplace-checkout-main-btn"
                          onClick={() => setCheckoutOpen(true)}
                        >
                          Checkout
                        </button>
                      </div>
                    </div>
                  )
                ) : activeTab === "my-offers" ? (
                  myOffersLoading ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">Loading your offers…</h2>
                    </div>
                  ) : displayListings.length === 0 ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">No offers yet</h2>
                      <p className="marketplace-empty__message">
                        Use <strong>Create offer</strong> above to list a product or service.
                      </p>
                    </div>
                  ) : (
                    <div className="marketplace-grid marketplace-grid--offers">
                      {displayListings.map((listing) => (
                        <OfferCard
                          key={listing.id}
                          listing={listing}
                          variant="mine"
                          expanded={expandedId === listing.id}
                          onToggleExpand={() =>
                            setExpandedId((id) => (id === listing.id ? null : listing.id))
                          }
                          showCartActions={false}
                          showOwnerMenu
                          onEdit={() => {
                            setEditTarget(listing);
                            setCreateModalOpen(true);
                          }}
                          onDelete={() => void handleDeleteListing(listing)}
                        />
                      ))}
                    </div>
                  )
                ) : isLoading ? (
                  <div className="marketplace-empty">
                    <h2 className="marketplace-empty__title">Loading…</h2>
                  </div>
                ) : displayListings.length === 0 ? (
                  <div className="marketplace-empty">
                    <h2 className="marketplace-empty__title">No listings found</h2>
                    <p className="marketplace-empty__message">
                      Try another category or check back when businesses publish offers.
                    </p>
                  </div>
                ) : (
                  <div className="marketplace-grid marketplace-grid--offers">
                    {displayListings.map((listing) => (
                      <OfferCard
                        key={listing.id}
                        listing={listing}
                        variant="market"
                        expanded={expandedId === listing.id}
                        onToggleExpand={() =>
                          setExpandedId((id) => (id === listing.id ? null : listing.id))
                        }
                        showCartActions={personalConsumer}
                        showOwnerMenu={false}
                        onAddToCart={(l, qty) => void handleAddToCart(l, qty)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      <CreateListingModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditTarget(null);
        }}
        categories={categories}
        initialListing={editTarget}
        onSubmit={handleSaveListing}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        defaultEmail={getUserEmail()}
        onSubmit={handleCheckoutSubmit}
      />

      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => setIsChatPanelOpen(false)}
        onUnreadCountChange={setUnreadMessagesCount}
      />

      {isNotificationPanelOpen && (
        <div
          className="newsfeed-notification-panel-overlay"
          onClick={() => setIsNotificationPanelOpen(false)}
        >
          <div
            className="newsfeed-notification-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-notification-panel__header">
              <h3>Notifications</h3>
              <button
                className="newsfeed-notification-panel__close"
                onClick={() => setIsNotificationPanelOpen(false)}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="newsfeed-notification-panel__content">
              <div className="newsfeed-notification-panel__empty">
                <p>No notifications</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPlace;
