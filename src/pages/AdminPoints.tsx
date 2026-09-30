import React, { useState, useEffect } from "react";
import {
  Gift,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Coins,
  Search,
  Filter,
  TrendingUp,
  User,
  Award,
  Clock,
  ThumbsUp,
  MessageCircle,
  FileText,
  Sparkles,
  Eye,
} from "lucide-react";
import {
  getPointsStats,
  getUserPointsBalances,
  updatePointsRates,
  type PointsStats,
  type UserPointsBalance,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const DEFAULT_RATES: PointsStats["earning_rates"] = {
  posts: 15,
  likes: 2,
  comments: 5,
  shares: 10,
  stories: 5,
  events: 25,
  service_requests: 10,
  referrals: 50,
  profile_completion: 20,
  check_ins: 5,
  reviews: 15,
};

const RATE_FIELDS: Array<[keyof PointsStats["earning_rates"], string]> = [
  ["posts", "Points per post"],
  ["likes", "Points per like"],
  ["comments", "Points per comment"],
  ["shares", "Points per share"],
  ["stories", "Points per story"],
  ["events", "Points per event"],
  ["service_requests", "Points per service request"],
  ["referrals", "Points per referral"],
  ["profile_completion", "Points for completing a profile"],
  ["check_ins", "Points per check-in"],
  ["reviews", "Points per review"],
];

const AdminPoints: React.FC = () => {
  const [users, setUsers] = useState<UserPointsBalance[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserPointsBalance[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserPointsBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [pointsPerCbc, setPointsPerCbc] = useState("100");
  const [cbcUsd, setCbcUsd] = useState("8.231");
  const [savingRates, setSavingRates] = useState(false);
  const [ratesMessage, setRatesMessage] = useState<string | null>(null);
  const [ratesFailed, setRatesFailed] = useState(false);

  useEffect(() => {
    void getPointsStats()
      .then((response) => {
        const stats = response.data;
        if (!stats) return;
        if (stats.earning_rates) setRates({ ...DEFAULT_RATES, ...stats.earning_rates });
        if (stats.conversion_rate) setPointsPerCbc(String(stats.conversion_rate));
        if (stats.cbc_to_usd_rate) setCbcUsd(String(stats.cbc_to_usd_rate));
        setRatesFailed(false);
      })
      .catch(() => {
        setRatesFailed(true);
        setRatesMessage("Could not load the point rules from the server.");
      });
  }, []);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, searchQuery ? 500 : 0); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserPointsBalances(
        statusFilter === "all" ? undefined : statusFilter as any,
        searchQuery.trim() || undefined
      );
      const data = response.data || [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Failed to load user points:", err);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCBC = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("en-US").format(points);
  };

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalPoints: users.reduce((sum, u) => sum + u.total_points, 0),
    totalCBC: users.reduce((sum, u) => sum + u.total_cbc, 0),
    totalUSD: users.reduce((sum, u) => sum + u.total_usd, 0),
    approvedUsers: users.filter((u) => u.user_approved).length,
    totalEarned: users.reduce((sum, u) => sum + u.earned_from_activities, 0),
    totalEarnedFromRedemptions: users.reduce((sum, u) => sum + u.earned_from_redemptions, 0),
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Gift size={20} />
          User Points & Earnings
        </h1>
        <p style={{ fontSize: '14px', color: '#718096', marginTop: '8px', fontWeight: 'normal' }}>
          Regular users earn points through activities (posts, likes, comments). Admins are excluded from the points system.
        </p>
      </div>

      <form
        className="admin-panel-card admin-points-rates"
        onSubmit={(event) => {
          event.preventDefault();
          const conversion = Number(pointsPerCbc);
          const usd = Number(cbcUsd);
          if (!Number.isFinite(conversion) || conversion <= 0 || !Number.isFinite(usd) || usd <= 0) {
            setRatesFailed(true);
            setRatesMessage("Enter a points-per-CBC value and a CBC price greater than zero.");
            return;
          }
          setSavingRates(true);
          setRatesMessage(null);
          setRatesFailed(false);
          void updatePointsRates({
            conversion_rate: conversion,
            cbc_to_usd_rate: usd,
            earning_rates: rates,
          })
            .then((result) => {
              const saved = result.data;
              if (saved?.earning_rates) setRates({ ...DEFAULT_RATES, ...saved.earning_rates });
              if (saved?.conversion_rate) setPointsPerCbc(String(saved.conversion_rate));
              if (saved?.cbc_to_usd_rate) setCbcUsd(String(saved.cbc_to_usd_rate));
              setRatesFailed(false);
              setRatesMessage(result.message || "Point calculation saved.");
            })
            .catch((err) => {
              setRatesFailed(true);
              setRatesMessage(err instanceof Error ? err.message : "Could not save the point calculation.");
            })
            .finally(() => setSavingRates(false));
        }}
      >
        <h2>Point calculation</h2>
        <p>Set how many points each action earns, and how those points convert to CBC.</p>
        {ratesMessage ? (
          <p className={`admin-points-rates__notice${ratesFailed ? " admin-points-rates__notice--error" : ""}`}>
            {ratesMessage}
          </p>
        ) : null}
        <div className="admin-points-rates__grid">
          {RATE_FIELDS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                className="admin-panel-input"
                type="number"
                min="0"
                step="1"
                value={rates[key]}
                onChange={(event) =>
                  setRates((current) => ({ ...current, [key]: Number(event.target.value) }))
                }
              />
            </label>
          ))}
          <label>
            Points per 1 CBC
            <input
              className="admin-panel-input"
              type="number"
              min="1"
              step="1"
              value={pointsPerCbc}
              onChange={(event) => setPointsPerCbc(event.target.value)}
            />
          </label>
          <label>
            USD value of 1 CBC
            <input
              className="admin-panel-input"
              type="number"
              min="0"
              step="0.001"
              value={cbcUsd}
              onChange={(event) => setCbcUsd(event.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="admin-panel-button admin-panel-button--primary" disabled={savingRates}>
          {savingRates ? "Saving…" : "Save calculation"}
        </button>
      </form>

      {/* Statistics Cards */}
      <div className="admin-wallet-stats">
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--pending">
            <User size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">{stats.totalUsers}</div>
            <div className="admin-wallet-stat-card__label">Total Users</div>
            <div className="admin-wallet-stat-card__subvalue">
              {stats.approvedUsers} approved
            </div>
          </div>
        </div>
        <div className="admin-wallet-stat-card admin-wallet-stat-card--highlight">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--cbc">
            <Coins size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">
              {formatCBC(stats.totalCBC)} <span className="admin-wallet-stat-card__currency">CBC</span>
            </div>
            <div className="admin-wallet-stat-card__label">Total Points (CBC)</div>
            <div className="admin-wallet-stat-card__subvalue">
              {formatCurrency(stats.totalUSD)} USD
            </div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--approved">
            <Award size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">
              {formatPoints(stats.totalEarnedFromRedemptions)} <span className="admin-wallet-stat-card__currency">pts</span>
            </div>
            <div className="admin-wallet-stat-card__label">From Redemptions</div>
            <div className="admin-wallet-stat-card__subvalue">
              {formatCBC(stats.totalEarnedFromRedemptions / 100)} CBC
            </div>
          </div>
        </div>
        <div className="admin-wallet-stat-card">
          <div className="admin-wallet-stat-card__icon admin-wallet-stat-card__icon--amount">
            <TrendingUp size={24} />
          </div>
          <div className="admin-wallet-stat-card__content">
            <div className="admin-wallet-stat-card__value">
              {formatPoints(stats.totalEarned)} <span className="admin-wallet-stat-card__currency">pts</span>
            </div>
            <div className="admin-wallet-stat-card__label">Earned from Activities</div>
            <div className="admin-wallet-stat-card__subvalue">
              {formatCBC(stats.totalEarned / 100)} CBC
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by user name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-dashboard__filters">
        <button
          className={`admin-filter-btn ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <Filter size={14} />
          All Users
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => setStatusFilter("approved")}
        >
          Approved Only
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

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading user points...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Gift size={48} />
          <p>No users found{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}</p>
        </div>
      ) : (
        <div className="admin-points-list">
          {[...filteredUsers]
            .sort((a, b) => b.total_points - a.total_points)
            .map((user) => (
            <article
              key={user.user_id}
              className="admin-points-card"
              onClick={() => setSelectedUser(user)}
            >
              <div className="admin-points-card__identity">
                {user.user_picture ? (
                  <img src={user.user_picture} alt="" className="admin-points-card__avatar" />
                ) : (
                  <span className="admin-points-card__avatar" aria-hidden="true">
                    <User size={18} />
                  </span>
                )}
                <strong>
                  {user.user_firstname} {user.user_lastname}
                </strong>
              </div>
              <div className="admin-points-card__balance">
                <strong>
                  {formatCBC(user.total_cbc)} <span>CBC</span>
                </strong>
                <span>
                  {formatPoints(user.total_points)} points · {formatCurrency(user.total_usd)}
                </span>
              </div>
              <button
                type="button"
                className="admin-points-card__open"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedUser(user);
                }}
              >
                <Eye size={16} />
                View details
              </button>
            </article>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="admin-points-detail" onClick={() => setSelectedUser(null)} role="presentation">
          <div
            className="admin-points-detail__sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="points-detail-title"
          >
            <div className="admin-points-detail__header">
              <div>
                <h2 id="points-detail-title">
                  {selectedUser.user_firstname} {selectedUser.user_lastname}
                </h2>
                <p>ID {selectedUser.user_id}{selectedUser.user_email ? ` · ${selectedUser.user_email}` : ""}</p>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} aria-label="Close details">
                <XCircle size={20} />
              </button>
            </div>
            <div className="admin-points-detail__body">
              <div className="admin-points-detail__status">
                <span className={`badge badge--${selectedUser.user_approved ? "approved" : "pending"}`}>
                  {selectedUser.user_approved ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {selectedUser.user_approved ? "Approved" : "Pending"}
                </span>
                {selectedUser.user_verified ? (
                  <span className="badge badge--verified">
                    <CheckCircle size={12} />
                    Verified
                  </span>
                ) : null}
              </div>
              <section>
                <h3>Balance</h3>
                <div className="admin-points-detail__balances">
                  <div>
                    <label>Earned from Activities</label>
                    <div className="balance-value">{formatPoints(selectedUser.earned_from_activities)} points</div>
                    <div className="balance-subvalue">{formatCBC(selectedUser.earned_from_activities / (Number(pointsPerCbc) || 100))} CBC</div>
                  </div>
                  {selectedUser.earned_from_redemptions > 0 && (
                    <div>
                      <label>Earned from Redemptions</label>
                      <div className="balance-value">{formatPoints(selectedUser.earned_from_redemptions)} points</div>
                      <div className="balance-subvalue">{formatCBC(selectedUser.earned_from_redemptions / (Number(pointsPerCbc) || 100))} CBC</div>
                    </div>
                  )}
                  <div>
                    <label>Total Balance</label>
                    <div className="balance-value balance-value--highlight">{formatCBC(selectedUser.total_cbc)} CBC</div>
                    <div className="balance-subvalue">{formatPoints(selectedUser.total_points)} points</div>
                  </div>
                </div>
              </section>
              <section>
                <h3>Earnings breakdown</h3>
                <div className="admin-points-detail__earnings">
                  <div className="earnings-list-item">
                    <FileText size={18} />
                    <div>
                      <strong>Posts Created</strong>
                      <span>{selectedUser.earnings_breakdown.posts.count} posts × 15 pts = {selectedUser.earnings_breakdown.posts.points} pts</span>
                    </div>
                    <div className="earnings-cbc">{formatCBC(selectedUser.earnings_breakdown.posts.cbc)} CBC</div>
                  </div>
                  <div className="earnings-list-item">
                    <ThumbsUp size={18} />
                    <div>
                      <strong>Likes Received</strong>
                      <span>{selectedUser.earnings_breakdown.likes.count} likes × 2 pts = {selectedUser.earnings_breakdown.likes.points} pts</span>
                    </div>
                    <div className="earnings-cbc">{formatCBC(selectedUser.earnings_breakdown.likes.cbc)} CBC</div>
                  </div>
                  <div className="earnings-list-item">
                    <MessageCircle size={18} />
                    <div>
                      <strong>Comments Received</strong>
                      <span>{selectedUser.earnings_breakdown.comments.count} comments × 5 pts = {selectedUser.earnings_breakdown.comments.points} pts</span>
                    </div>
                    <div className="earnings-cbc">{formatCBC(selectedUser.earnings_breakdown.comments.cbc)} CBC</div>
                  </div>
                  {selectedUser.earnings_breakdown.recent_activity_bonus.points > 0 && (
                    <div className="earnings-list-item">
                      <Sparkles size={18} />
                      <div>
                        <strong>Recent Activity Bonus</strong>
                        <span>{selectedUser.earnings_breakdown.recent_activity_bonus.count} recent posts × 5 bonus pts = {selectedUser.earnings_breakdown.recent_activity_bonus.points} pts</span>
                      </div>
                      <div className="earnings-cbc">{formatCBC(selectedUser.earnings_breakdown.recent_activity_bonus.cbc)} CBC</div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPoints;
