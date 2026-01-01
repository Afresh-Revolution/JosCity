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
  Mail,
  Award,
  Clock,
  ThumbsUp,
  MessageCircle,
  FileText,
  Sparkles,
  Eye,
} from "lucide-react";
import {
  getUserPointsBalances,
  type UserPointsBalance,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminPoints: React.FC = () => {
  const [users, setUsers] = useState<UserPointsBalance[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserPointsBalance[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserPointsBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="admin-wallet-grid">
          {filteredUsers.map((user) => (
            <div key={user.user_id} className="admin-wallet-card">
              <div className="admin-wallet-card__header">
                <div className="admin-wallet-card__user-info">
                  {user.user_picture ? (
                    <img
                      src={user.user_picture}
                      alt={user.user_firstname}
                      className="admin-wallet-card__avatar"
                    />
                  ) : (
                    <div className="admin-wallet-card__avatar admin-wallet-card__avatar--default">
                      <User size={20} />
                    </div>
                  )}
                  <div className="admin-wallet-card__user-details">
                    <div className="admin-wallet-card__user-name">
                      {user.user_firstname} {user.user_lastname}
                    </div>
                    <div className="admin-wallet-card__user-id">ID: {user.user_id}</div>
                  </div>
                </div>
                <div className="admin-wallet-card__amounts">
                  <div className="admin-wallet-card__amount-primary">
                    {formatCBC(user.total_cbc)} <span className="admin-wallet-card__currency">CBC</span>
                  </div>
                  <div className="admin-wallet-card__amount-secondary">
                    {formatPoints(user.total_points)} points
                  </div>
                  <div className="admin-wallet-card__amount-tertiary">
                    ≈ {formatCurrency(user.total_usd)}
                  </div>
                </div>
              </div>

              <div className="admin-wallet-card__details">
                <div className="admin-wallet-card__detail-item">
                  <TrendingUp size={16} />
                  <span>
                    From Activities: {formatPoints(user.earned_from_activities)} pts ({formatCBC(user.earned_from_activities / 100)} CBC)
                  </span>
                </div>
                {user.earned_from_redemptions > 0 && (
                  <div className="admin-wallet-card__detail-item">
                    <Gift size={16} />
                    <span>
                      From Redemptions: {formatPoints(user.earned_from_redemptions)} pts ({formatCBC(user.earned_from_redemptions / 100)} CBC)
                    </span>
                  </div>
                )}
                {user.user_email && (
                  <div className="admin-wallet-card__detail-item">
                    <Mail size={16} />
                    <span>{user.user_email}</span>
                  </div>
                )}
                <div className="admin-wallet-card__status">
                  <span className={`badge badge--${user.user_approved ? "approved" : "pending"}`}>
                    {user.user_approved ? (
                      <>
                        <CheckCircle size={12} />
                        Approved
                      </>
                    ) : (
                      <>
                        <Clock size={12} />
                        Pending
                      </>
                    )}
                  </span>
                  {user.user_verified && (
                    <span className="badge badge--verified">
                      <CheckCircle size={12} />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="admin-wallet-card__earnings">
                <div className="admin-wallet-card__earnings-title">
                  <Award size={16} />
                  Earnings Breakdown
                </div>
                <div className="admin-wallet-card__earnings-grid">
                  <div className="admin-wallet-card__earnings-item">
                    <FileText size={14} />
                    <span className="earnings-label">Posts</span>
                    <span className="earnings-value">
                      {user.earnings_breakdown.posts.count} × {user.earnings_breakdown.posts.points}pts
                    </span>
                    <span className="earnings-cbc">{formatCBC(user.earnings_breakdown.posts.cbc)} CBC</span>
                  </div>
                  <div className="admin-wallet-card__earnings-item">
                    <ThumbsUp size={14} />
                    <span className="earnings-label">Likes</span>
                    <span className="earnings-value">
                      {user.earnings_breakdown.likes.count} × {user.earnings_breakdown.likes.points}pts
                    </span>
                    <span className="earnings-cbc">{formatCBC(user.earnings_breakdown.likes.cbc)} CBC</span>
                  </div>
                  <div className="admin-wallet-card__earnings-item">
                    <MessageCircle size={14} />
                    <span className="earnings-label">Comments</span>
                    <span className="earnings-value">
                      {user.earnings_breakdown.comments.count} × {user.earnings_breakdown.comments.points}pts
                    </span>
                    <span className="earnings-cbc">{formatCBC(user.earnings_breakdown.comments.cbc)} CBC</span>
                  </div>
                  {user.earnings_breakdown.recent_activity_bonus.points > 0 && (
                    <div className="admin-wallet-card__earnings-item">
                      <Sparkles size={14} />
                      <span className="earnings-label">Activity Bonus</span>
                      <span className="earnings-value">
                        {user.earnings_breakdown.recent_activity_bonus.count} × {user.earnings_breakdown.recent_activity_bonus.points}pts
                      </span>
                      <span className="earnings-cbc">{formatCBC(user.earnings_breakdown.recent_activity_bonus.cbc)} CBC</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-wallet-card__actions">
                <button
                  onClick={() => setSelectedUser(user)}
                  className="admin-action-btn admin-action-btn--view"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Points Details - {selectedUser.user_firstname} {selectedUser.user_lastname}</h2>
              <button onClick={() => setSelectedUser(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="admin-modal__content">
              <div className="admin-modal__section">
                <h3>Balance Summary</h3>
                <div className="admin-modal__balance-grid">
                  <div>
                    <label>Earned from Activities</label>
                    <div className="balance-value">{formatPoints(selectedUser.earned_from_activities)} points</div>
                    <div className="balance-subvalue">{formatCBC(selectedUser.earned_from_activities / 100)} CBC</div>
                  </div>
                  {selectedUser.earned_from_redemptions > 0 && (
                    <div>
                      <label>Earned from Redemptions</label>
                      <div className="balance-value">{formatPoints(selectedUser.earned_from_redemptions)} points</div>
                      <div className="balance-subvalue">{formatCBC(selectedUser.earned_from_redemptions / 100)} CBC</div>
                    </div>
                  )}
                  <div>
                    <label>Total Balance</label>
                    <div className="balance-value balance-value--highlight">{formatCBC(selectedUser.total_cbc)} CBC</div>
                    <div className="balance-subvalue">{formatPoints(selectedUser.total_points)} points</div>
                  </div>
                </div>
              </div>
              <div className="admin-modal__section">
                <h3>Earnings Breakdown</h3>
                <div className="admin-modal__earnings-list">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPoints;
