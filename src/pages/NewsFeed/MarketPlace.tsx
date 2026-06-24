import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShoppingCart, Plus, Store, Loader2 } from "lucide-react";
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
import ProductCard from "../../components/marketplace/ProductCard";
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
  listingMarketplaceApi,
  normalizeProductList,
  type ApiCartItem,
  type ApiMarketplaceListing,
  type ApiMediaItem,
  type CheckoutBuyerPayload,
  type MarketplaceCart,
  type MarketplaceProduct,
} from "../../services/marketplaceApi";
import { formatMarketplaceMoney } from "../../utils/marketplaceDisplay";

type MarketplaceTab = "market" | "my-offers" | "cbrixi" | "cart";

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
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("market");
  const [cartSource, setCartSource] = useState<"local" | "cbrixi">("local");

  const [marketListings, setMarketListings] = useState<ApiMarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<ApiMarketplaceListing[]>([]);
  const [cartItems, setCartItems] = useState<CartRow[]>([]);

  const [cbrixiProducts, setCbrixiProducts] = useState<MarketplaceProduct[]>([]);
  const [cbrixiCart, setCbrixiCart] = useState<MarketplaceCart | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiMarketplaceListing | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications] = useState<{ isRead: boolean }[]>([]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

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
  const [cbrixiLoading, setCbrixiLoading] = useState(false);
  const [cbrixiCartLoading, setCbrixiCartLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [cbrixiError, setCbrixiError] = useState<string | null>(null);
  const [cbrixiCartError, setCbrixiCartError] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [pendingAddId, setPendingAddId] = useState<string | null>(null);
  const [addFeedback, setAddFeedback] = useState<Record<string, { ok?: string; err?: string }>>({});
  const [pendingCartItemId, setPendingCartItemId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setExpandedId(null);
  }, [activeTab]);

  const cbrixiCategories = useMemo(() => {
    const set = new Set<string>(["All"]);
    cbrixiProducts.forEach((p) => {
      if (p.category) set.add(String(p.category));
    });
    return Array.from(set);
  }, [cbrixiProducts]);

  const sidebarCategories = activeTab === "cbrixi" ? cbrixiCategories : categories;

  const loadLocalCart = useCallback(async () => {
    if (!isAuthenticated() || !personalConsumer) {
      setCartItems([]);
      return;
    }
    setIsCartLoading(true);
    const res = await listingMarketplaceApi.getListingCart();
    setIsCartLoading(false);
    if (res.success && Array.isArray(res.data)) {
      setCartItems(res.data.map(mapApiCartItem));
      setError(null);
    } else {
      setCartItems([]);
      if (res.message) setError(res.message);
    }
  }, [personalConsumer]);

  const loadCbrixiCart = useCallback(async () => {
    setCbrixiCartLoading(true);
    setCbrixiCartError(null);
    try {
      const response = await marketplaceApi.getCart();
      setCbrixiCart(response.data);
    } catch (err) {
      setCbrixiCart(null);
      setCbrixiCartError(err instanceof Error ? err.message : "Could not load cart.");
    } finally {
      setCbrixiCartLoading(false);
    }
  }, []);

  const loadMyListings = useCallback(async () => {
    if (!businessAccount || !isAuthenticated()) {
      setMyListings([]);
      return;
    }
    setMyOffersLoading(true);
    const res = await listingMarketplaceApi.myListings();
    setMyOffersLoading(false);
    if (res.success && Array.isArray(res.data)) {
      setMyListings(res.data);
    } else {
      setMyListings([]);
    }
  }, [businessAccount]);

  const loadCbrixiProducts = useCallback(async () => {
    setCbrixiLoading(true);
    setCbrixiError(null);
    try {
      const response = await marketplaceApi.getProducts({
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: debouncedSearch || undefined,
        page: 1,
        limit: 40,
      });
      setCbrixiProducts(normalizeProductList(response.data));
    } catch (err) {
      setCbrixiProducts([]);
      setCbrixiError(err instanceof Error ? err.message : "Could not load Cbrixi products.");
    } finally {
      setCbrixiLoading(false);
    }
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    if (personalConsumer && isAuthenticated()) {
      void loadLocalCart();
    }
  }, [personalConsumer, loadLocalCart]);

  useEffect(() => {
    if (activeTab !== "market") return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    void listingMarketplaceApi
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
    if (activeTab !== "cbrixi") return;
    void loadCbrixiProducts();
  }, [activeTab, loadCbrixiProducts]);

  useEffect(() => {
    if (activeTab !== "my-offers") return;
    void loadMyListings();
  }, [activeTab, loadMyListings]);

  useEffect(() => {
    if (activeTab !== "cart") return;
    if (cartSource === "cbrixi") void loadCbrixiCart();
    else void loadLocalCart();
  }, [activeTab, cartSource, loadCbrixiCart, loadLocalCart]);

  useEffect(() => {
    void loadCbrixiCart();
  }, [loadCbrixiCart]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleTabChange = (tab: MarketplaceTab) => {
    setActiveTab(tab);
    if (tab === "cbrixi") setCartSource("cbrixi");
    if (tab === "market" || tab === "my-offers") setCartSource("local");
  };

  const displayListings = useMemo(() => {
    if (activeTab === "market") return marketListings;
    if (activeTab === "my-offers") return myListings;
    return [];
  }, [activeTab, marketListings, myListings]);

  const handleAddToLocalCart = async (listing: ApiMarketplaceListing, quantity = 1) => {
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
    setCartSource("local");
    setError(null);
    const res = await listingMarketplaceApi.addListingToCart(
      Number(listing.id),
      Math.max(1, quantity)
    );
    if (!res.success) {
      setError(res.message ?? "Could not add to cart.");
      return;
    }
    setCartSuccess(
      `${quantity} × ${listing.title} added to cart. Continue shopping or go to checkout.`
    );
    void loadLocalCart();
  };

  const handleRemoveFromLocalCart = async (cartItemId: string) => {
    if (!personalConsumer) return;
    const res = await listingMarketplaceApi.removeListingCartItem(Number(cartItemId));
    if (res.success) void loadLocalCart();
    else setError(res.message ?? "Could not remove item.");
  };

  const handleUpdateLocalQuantity = async (cartItemId: string, quantity: number) => {
    if (!personalConsumer) return;
    if (quantity <= 0) {
      await handleRemoveFromLocalCart(cartItemId);
      return;
    }
    setError(null);
    const res = await listingMarketplaceApi.updateListingCartItem(
      Number(cartItemId),
      quantity
    );
    if (res.success) void loadLocalCart();
    else setError(res.message ?? "Could not update quantity.");
  };

  const handleAddToCbrixiCart = async (productId: string) => {
    setCartSource("cbrixi");
    setPendingAddId(productId);
    setAddFeedback((prev) => ({ ...prev, [productId]: {} }));
    try {
      const response = await marketplaceApi.addToCart(productId, 1);
      setCbrixiCart(response.data);
      setAddFeedback((prev) => ({
        ...prev,
        [productId]: { ok: "Added to cart." },
      }));
    } catch (err) {
      setAddFeedback((prev) => ({
        ...prev,
        [productId]: {
          err: err instanceof Error ? err.message : "Could not add to cart.",
        },
      }));
    } finally {
      setPendingAddId(null);
    }
  };

  const mutateCbrixiCartItem = async (
    itemId: string,
    action: "increase" | "decrease" | "remove"
  ) => {
    setPendingCartItemId(itemId);
    setCbrixiCartError(null);
    try {
      const response =
        action === "increase"
          ? await marketplaceApi.increaseCartItem(itemId)
          : action === "decrease"
            ? await marketplaceApi.decreaseCartItem(itemId)
            : await marketplaceApi.removeCartItem(itemId);
      setCbrixiCart(response.data);
    } catch (err) {
      setCbrixiCartError(err instanceof Error ? err.message : "Cart update failed.");
    } finally {
      setPendingCartItemId(null);
    }
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
      const res = await listingMarketplaceApi.updateListing(Number(editTarget.id), {
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
    const res = await listingMarketplaceApi.createListing(payload);
    if (res.success) void loadMyListings();
    return { success: !!res.success, message: res.message };
  };

  const handleDeleteListing = async (listing: ApiMarketplaceListing) => {
    if (!window.confirm(`Remove "${listing.title}" from your offers?`)) return;
    const res = await listingMarketplaceApi.deleteListing(Number(listing.id));
    if (res.success) void loadMyListings();
    else setError(res.message ?? "Could not delete.");
  };

  const localCartTotal = useMemo(
    () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
    [cartItems]
  );

  const handleCheckoutSubmit = async (payload: CheckoutBuyerPayload) => {
    const res = await listingMarketplaceApi.listingCheckout(payload);
    if (res.success && res.data) {
      setCartSuccess(null);
      void loadLocalCart();
      void listingMarketplaceApi
        .listProducts({ category: selectedCategory, search: debouncedSearch })
        .then((r) => {
          if (r.success && r.data) setMarketListings(r.data);
        });
    }
    return { success: !!res.success, data: res.data, message: res.message };
  };

  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  const showSidebar =
    activeTab === "market" || activeTab === "cbrixi";

  const localCartCount = useMemo(
    () => cartItems.reduce((s, i) => s + i.quantity, 0),
    [cartItems]
  );

  const cbrixiCartCount = cbrixiCart?.total_quantity ?? 0;

  const cartTabBadge =
    activeTab === "cbrixi" || cartSource === "cbrixi" ? cbrixiCartCount : localCartCount;

  return (
    <div className="marketplace-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onProfileClick={handleProfileClick}
        onNotificationClick={() => setIsNotificationPanelOpen(true)}
        onMessageClick={() => setIsChatPanelOpen(true)}
        onAddFriendClick={() => setIsAddFriendModalOpen(true)}
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
              <p className="marketplace-hero__subtitle">
                Discover new products from local businesses
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="marketplace-hero__search"
              >
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
              type="button"
              className={`marketplace-tabs__item ${
                activeTab === "market" ? "marketplace-tabs__item--active" : ""
              }`}
              onClick={() => handleTabChange("market")}
            >
              Market
            </button>
            {businessAccount && (
              <button
                type="button"
                className={`marketplace-tabs__item ${
                  activeTab === "my-offers" ? "marketplace-tabs__item--active" : ""
                }`}
                onClick={() => handleTabChange("my-offers")}
              >
                <Store size={18} />
                My offers
              </button>
            )}
            <button
              type="button"
              className={`marketplace-tabs__item ${
                activeTab === "cbrixi" ? "marketplace-tabs__item--active" : ""
              }`}
              onClick={() => handleTabChange("cbrixi")}
            >
              Cbrixi
            </button>
            <button
              type="button"
              className={`marketplace-tabs__item marketplace-tabs__item--cart ${
                activeTab === "cart" ? "marketplace-tabs__item--active" : ""
              }`}
              onClick={() => {
                if (activeTab === "cbrixi") setCartSource("cbrixi");
                else if (activeTab === "market" || activeTab === "my-offers") {
                  setCartSource("local");
                }
                setActiveTab("cart");
              }}
            >
              <span className="marketplace-tabs__cart-wrap">
                <ShoppingCart size={18} />
                {cartTabBadge > 0 && (
                  <span className="marketplace-tabs__badge" aria-label={`${cartTabBadge} items in cart`}>
                    {cartTabBadge > 99 ? "99+" : cartTabBadge}
                  </span>
                )}
              </span>
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
            {showSidebar && (
              <aside
                className={`marketplace-sidebar-container ${
                  isLeftSidebarOpen ? "marketplace-sidebar-container--open" : ""
                }`}
              >
                <div className="marketplace-sidebar">
                  <div className="marketplace-sidebar__header">
                    <h3>Categories</h3>
                    <button
                      type="button"
                      className="marketplace-sidebar__close"
                      onClick={() => setIsLeftSidebarOpen(false)}
                      aria-label="Close sidebar"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <nav className="marketplace-sidebar__nav">
                    {sidebarCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`marketplace-sidebar__item ${
                          selectedCategory === category
                            ? "marketplace-sidebar__item--active"
                            : ""
                        }`}
                        onClick={() => handleCategoryClick(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>
            )}

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
                {error && (activeTab === "market" || (activeTab === "cart" && cartSource === "local")) && (
                  <div className="marketplace-banner-error" role="alert">
                    {error}
                    <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
                      ×
                    </button>
                  </div>
                )}

                {activeTab === "cart" ? (
                  cartSource === "cbrixi" ? (
                    cbrixiCartLoading ? (
                      <div className="marketplace-empty">
                        <Loader2 size={32} className="spinner" />
                        <h2 className="marketplace-empty__title">Loading cart…</h2>
                      </div>
                    ) : (
                      <>
                        {cbrixiCartError && (
                          <div className="marketplace-banner-error">{cbrixiCartError}</div>
                        )}
                        {!cbrixiCart?.items?.length ? (
                          <div className="marketplace-empty">
                            <h2 className="marketplace-empty__title">Your Cbrixi cart is empty</h2>
                            <p className="marketplace-empty__message">
                              Browse the <strong>Cbrixi</strong> tab to add items.
                            </p>
                          </div>
                        ) : (
                          <div className="marketplace-cart-page">
                            <div className="marketplace-cart-summary">
                              <span>Subtotal</span>
                              <strong>{formatMarketplaceMoney(cbrixiCart.subtotal)}</strong>
                            </div>
                            <div className="marketplace-cart">
                              {cbrixiCart.items.map((item) => (
                                <div key={item.id} className="marketplace-cart-item">
                                  {item.product_image_snapshot ? (
                                    <LazyImage
                                      src={item.product_image_snapshot}
                                      alt={item.product_name_snapshot}
                                      className="marketplace-cart-item__image"
                                    />
                                  ) : (
                                    <div className="marketplace-cart-item__image marketplace-cart-item__image--placeholder" />
                                  )}
                                  <div className="marketplace-cart-item__content">
                                    <h3 className="marketplace-cart-item__title">
                                      {item.product_name_snapshot}
                                    </h3>
                                    <p className="marketplace-cart-item__price">
                                      {formatMarketplaceMoney(item.unit_price_snapshot)} each ·{" "}
                                      {formatMarketplaceMoney(item.total_price)} total
                                    </p>
                                    <div className="marketplace-cart-item__actions-row">
                                      <button
                                        type="button"
                                        className="marketplace-cart-item__action-link"
                                        disabled={pendingCartItemId === item.id}
                                        onClick={() => void mutateCbrixiCartItem(item.id, "remove")}
                                      >
                                        Remove
                                      </button>
                                      <div className="marketplace-cart-item__controls">
                                        <button
                                          type="button"
                                          className="marketplace-cart-item__btn"
                                          disabled={pendingCartItemId === item.id}
                                          onClick={() =>
                                            void mutateCbrixiCartItem(item.id, "decrease")
                                          }
                                        >
                                          −
                                        </button>
                                        <span className="marketplace-cart-item__quantity">
                                          {item.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          className="marketplace-cart-item__btn"
                                          disabled={pendingCartItemId === item.id}
                                          onClick={() =>
                                            void mutateCbrixiCartItem(item.id, "increase")
                                          }
                                        >
                                          +
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
                                onClick={() => navigate("/marketplace/checkout")}
                              >
                                Proceed to checkout
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  ) : isCartLoading ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">Loading…</h2>
                    </div>
                  ) : !personalConsumer ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">Cart is for personal accounts</h2>
                      <p className="marketplace-empty__message">
                        Business accounts publish offers under <strong>My offers</strong>. Switch to
                        a personal profile to shop and checkout.
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
                        <strong>₦{localCartTotal.toLocaleString()}</strong>
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
                                  onClick={() => void handleRemoveFromLocalCart(item.id)}
                                >
                                  Remove from cart
                                </button>
                                <div className="marketplace-cart-item__controls">
                                  <button
                                    type="button"
                                    className="marketplace-cart-item__btn"
                                    onClick={() =>
                                      void handleUpdateLocalQuantity(item.id, item.quantity - 1)
                                    }
                                  >
                                    −
                                  </button>
                                  <span className="marketplace-cart-item__quantity">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="marketplace-cart-item__btn marketplace-cart-item__btn--add-more"
                                    onClick={() =>
                                      void handleUpdateLocalQuantity(item.id, item.quantity + 1)
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
                ) : activeTab === "cbrixi" ? (
                  cbrixiLoading ? (
                    <div className="marketplace-empty">
                      <Loader2 size={32} className="spinner" />
                      <h2 className="marketplace-empty__title">Loading Cbrixi products…</h2>
                    </div>
                  ) : cbrixiError ? (
                    <div className="marketplace-banner-error">{cbrixiError}</div>
                  ) : cbrixiProducts.length === 0 ? (
                    <div className="marketplace-empty">
                      <h2 className="marketplace-empty__title">No Cbrixi products found</h2>
                    </div>
                  ) : (
                    <div className="marketplace-grid marketplace-grid--offers">
                      {cbrixiProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCbrixiCart}
                          addPending={pendingAddId === product.id}
                          addMessage={addFeedback[product.id]?.ok}
                          addError={addFeedback[product.id]?.err}
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
                        onAddToCart={(l, qty) => void handleAddToLocalCart(l, qty)}
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
