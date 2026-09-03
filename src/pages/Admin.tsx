
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../main.css";
import "../scss/_admin.scss";
import {
  Search,
  Plus,
  Bell,
  User,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingBag,
  DollarSign,
  Wallet,
  TrendingUp,
  Gift,
  Code,
  CheckCircle,
  XCircle,
  BarChart3,
  Megaphone,
  Settings,
  Menu,
  Flag,
  Newspaper,
  HelpCircle,
  Zap,
  UserCircle,
  LogOut,
  BadgeCheck,
} from "lucide-react";
import primaryLogo from "../image/primary-logo.png";
import userAvatar from "../image/sky.png";
import PagesControlPanel from "../components/PagesControlPanel";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminSettings from "./AdminSettings";
import AdminUsers from "./AdminUsers";
import AdminPosts from "./AdminPosts";
import AdminPages from "./AdminPages";
import AdminGroups from "./AdminGroups";
import AdminForums from "./AdminForums";
import AdminEvents from "./AdminEvents";
import AdminReports from "./AdminReports";
import AdminFeedback from "./AdminFeedback";
import AdminFaqs from "./AdminFaqs";
import AdminVerification from "./AdminVerification";
import AdminWallet from "./AdminWallet";
import AdminAds from "./AdminAds";
import AdminPro from "./AdminPro";
import AdminAffiliates from "./AdminAffiliates";
import AdminPoints from "./AdminPoints";
import AdminMarket from "./AdminMarket";
import AdminFunding from "./AdminFunding";
import AdminMonetization from "./AdminMonetization";
import AdminNotifications from "./AdminNotifications";
import AdminNews from "./AdminNews";
import AdminDevelopers from "./AdminDevelopers";
import AdminMembershipList from "./AdminMembershipList";
import { getDashboard, getStats, refreshAdminToken, type DashboardData } from "../services/adminApi";
import { fetchPendingRegistrations } from "../utils/fetchWithTimeout";
import AdminNavBadge from "../components/AdminNavBadge";

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<Record<string, unknown> | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    users: true,
    modules: true,
    money: true,
    payments: true,
    developers: true,
    tools: true,
    plugins: false,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    | "dashboard"
    | "settings"
    | "users"
    | "posts"
    | "pages"
    | "groups"
    | "forums"
    | "events"
    | "reports"
    | "feedback"
    | "faqs"
    | "verification"
    | "wallet"
    | "ads"
    | "pro"
    | "affiliates"
    | "points"
    | "market"
    | "funding"
    | "monetization"
    | "notifications"
    | "news"
    | "developers"
    | "memberships"
  >("dashboard");
  const [dashboardData, setDashboardData] = useState<DashboardData["data"] | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [attention, setAttention] = useState({
    deactivatedAccounts: 0,
    pendingApprovals: 0,
    pendingFunding: 0,
    pendingWithdrawals: 0,
    pendingReports: 0,
    pendingVerifications: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Load admin data on mount
  useEffect(() => {
    const adminDataStr = localStorage.getItem("adminData");
    if (adminDataStr) {
      try {
        setAdminData(JSON.parse(adminDataStr));
      } catch (e) {
        console.error("Failed to parse admin data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("🔄 Loading dashboard data...");
        const data = await getDashboard();
        console.log("✅ Dashboard data loaded:", data.data);
        setDashboardData(data.data);
        const insights = data.data?.insights;
        if (insights) {
          setAttention({
            deactivatedAccounts: Number(insights.deactivatedAccounts || 0),
            pendingApprovals: Number(insights.pendingApprovals || 0),
            pendingFunding: Number(insights.pendingFunding || 0),
            pendingWithdrawals: Number(insights.pendingWithdrawals || 0),
            pendingReports: Number(insights.pendingReports || 0),
            pendingVerifications: Number(insights.pendingVerifications || 0),
          });
        }
        // Renew admin token (new 7-day expiry) so it doesn’t expire while in use
        refreshAdminToken();
      } catch (err) {
        console.error("❌ Failed to load dashboard:", err);
        const status = (err as Error & { status?: number }).status;
        const message = err instanceof Error ? err.message : String(err);
        // 401: token missing, expired, or invalid — send to login without affecting other pages
        if (status === 401 || /unauthorized|token|401/i.test(message)) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminData");
          navigate("/admin/login", { replace: true });
          return;
        }
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  // Fetch pending registrations count
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const pendingRegistrations = await fetchPendingRegistrations();
        // Count items with status "pending"
        const count = Array.isArray(pendingRegistrations)
          ? pendingRegistrations.filter((reg) => reg?.status === "pending").length
          : 0;
        console.log("📊 Pending count:", count);
        setPendingCount(count);
      } catch (error) {
        console.error("❌ Failed to load pending count:", error);
        // Set to 0 on error
        setPendingCount(0);
      }
    };

    loadPendingCount();
    // Refresh count every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadAttention = async () => {
      try {
        const response = await getStats();
        const payload = response.data as Record<string, unknown> | undefined;
        const insights = (
          payload?.insights && typeof payload.insights === "object"
            ? payload.insights
            : payload
        ) as Record<string, unknown> | undefined;
        if (!insights) return;
        setAttention({
          deactivatedAccounts: Number(insights.deactivatedAccounts || 0),
          pendingApprovals: Number(insights.pendingApprovals || 0),
          pendingFunding: Number(insights.pendingFunding || 0),
          pendingWithdrawals: Number(insights.pendingWithdrawals || 0),
          pendingReports: Number(insights.pendingReports || 0),
          pendingVerifications: Number(insights.pendingVerifications || 0),
        });
      } catch {
        // keep last known counts
      }
    };
    void loadAttention();
    const interval = setInterval(loadAttention, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminData");
      navigate("/admin/login");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Chart data from backend or default empty data
  // Ensure chartData is always an array
  const defaultChartData = [
    { month: "Jan", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Feb", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Mar", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Apr", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "May", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Jun", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Jul", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Aug", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Sep", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Oct", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Nov", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
    { month: "Dec", users: 0, pages: 0, groups: 0, events: 0, posts: 0 },
  ];
  
  const chartData = Array.isArray(dashboardData?.chart) 
    ? dashboardData.chart 
    : defaultChartData;

  // Set max value to 100 for y-axis
  const maxValue = 100;

  const chartHeight = 280;

  const getBarHeight = (value: number) => {
    return (value / maxValue) * chartHeight;
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="admin-page">
        {/* Header Bar */}
        <header className="admin-header">
          <div className="admin-header__container">
            <div className="admin-header__left">
              <button
                className="admin-header__menu-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu">
                <Menu size={24} />
              </button>
              <div className="admin-header__logo">
                <img src={primaryLogo} alt="JOSCity Logo" />
              </div>
            </div>
            <div className="admin-header__actions">
              <button
                className="admin-header__icon-btn admin-header__icon-btn--plus"
                title="Add">
                <Plus size={20} />
              </button>
              <button 
                className="admin-header__icon-btn admin-header__icon-btn--notifications" 
                title={`Notifications${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
                onClick={() => setActiveView("settings")}
                style={{ position: "relative", overflow: "visible" }}
              >
                <Bell size={20} />
                {pendingCount > 0 && (
                  <span 
                    className="admin-header__notification-badge"
                    data-count={pendingCount}
                    style={{ 
                      display: "flex",
                      visibility: "visible",
                      opacity: 1
                    }}
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </button>
              <button 
                className="admin-header__icon-btn" 
                title="Profile"
                onClick={() => navigate("/admin/profile")}
              >
                <User size={20} />
              </button>
              <button className="admin-header__icon-btn" title="Messages">
                <MessageSquare size={20} />
              </button>
              <div className="admin-header__profile">
                <div className="admin-header__avatar">
                  <img
                    src={userAvatar}
                    alt="Admin Avatar"
                    width={32}
                    height={32}
                  />
                </div>
                <span>
                  {(adminData?.display_name as string) ||
                    (adminData?.email as string) ||
                    "Admin"}
                </span>
                <button
                  onClick={handleLogout}
                  className="admin-header__icon-btn"
                  title="Logout"
                  style={{
                    marginLeft: "0.5rem",
                    padding: "0.5rem",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "var(--text-tertiary)",
                  }}>
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-container">
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="admin-sidebar__overlay"
              onClick={toggleMobileMenu}></div>
          )}
          {/* Left Sidebar */}
          <aside
            className={`admin-sidebar ${
              isMobileMenuOpen ? "admin-sidebar--open" : ""
            }`}>
            <button
              className="admin-sidebar__close-btn"
              onClick={toggleMobileMenu}
              aria-label="Close menu">
              <XCircle size={24} />
            </button>
            <nav
              className="admin-sidebar__nav"
              onClick={(e) => {
                // Close menu when clicking on links
                if ((e.target as HTMLElement).closest("a")) {
                  setIsMobileMenuOpen(false);
                }
              }}>
              {/* EXPLORE Section */}
              <div className="admin-sidebar__section">
                <div className="admin-sidebar-section-container">
                  <div className="admin-sidebar-section-container__title">
                    EXPLORE
                  </div>
                  <div className="admin-sidebar-section-container__list">
                    <a
                      href="#"
                      className={`admin-sidebar-section-container__item ${
                        activeView === "dashboard"
                          ? "admin-sidebar-section-container__item--active"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("dashboard");
                        setIsMobileMenuOpen(false);
                      }}>
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </a>
                    <a
                      href="#"
                      className={`admin-sidebar-section-container__item ${
                        activeView === "settings"
                          ? "admin-sidebar-section-container__item--active"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("settings");
                        setIsMobileMenuOpen(false);
                      }}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Users Section */}
              <div className="admin-sidebar__section">
                <div className="admin-sidebar-section-container">
                  <div
                    className="admin-sidebar-section-container__header"
                    onClick={() => toggleSection("users")}>
                    <div className="admin-sidebar-section-container__title">
                      Users
                      <AdminNavBadge
                        count={
                          attention.deactivatedAccounts +
                          attention.pendingApprovals
                        }
                      />
                    </div>
                    {expandedSections.users ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                  {expandedSections.users && (
                    <div className="admin-sidebar-section-container__list">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("users");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "users" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <UserCircle size={18} />
                        <span>Users</span>
                        <AdminNavBadge
                          count={
                            attention.deactivatedAccounts +
                            attention.pendingApprovals
                          }
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("memberships");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "memberships"
                            ? "admin-sidebar-section-container__item--active"
                            : ""
                        }`}>
                        <BadgeCheck size={18} />
                        <span>Memberships</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modules Container */}
              <div className="admin-sidebar__section">
                <div className="admin-modules-container">
                  <div className="admin-modules-container__title">Modules</div>
                  <div className="admin-modules-container__list">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("news");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`admin-modules-container__item ${
                        activeView === "news" ? "admin-modules-container__item--active" : ""
                      }`}>
                      <Newspaper size={18} />
                      <span>News</span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("posts");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`admin-modules-container__item ${
                        activeView === "posts" ? "admin-modules-container__item--active" : ""
                      }`}>
                      <Newspaper size={18} />
                      <span>Posts</span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("pages");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`admin-modules-container__item ${
                        activeView === "pages" ? "admin-modules-container__item--active" : ""
                      }`}>
                      <Flag size={18} />
                      <span>Pages</span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("groups");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`admin-modules-container__item ${
                        activeView === "groups" ? "admin-modules-container__item--active" : ""
                      }`}>
                      <Users size={18} />
                      <span>Groups</span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("forums");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`admin-modules-container__item ${
                        activeView === "forums" ? "admin-modules-container__item--active" : ""
                      }`}>
                      <MessageSquare size={18} />
                      <span>Forums</span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView("events");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`admin-modules-container__item ${
                        activeView === "events" ? "admin-modules-container__item--active" : ""
                      }`}>
                      <Calendar size={18} />
                      <span>Events</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Money Section */}
              <div className="admin-sidebar__section">
                <div className="admin-sidebar-section-container">
                  <div
                    className="admin-sidebar-section-container__header"
                    onClick={() => toggleSection("money")}>
                    <div className="admin-sidebar-section-container__title">
                      Money
                    </div>
                    {expandedSections.money ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                  {expandedSections.money && (
                    <div className="admin-sidebar-section-container__list">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("ads");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "ads" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <BarChart3 size={18} />
                        <span>Ads</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("wallet");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "wallet" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <Wallet size={18} />
                        <span>Wallet</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("pro");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "pro" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <TrendingUp size={18} />
                        <span>Pro System</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("affiliates");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "affiliates" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <Users size={18} />
                        <span>Affiliates</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("points");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "points" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <Gift size={18} />
                        <span>Points System</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("market");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "market" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <ShoppingBag size={18} />
                        <span>Marketplace</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("funding");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "funding" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <DollarSign size={18} />
                        <span>Funding</span>
                        <AdminNavBadge
                          count={
                            attention.pendingFunding +
                            attention.pendingWithdrawals
                          }
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("monetization");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "monetization" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <TrendingUp size={18} />
                        <span>Monetization</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Developers Section */}
              <div className="admin-sidebar__section">
                <div className="admin-sidebar-section-container">
                  <div
                    className="admin-sidebar-section-container__header"
                    onClick={() => toggleSection("developers")}>
                    <div className="admin-sidebar-section-container__title">
                      Developers
                    </div>
                    {expandedSections.developers ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                  {expandedSections.developers && (
                    <div className="admin-sidebar-section-container__list">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("developers");
                          setIsMobileMenuOpen(false);
                          requestAnimationFrame(() => {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            document
                              .querySelector(".admin-main")
                              ?.scrollTo({ top: 0, behavior: "smooth" });
                          });
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "developers"
                            ? "admin-sidebar-section-container__item--active"
                            : ""
                        }`}>
                        <Code size={18} />
                        <span>Developers</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tools Section */}
              <div className="admin-sidebar__section">
                <div className="admin-sidebar-section-container">
                  <div
                    className="admin-sidebar-section-container__header"
                    onClick={() => toggleSection("tools")}>
                    <div className="admin-sidebar-section-container__title">
                      Tools
                    </div>
                    {expandedSections.tools ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                  {expandedSections.tools && (
                    <div className="admin-sidebar-section-container__list">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("reports");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "reports" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <BarChart3 size={18} />
                        <span>Reports</span>
                        <AdminNavBadge count={attention.pendingReports} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("feedback");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "feedback" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <MessageSquare size={18} />
                        <span>Feedback</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("faqs");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "faqs" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <HelpCircle size={18} />
                        <span>Common questions</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView("verification");
                          setIsMobileMenuOpen(false);
                        }}
                        className={`admin-sidebar-section-container__item ${
                          activeView === "verification" ? "admin-sidebar-section-container__item--active" : ""
                        }`}>
                        <CheckCircle size={18} />
                        <span>Verification</span>
                        <AdminNavBadge count={attention.pendingVerifications} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reach Section */}
              <div className="admin-sidebar__section">
                <div className="admin-sidebar-section-container">
                  <div className="admin-sidebar-section-container__title">
                    Reach
                  </div>
                  <div className="admin-sidebar-section-container__list">
                    <button
                      type="button"
                      className={`admin-sidebar-section-container__item ${
                        activeView === "notifications" ? "admin-sidebar-section-container__item--active" : ""
                      }`}
                      onClick={() => {
                        setActiveView("notifications");
                        setIsMobileMenuOpen(false);
                      }}>
                      <Megaphone size={18} />
                      <span>Announcements</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Apps Section */}
              <div className="admin-sidebar__section">
                <div className="admin-sidebar-section-container">
                  <div className="admin-sidebar-section-container__title">
                    Apps
                  </div>
                  <div className="admin-sidebar-section-container__list">
                    <a
                      href="#"
                      className="admin-sidebar-section-container__item"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsControlPanelOpen(true);
                      }}>
                      <Zap size={18} />
                      <span>PWA</span>
                    </a>
                  </div>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <footer className="admin-sidebar__footer">
              <p>© 2025 JOSCity</p>
              <div className="admin-sidebar__footer-links">
                <a href="#about">About</a>
                <a href="#terms">Terms</a>
                <a href="#privacy">Privacy</a>
                <a href="#contact">Contact Us</a>
              </div>
            </footer>
          </aside>

          {/* Main Content Area */}
          <main className="admin-main">
            {/* Loading state */}
            {isLoading && (
              <div className="admin-loading" style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                gap: "1rem",
                padding: "2rem"
              }}>
                <div className="spinner" style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid var(--border-color)",
                  borderTop: "4px solid var(--color-primary)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                <p style={{ fontSize: "1.1rem", color: "var(--text-tertiary)" }}>Loading dashboard data...</p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="admin-error" style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                gap: "1rem",
                padding: "2rem"
              }}>
                <h2 style={{ fontSize: "1.5rem", color: "#d32f2f", margin: 0 }}>Error Loading Dashboard</h2>
                <p style={{ fontSize: "1rem", color: "var(--text-tertiary)", textAlign: "center" }}>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Dashboard content - only show when not loading and no error */}
            {!isLoading && !error && (
              <>
            {activeView === "settings" ? (
              <AdminSettings />
            ) : activeView === "users" ? (
              <AdminUsers counts={attention} />
            ) : activeView === "posts" ? (
              <AdminPosts />
            ) : activeView === "pages" ? (
              <AdminPages />
            ) : activeView === "groups" ? (
              <AdminGroups />
            ) : activeView === "forums" ? (
              <AdminForums />
            ) : activeView === "events" ? (
              <AdminEvents />
            ) : activeView === "reports" ? (
              <AdminReports />
            ) : activeView === "feedback" ? (
              <AdminFeedback />
            ) : activeView === "faqs" ? (
              <AdminFaqs />
            ) : activeView === "verification" ? (
              <AdminVerification />
            ) : activeView === "wallet" ? (
              <AdminWallet />
            ) : activeView === "ads" ? (
              <AdminAds />
            ) : activeView === "pro" ? (
              <AdminPro />
            ) : activeView === "affiliates" ? (
              <AdminAffiliates />
            ) : activeView === "points" ? (
              <AdminPoints />
            ) : activeView === "market" ? (
              <AdminMarket />
            ) : activeView === "funding" ? (
              <AdminFunding counts={attention} />
            ) : activeView === "monetization" ? (
              <AdminMonetization />
            ) : activeView === "notifications" ? (
              <AdminNotifications />
            ) : activeView === "news" ? (
              <AdminNews />
            ) : activeView === "developers" ? (
              <AdminDevelopers />
            ) : activeView === "memberships" ? (
              <AdminMembershipList />
            ) : (
              <div className="admin-dashboard">
                <div className="admin-dashboard__search">
                  <Search size={18} />
                  <input type="text" placeholder="Search" />
                </div>
                <div className="admin-dashboard__header">
                  <h1>
                    <LayoutDashboard size={20} />
                    Dashboard
                  </h1>
                </div>

                {/* Chart */}
                <div className="admin-chart">
                  <div className="admin-chart__title">Monthly Average</div>
                  <button className="admin-chart__menu-btn">
                    <Menu size={16} />
                  </button>
                  <div className="admin-chart__container">
                    <div className="admin-chart__y-axis">
                      {[0, 20, 40, 60, 80, 100].map((value) => (
                        <div key={value} className="admin-chart__y-label">
                          {value}
                        </div>
                      ))}
                    </div>
                    <div className="admin-chart__total-label">Total</div>
                    <div className="admin-chart__bars-container">
                      {/* Grid lines */}
                      {[20, 40, 60, 80, 100].map((value) => {
                        const position = ((100 - value) / 100) * 100;
                        return (
                          <div
                            key={value}
                            className="admin-chart__grid-line"
                            style={{ top: `${position}%` }}></div>
                        );
                      })}
                      <div className="admin-chart__bars">
                        {chartData.map((data: { month: string; users?: number; posts?: number; pages?: number; groups?: number; events?: number }, index: number) => (
                          <div key={index} className="admin-chart__bar-group">
                            <div className="admin-chart__bar-wrapper">
                              {(data.users ?? 0) > 0 && (
                                <div
                                  className="admin-chart__bar admin-chart__bar--users"
                                  style={{
                                    height: `${getBarHeight(data.users ?? 0)}px`,
                                  }}></div>
                              )}
                              {(data.posts ?? 0) > 0 && (
                                <div
                                  className="admin-chart__bar admin-chart__bar--posts"
                                  style={{
                                    height: `${getBarHeight(data.posts ?? 0)}px`,
                                  }}></div>
                              )}
                              {(data.pages ?? 0) > 0 && (
                                <div
                                  className="admin-chart__bar admin-chart__bar--pages"
                                  style={{
                                    height: `${getBarHeight(data.pages ?? 0)}px`,
                                  }}></div>
                              )}
                              {(data.groups ?? 0) > 0 && (
                                <div
                                  className="admin-chart__bar admin-chart__bar--groups"
                                  style={{
                                    height: `${getBarHeight(data.groups ?? 0)}px`,
                                  }}></div>
                              )}
                              {(data.events ?? 0) > 0 && (
                                <div
                                  className="admin-chart__bar admin-chart__bar--events"
                                  style={{
                                    height: `${getBarHeight(data.events ?? 0)}px`,
                                  }}></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="admin-chart__underline"></div>
                      <div className="admin-chart__x-labels">
                        {chartData.map((data: { month: string; users?: number; posts?: number; pages?: number; groups?: number; events?: number }, index: number) => (
                          <div key={index} className="admin-chart__x-label">
                            {data.month}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="admin-chart__legend">
                    <div className="admin-chart__legend-item">
                      <span className="admin-chart__legend-dot admin-chart__legend-dot--users"></span>
                      <span>Users</span>
                    </div>
                    <div className="admin-chart__legend-item">
                      <span className="admin-chart__legend-dot admin-chart__legend-dot--pages"></span>
                      <span>Pages</span>
                    </div>
                    <div className="admin-chart__legend-item">
                      <span className="admin-chart__legend-dot admin-chart__legend-dot--groups"></span>
                      <span>Groups</span>
                    </div>
                    <div className="admin-chart__legend-item">
                      <span className="admin-chart__legend-dot admin-chart__legend-dot--events"></span>
                      <span>Events</span>
                    </div>
                    <div className="admin-chart__legend-item">
                      <span className="admin-chart__legend-dot admin-chart__legend-dot--posts"></span>
                      <span>Posts</span>
                    </div>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="admin-stats">
                  {/* Row 1 - Users (2 columns) */}
                  <div className="admin-stat-card admin-stat-card--green admin-stat-card--span-3">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalUsers ?? 0}</div>
                    <div className="admin-stat-card__label">Users</div>
                    <div className="admin-stat-card__action">Manage Users</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card--blue admin-stat-card--span-3">
                    <div className="admin-stat-card__number">
                      {dashboardData?.insights?.onlineUsers ?? 0}
                    </div>
                    <div className="admin-stat-card__label">Online</div>
                    <div className="admin-stat-card__action">Manage Online</div>
                  </div>
                  {/* Row 2 - User Status (3 columns) */}
                  <div className="admin-stat-card admin-stat-card--yellow admin-stat-card--span-2">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.pendingApprovals ?? 0}</div>
                    <div className="admin-stat-card__label">Pending</div>
                    <div className="admin-stat-card__action">
                      Manage Pending
                    </div>
                  </div>
                  <div className="admin-stat-card admin-stat-card--orange admin-stat-card--span-2">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.notActivated ?? 0}</div>
                    <div className="admin-stat-card__label">Not Activated</div>
                    <div className="admin-stat-card__action">
                      Manage Not Activated
                    </div>
                  </div>
                  <div className="admin-stat-card admin-stat-card--red admin-stat-card--span-2">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.bannedUsers ?? 0}</div>
                    <div className="admin-stat-card__label">Banned</div>
                    <div className="admin-stat-card__action">Manage Banned</div>
                  </div>
                  {/* Row 3 - Posts & Comments (2 columns) */}
                  <div className="admin-stat-card admin-stat-card--teal admin-stat-card--span-3">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalPosts ?? 0}</div>
                    <div className="admin-stat-card__label">Posts</div>
                    <div className="admin-stat-card__action">Manage Posts</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card--light-blue admin-stat-card--span-3">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalComments ?? 0}</div>
                    <div className="admin-stat-card__label">Comments</div>
                    <div className="admin-stat-card__action">
                      Manage Comments
                    </div>
                  </div>
                  {/* Row 4 - Modules (3 columns) */}
                  <div className="admin-stat-card admin-stat-card--purple admin-stat-card--span-2">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalPages ?? 0}</div>
                    <div className="admin-stat-card__label">Page</div>
                    <div className="admin-stat-card__action">Manage Page</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card--purple admin-stat-card--span-2">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalGroups ?? 0}</div>
                    <div className="admin-stat-card__label">Group</div>
                    <div className="admin-stat-card__action">Manage Groups</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card--purple admin-stat-card--span-2">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalEvents ?? 0}</div>
                    <div className="admin-stat-card__label">Events</div>
                    <div className="admin-stat-card__action">Manage Events</div>
                  </div>
                  {/* Row 5 - Messages & Notifications (2 columns) */}
                  <div className="admin-stat-card admin-stat-card--blue admin-stat-card--span-3">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalMessages ?? 0}</div>
                    <div className="admin-stat-card__label">Messages</div>
                    <div className="admin-stat-card__action">Manage Messages</div>
                  </div>
                  <div className="admin-stat-card admin-stat-card--teal admin-stat-card--span-3">
                    <div className="admin-stat-card__number">{dashboardData?.insights?.totalNotifications ?? 0}</div>
                    <div className="admin-stat-card__label">Notifications</div>
                    <div className="admin-stat-card__action">Manage Notifications</div>
                  </div>
                </div>
              </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* Pages Control Panel */}
        {isControlPanelOpen && (
          <PagesControlPanel onClose={() => setIsControlPanelOpen(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Admin;