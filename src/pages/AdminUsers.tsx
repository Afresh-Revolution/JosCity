import React, { useState, useEffect } from "react";
import {
  Search,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
} from "lucide-react";
import {
  getUsers,
  approveAccount,
  rejectAccount,
  banUser,
  unbanUser,
  verifyUser,
  deleteUser,
  type User,
  type UsersResponse,
} from "../services/adminApi";
import { decrementRegisteredCitizensCount } from "../utils/citizenCountUtils";
import "../main.css";
import "../scss/_admin.scss";

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: UsersResponse = await getUsers({
        page,
        limit: 20,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      });
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load users:", err);
      // Don't set error if it's just an empty result
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.user_email?.toLowerCase().includes(query) ||
            user.user_firstname?.toLowerCase().includes(query) ||
            user.user_lastname?.toLowerCase().includes(query) ||
            user.user_phone?.includes(query) ||
            user.business_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  // Handle approve with email (like Settings)
  const handleApprove = async (user_id: string) => {
    try {
      setProcessing(user_id);
      setError(null);
      setSuccess(null);

      // Call the admin API function that sends approval email
      const result = await approveAccount(user_id);

      if (result.success) {
        console.log("successful approval", result.message);
        setSuccess(result.message || "User approved successfully");
        await loadUsers();
      } else {
        setError(result.message || "Failed to approve user");
      }
    } catch (err) {
      console.error("Error approving user:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve user"
      );
    } finally {
      setProcessing(null);
    }
  };

  // Handle reject with email (like Settings)
  const handleReject = async (user_id: string) => {
    try {
      setProcessing(user_id);
      setError(null);
      setSuccess(null);

      // Call the reject API function that sends rejection email
      const result = await rejectAccount(user_id);

      if (result.success) {
        console.log("successful rejection", result.message);
        setSuccess(result.message || "User rejected successfully");
        await loadUsers();
      } else {
        setError(result.message || "Failed to reject user");
      }
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError(err instanceof Error ? err.message : "Failed to reject user");
    } finally {
      setProcessing(null);
    }
  };

  // Handle other actions (ban, unban, verify, delete)
  const handleAction = async (
    userId: string,
    action: string,
    actionFn: (id: string, ...args: any[]) => Promise<any>,
    ...args: any[]
  ) => {
    // Special handling for delete action - require confirmation
    if (action === "delete") {
      const user = users.find(u => u.user_id === userId);
      const userName = user 
        ? `${user.user_firstname} ${user.user_lastname}`.trim() || user.user_email || `User ID: ${userId}`
        : `User ID: ${userId}`;
      
      const confirmed = window.confirm(
        `⚠️ WARNING: This will permanently delete ${userName} and ALL their data from the database and website.\n\n` +
        `This includes:\n` +
        `• All posts, comments, and reactions\n` +
        `• All friends, followers, and messages\n` +
        `• All groups, pages, and events they created\n` +
        `• All payment and transaction history\n` +
        `• All other user-related data\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Are you absolutely sure you want to delete this user?`
      );
      
      if (!confirmed) {
        return;
      }
    }

    try {
      setProcessing(userId);
      setError(null);
      setSuccess(null);
      const result = await actionFn(userId, ...args);
      
      // Check if the result indicates success
      if (result && (result.success === false || result.error)) {
        throw new Error(result.message || result.error || `Failed to ${action} user`);
      }
      
      // Handle decrementing registered citizens count for delete action
      if (action === "delete" && result?.success) {
        // Only decrement if user was approved (only approved users are counted)
        if (result.was_approved || result.account_status === "approved" || result.user_approved === "1" || result.user_approved === 1) {
          decrementRegisteredCitizensCount();
          // Dispatch event to update count in other components
          window.dispatchEvent(new Event("citizenCountUpdated"));
        }
      }
      
      setSuccess(result?.message || `User ${action}d successfully`);
      await loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (typeof err === 'object' && err !== null && 'message' in err)
          ? String(err.message)
          : `Failed to ${action} user`;
      setError(errorMessage);
      console.error(`Error ${action}ing user:`, err);
    } finally {
      setProcessing(null);
    }
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
          <Users size={20} />
          Users Management
        </h1>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search users by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-dashboard__filters">
        <button
          className={`admin-filter-btn ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => setStatusFilter("approved")}
        >
          Approved
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "banned" ? "active" : ""}`}
          onClick={() => setStatusFilter("banned")}
        >
          Banned
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "not_activated" ? "active" : ""}`}
          onClick={() => setStatusFilter("not_activated")}
        >
          Not Activated
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "rejected" ? "active" : ""}`}
          onClick={() => setStatusFilter("rejected")}
        >
          Rejected
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
          <span>Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Users size={48} />
          <p>
            {statusFilter === "rejected" 
              ? "No rejected users yet" 
              : statusFilter !== "all"
              ? `No ${statusFilter.replace("_", " ")} users yet`
              : "No users yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="admin-users-grid">
            {filteredUsers.map((user) => (
              <div key={user.user_id} className="admin-user-card">
                <div className="admin-user-card__header">
                  <div className="admin-user-card__avatar">
                    {user.user_picture ? (
                      <img src={user.user_picture} alt={user.user_firstname} />
                    ) : (
                      <UserIcon size={24} />
                    )}
                  </div>
                  <div className="admin-user-card__info">
                    <h3>
                      {user.user_firstname} {user.user_lastname}
                      {user.business_name && ` (${user.business_name})`}
                    </h3>
                    <div className="admin-user-card__badges">
                      {user.user_verified && (
                        <span className="badge badge--verified">
                          <Shield size={12} /> Verified
                        </span>
                      )}
                      {user.user_banned && (
                        <span className="badge badge--banned">
                          <Ban size={12} /> Banned
                        </span>
                      )}
                      {user.account_status === "rejected" && (
                        <span className="badge badge--rejected">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                      {!user.user_activated && (
                        <span className="badge badge--inactive">Not Activated</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-user-card__details">
                  <div className="admin-user-card__detail-item">
                    <Mail size={16} />
                    <span>{user.user_email || user.business_email}</span>
                  </div>
                  {user.user_phone && (
                    <div className="admin-user-card__detail-item">
                      <Phone size={16} />
                      <span>{user.user_phone}</span>
                    </div>
                  )}
                  <div className="admin-user-card__detail-item">
                    <span>Joined: {formatDate(user.user_registered)}</span>
                  </div>
                </div>

                <div className="admin-user-card__actions">
                  {user.account_status === "rejected" && (
                    <button
                      onClick={() => handleApprove(user.user_id)}
                      disabled={processing === user.user_id}
                      className="admin-action-btn admin-action-btn--approve"
                      title="Approve this rejected user"
                    >
                      {processing === user.user_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                  )}
                  {!user.user_approved && user.account_status !== "rejected" && (
                    <button
                      onClick={() => handleApprove(user.user_id)}
                      disabled={processing === user.user_id}
                      className="admin-action-btn admin-action-btn--approve"
                    >
                      {processing === user.user_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                  )}
                  {(!user.user_approved || user.account_status === "pending") && user.account_status !== "rejected" && (
                    <button
                      onClick={() => handleReject(user.user_id)}
                      disabled={processing === user.user_id}
                      className="admin-action-btn admin-action-btn--reject"
                    >
                      {processing === user.user_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>
                  )}
                  {!user.user_verified && (
                    <button
                      onClick={() => handleAction(user.user_id, "verify", verifyUser)}
                      disabled={processing === user.user_id}
                      className="admin-action-btn admin-action-btn--verify"
                    >
                      {processing === user.user_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <UserCheck size={16} />
                      )}
                      Verify
                    </button>
                  )}
                  {!user.user_banned ? (
                    <button
                      onClick={() => {
                        const reason = window.prompt("Enter reason for ban (optional):");
                        handleAction(user.user_id, "ban", banUser, reason || undefined);
                      }}
                      disabled={processing === user.user_id}
                      className="admin-action-btn admin-action-btn--ban"
                      title="Ban this user account"
                    >
                      {processing === user.user_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <Ban size={16} />
                      )}
                      Ban
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const currentUser = users.find(u => u.user_id === user.user_id);
                        const userName = currentUser 
                          ? `${currentUser.user_firstname} ${currentUser.user_lastname}`.trim() || currentUser.user_email || `User ID: ${currentUser.user_id}`
                          : `User ID: ${user.user_id}`;
                        
                        const confirmed = window.confirm(
                          `Are you sure you want to unban ${userName}?\n\n` +
                          `This will:\n` +
                          `• Remove the ban status\n` +
                          `• Re-enable the account\n` +
                          `• Allow the user to access the platform again`
                        );
                        
                        if (confirmed) {
                          handleAction(user.user_id, "unban", unbanUser);
                        }
                      }}
                      disabled={processing === user.user_id}
                      className="admin-action-btn admin-action-btn--unban"
                      title="Unban this user account and re-enable access"
                    >
                      {processing === user.user_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Unban
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(user.user_id, "delete", deleteUser)}
                    disabled={processing === user.user_id}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === user.user_id ? (
                      <Loader2 size={16} className="spinner" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-pagination__btn"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="admin-pagination__btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;

