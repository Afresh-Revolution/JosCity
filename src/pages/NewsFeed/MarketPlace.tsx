import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShoppingCart } from "lucide-react";
import moviesBg from "../../image/movies-bg.jpg";
import moviesImg from "../../image/movies-imgg.png";
import "../../main.css";
import "../../scss/_newsfeed.scss";
import "../../scss/_marketplace.scss";
import LazyImage from "../../components/LazyImage";
import NewsFeedHeader from "./NewsFeedHeader";
import FindFriendsModal from "../../components/FindFriendsModal";
import { getProfileUsername } from "../../utils/userUtils";
// API removed - using fallback data only
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  category: string;
  stock?: number;
}

interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  price: number;
}

const MarketPlace: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"market" | "cart">("market");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modal/Panel states
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications] = useState<any[]>([]); // Empty notifications for now

  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Handle profile navigation
  const handleProfileClick = () => {
    const username = getProfileUsername();
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setIsNotificationPanelOpen(true);
  };

  // Handle message click
  const handleMessageClick = () => {
    setIsChatPanelOpen(true);
  };

  // Handle add friend click
  const handleAddFriendClick = () => {
    setIsAddFriendModalOpen(true);
  };
  // Initialize with default categories as fallback
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
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories initialized with fallback data (API removed)
  // Categories are already set in useState above

  // API removed - no data fetching, will show empty state
  useEffect(() => {
    if (activeTab === "market") {
      setIsLoading(false);
      setAllProducts([]);
      setError(null);
    }
  }, [selectedCategory, searchQuery, activeTab]);

  // Fetch cart items when cart tab is active (API removed - using empty state)
  useEffect(() => {
    if (activeTab === "cart") {
      setIsCartLoading(false);
      setCartItems([]);
      setError(null);
    }
  }, [activeTab]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by API call in useEffect
  };

  // Products are already filtered by API
  const filteredProducts = useMemo(() => {
    return allProducts;
  }, [allProducts]);

  // API removed - cart functions disabled
  const handleAddToCart = async (_productId: string) => {
    setError("Cart functionality disabled (API removed)");
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  return (
    <div className="marketplace-page">
      {/* Top Navigation Bar - Using NewsFeed Header */}
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onProfileClick={handleProfileClick}
        onNotificationClick={handleNotificationClick}
        onMessageClick={handleMessageClick}
        onAddFriendClick={handleAddFriendClick}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="marketplace-container">
        {/* Mobile Overlay */}
        {isLeftSidebarOpen && (
          <div
            className="marketplace-overlay"
            onClick={() => setIsLeftSidebarOpen(false)}
          />
        )}

        {/* Hero/Banner Section */}
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
              <p className="marketplace-hero__subtitle">Discover new Products</p>
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

        {/* White Rounded Card - Overlaps Hero and Contains Tabs */}
        <div className="marketplace-tabs-card">
          <div className="marketplace-tabs">
            <button
              className={`marketplace-tabs__item ${
                activeTab === "market" ? "marketplace-tabs__item--active" : ""
              }`}
              onClick={() => setActiveTab("market")}
            >
              Market
            </button>
            <button
              className={`marketplace-tabs__item ${
                activeTab === "cart" ? "marketplace-tabs__item--active" : ""
              }`}
              onClick={() => setActiveTab("cart")}
            >
              <ShoppingCart size={18} />
              Shopping Cart
            </button>
          </div>
        </div>

        {/* Categories and Content Section (Light Gray Background) */}
        <div className="marketplace-content-section">
          <div className="marketplace-main-layout">
          {/* Left Sidebar - Categories Container */}
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

          {/* Main Content Area Container */}
          <main className="marketplace-content-container">
            <div className="marketplace-content">
            {activeTab === "market" ? (
              // Market Tab Content
              isLoading ? (
                <div className="marketplace-empty">
                  <div className="marketplace-empty__icon">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="spinning"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <h2 className="marketplace-empty__title">Loading...</h2>
                  <p className="marketplace-empty__message">
                    Please wait while we fetch products.
                  </p>
                </div>
              ) : error ? (
                <div className="marketplace-empty">
                  <div className="marketplace-empty__icon">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h2 className="marketplace-empty__title">Error</h2>
                  <p className="marketplace-empty__message">{error}</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="marketplace-empty">
                  <div className="marketplace-empty__icon">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <circle cx="17.5" cy="17.5" r="3.5" />
                      <path d="M17.5 14v7M17.5 14h7" />
                    </svg>
                  </div>
                  <h2 className="marketplace-empty__title">No Data Found</h2>
                  <p className="marketplace-empty__message">
                    There is no data to show you right now.
                  </p>
                </div>
              ) : (
                <div className="marketplace-grid">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="marketplace-product-card">
                      <LazyImage
                        src={product.image_url}
                        alt={product.name}
                        className="marketplace-product-card__image"
                      />
                      <div className="marketplace-product-card__content">
                        <h3 className="marketplace-product-card__title">
                          {product.name}
                        </h3>
                        <p className="marketplace-product-card__description">
                          {product.description}
                        </p>
                        <div className="marketplace-product-card__footer">
                          <span className="marketplace-product-card__price">
                            ₦{product.price.toLocaleString()}
                          </span>
                          <button
                            className="marketplace-product-card__add-btn"
                            onClick={() => handleAddToCart(product.id)}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Shopping Cart Tab Content
              isCartLoading ? (
                <div className="marketplace-empty">
                  <div className="marketplace-empty__icon">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="spinning"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <h2 className="marketplace-empty__title">Loading...</h2>
                  <p className="marketplace-empty__message">
                    Please wait while we fetch your cart.
                  </p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="marketplace-empty">
                  <div className="marketplace-empty__icon">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <circle cx="17.5" cy="17.5" r="3.5" />
                      <path d="M17.5 14v7M17.5 14h7" />
                    </svg>
                  </div>
                  <h2 className="marketplace-empty__title">Your Cart is Empty</h2>
                  <p className="marketplace-empty__message">
                    Add some products to your cart to get started.
                  </p>
                </div>
              ) : (
                <div className="marketplace-cart">
                  {cartItems.map((item) => (
                    <div key={item.id} className="marketplace-cart-item">
                      <LazyImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="marketplace-cart-item__image"
                      />
                      <div className="marketplace-cart-item__content">
                        <h3 className="marketplace-cart-item__title">
                          {item.product.name}
                        </h3>
                        <p className="marketplace-cart-item__price">
                          ₦{item.price.toLocaleString()}
                        </p>
                        <div className="marketplace-cart-item__controls">
                          <button
                            className="marketplace-cart-item__btn"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span className="marketplace-cart-item__quantity">
                            {item.quantity}
                          </span>
                          <button
                            className="marketplace-cart-item__btn"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                          <button
                            className="marketplace-cart-item__remove-btn"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            </div>
          </main>
          </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      <FindFriendsModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
      />

      {/* Chat Panel */}
      {isChatPanelOpen && (
        <div
          className="newsfeed-chat-panel-overlay"
          onClick={() => setIsChatPanelOpen(false)}
        >
          <div
            className="newsfeed-chat-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="newsfeed-chat-panel__header">
              <h3>Messages</h3>
              <button
                className="newsfeed-chat-panel__close"
                onClick={() => setIsChatPanelOpen(false)}
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="newsfeed-chat-panel__content">
              <div className="newsfeed-chat-panel__empty">
                <p>No messages yet</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
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

