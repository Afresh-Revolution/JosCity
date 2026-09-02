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
  activateUser,
  setUserBadgeColor,
  type User,
  type UsersResponse,
} from "../services/adminApi";
import ConfirmationModal from "../components/ConfirmationModal";
import AdminBadgeColorField, {
  PURPLE_BADGE,
} from "../components/AdminBadgeColorField";
import AdminNavBadge from "../components/AdminNavBadge";
import { fetchRegisteredCitizensCount } from "../utils/citizenCountUtils";
import "../main.css";
import "../scss/_admin.scss";

function accountStatusOf(user: User) {
  return String(user.account_status || "").toLowerCase();
}

const AdminUsers: React.FC<{
  counts?: {
    deactivatedAccounts?: number;
    pendingApprovals?: number;
  };
}> = ({ counts }) => {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    userId: string;
    action: string;
    userName: string;
    actionFn: (id: string, ...args: any[]) => Promise<any>;
    args: any[];
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter, debouncedSearch]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: UsersResponse = await getUsers({
        page,
        limit: 20,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        search: debouncedSearch || undefined,
      });
      const rows = Array.isArray(response?.data) ? response.data : [];
      setUsers(rows);
      setFilteredUsers(rows);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

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
    const user = users.find(u => u.user_id === userId);
    const userName = user 
      ? `${user.user_firstname} ${user.user_lastname}`.trim() || user.user_email || `User ID: ${userId}`
      : `User ID: ${userId}`;

    // Special handling for delete and ban actions - show confirmation modal
    if (action === "delete") {
      setPendingAction({ userId, action, userName, actionFn, args });
      setShowDeleteConfirm(true);
      return;
    }

    if (action === "ban") {
      setPendingAction({ userId, action, userName, actionFn, args });
      setShowBanConfirm(true);
      return;
    }

    if (action === "activate") {
      setPendingAction({ userId, action, userName, actionFn, args });
      setShowActivateConfirm(true);
      return;
    }

    // For other actions, proceed directly
    await executeAction(userId, action, actionFn, ...args);
  };

  const handleConfirmDelete = async () => {
    if (!pendingAction || pendingAction.action !== "delete") return;
    const { userId, action, actionFn, args } = pendingAction;
    await executeAction(userId, action, actionFn, ...(args || []));
    setShowDeleteConfirm(false);
    setPendingAction(null);
  };

  const handleConfirmBan = async () => {
    if (!pendingAction || pendingAction.action !== "ban") return;
    const { userId, action, actionFn, args } = pendingAction;
    await executeAction(userId, action, actionFn, ...(args || []));
    setShowBanConfirm(false);
    setPendingAction(null);
  };

  const handleConfirmActivate = async () => {
    if (!pendingAction || pendingAction.action !== "activate") return;
    const { userId, action, actionFn, args } = pendingAction;
    await executeAction(userId, action, actionFn, ...(args || []));
    setShowActivateConfirm(false);
    setPendingAction(null);
  };

  const executeAction = async (
    userId: string,
    action: string,
    actionFn: (id: string, ...args: any[]) => Promise<any>,
    ...args: any[]
  ) => {

    try {
      setProcessing(userId);
      setError(null);
      setSuccess(null);
      const result = await actionFn(userId, ...args);
      
      // Check if the result indicates success
      if (result && (result.success === false || result.error)) {
        throw new Error(result.message || result.error || `Failed to ${action} user`);
      }
      
      // Refresh count from API after delete action
      if (action === "delete" && result?.success) {
        // Only refresh if user was approved (only approved users are counted)
        if (result.was_approved || result.account_status === "approved" || result.user_approved === "1" || result.user_approved === 1) {
          await fetchRegisteredCitizensCount();
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
          placeholder="Search by name, email, or phone. Use Deactivated to restore paused accounts."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="admin-dashboard__filters">
        <button
          className={`admin-filter-btn ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => applyFilter("all")}
        >
          All
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "pending" ? "active" : ""}`}
          onClick={() => applyFilter("pending")}
        >
          Pending
          <AdminNavBadge count={counts?.pendingApprovals} />
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => applyFilter("approved")}
        >
          Approved
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "banned" ? "active" : ""}`}
          onClick={() => applyFilter("banned")}
        >
          Banned
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "not_activated" ? "active" : ""}`}
          onClick={() => applyFilter("not_activated")}
        >
          Not Activated
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "rejected" ? "active" : ""}`}
          onClick={() => applyFilter("rejected")}
        >
          Rejected
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "deactivated" ? "active" : ""}`}
          onClick={() => applyFilter("deactivated")}
        >
          Deactivated
          <AdminNavBadge count={counts?.deactivatedAccounts} />
        </button>
        <button
          className={`admin-filter-btn ${statusFilter === "deleted" ? "active" : ""}`}
          onClick={() => applyFilter("deleted")}
        >
          Deleted
        </button>
      </div>

      {statusFilter === "deactivated" && (
        <p className="admin-dashboard__filter-note">
          Members who paused their account appear here. Search their email, then
          Reactivate after they contact support.
        </p>
      )}

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
            {error
              ? "Could not load users."
              : statusFilter === "deactivated"
              ? "No deactivated accounts. Members who pause their account will show here so you can reactivate them."
              : statusFilter === "rejected"
              ? "No rejected users yet"
              : statusFilter !== "all"
              ? `No ${statusFilter.replace("_", " ")} users yet`
              : "No users yet"}
          </p>
          {error ? (
            <button
              type="button"
              className="admin-dashboard__retry"
              onClick={() => void loadUsers()}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="admin-users-grid">
            {filteredUsers.map((user) => {
              const isDeleted = accountStatusOf(user) === "deleted";
              const isDeactivated = accountStatusOf(user) === "deactivated";
              const bannedFlag: unknown = user.user_banned;
              const isBanned =
                bannedFlag === true ||
                bannedFlag === 1 ||
                String(bannedFlag) === "1";
              const displayEmail =
                user.deletion_email_masked || user.user_email || user.business_email;
              const displayPhone = isDeleted
                ? user.deletion_phone_last4
                  ? `•••• ${user.deletion_phone_last4}`
                  : null
                : user.user_phone;
              return (
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
                        <span
                          className="badge badge--verified"
                          style={
                            user.badge_color
                              ? { background: user.badge_color, color: "#fff", borderColor: user.badge_color }
                              : undefined
                          }
                        >
                          <Shield size={12} /> Verified
                        </span>
                      )}
                      {isBanned && (
                        <span className="badge badge--banned">
                          <Ban size={12} /> Banned
                        </span>
                      )}
                      {user.account_status === "rejected" && (
                        <span className="badge badge--rejected">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                      {isDeactivated && (
                        <span className="badge badge--inactive">Deactivated</span>
                      )}
                      {isDeleted && (
                        <span className="badge badge--inactive">Deleted</span>
                      )}
                      {!user.user_activated && !isDeactivated && !isDeleted && (
                        <span className="badge badge--inactive">Not Activated</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-user-card__details">
                  <div className="admin-user-card__detail-item">
                    <Mail size={16} />
                    <span>{displayEmail}</span>
                  </div>
                  {displayPhone && (
                    <div className="admin-user-card__detail-item">
                      <Phone size={16} />
                      <span>{displayPhone}</span>
                    </div>
                  )}
                  <div className="admin-user-card__detail-item">
                    <span>ID: {user.user_id}</span>
                  </div>
                  <div className="admin-user-card__detail-item">
                    <span>Joined: {formatDate(user.user_registered)}</span>
                  </div>
                  {isDeleted && user.deleted_at && (
                    <div className="admin-user-card__detail-item">
                      <span>
                        Deleted: {formatDate(user.deleted_at)}
                        {user.deleted_via ? ` (${user.deleted_via})` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {!isDeleted && (
                <UserBadgeColorEditor
                  user={user}
                  disabled={processing === user.user_id}
                  onSaved={(color) => {
                    setUsers((current) =>
                      current.map((row) =>
                        row.user_id === user.user_id ? { ...row, badge_color: color } : row
                      )
                    );
                    setFilteredUsers((current) =>
                      current.map((row) =>
                        row.user_id === user.user_id ? { ...row, badge_color: color } : row
                      )
                    );
                    setSuccess(
                      color === PURPLE_BADGE
                        ? "Purple badge set for this account"
                        : color
                          ? "Badge color saved"
                          : "Badge color cleared"
                    );
                  }}
                  onError={setError}
                />
                )}

                <div className="admin-user-card__actions">
                  {isDeleted ? (
                    <span className="badge badge--inactive">Security record kept</span>
                  ) : (
                    <>
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
                  {!user.user_approved && accountStatusOf(user) !== "rejected" && !isDeactivated && (
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
                  {(!user.user_approved || accountStatusOf(user) === "pending") && accountStatusOf(user) !== "rejected" && !isDeactivated && (
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
                  {isDeactivated && (
                    <button
                      onClick={() => handleAction(user.user_id, "activate", activateUser)}
                      disabled={processing === user.user_id}
                      className="admin-action-btn admin-action-btn--approve"
                      title="Restore sign-in after the member asks to come back"
                    >
                      {processing === user.user_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Reactivate
                    </button>
                  )}
                  {!isBanned ? (
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
                    </>
                  )}
                </div>
              </div>
            );
            })}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message={
          pendingAction
            ? `This will delete ${pendingAction.userName}'s profile, posts, messages, and login access.\n\n` +
              `A limited security record (account ID and hashed identifiers) is kept for fraud and abuse investigation.\n\n` +
              `The member will not be able to sign in again. Continue?`
            : ""
        }
        confirmText="Delete User"
        cancelText="Cancel"
        type="danger"
        isLoading={processing === pendingAction?.userId}
      />

      {/* Ban Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBanConfirm}
        onClose={() => {
          setShowBanConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmBan}
        title="Ban User Account"
        message={
          pendingAction
            ? `Are you sure you want to ban ${pendingAction.userName}? They will not be able to access their account until you unban them.`
            : ""
        }
        confirmText="Ban User"
        cancelText="Cancel"
        type="ban"
        isLoading={processing === pendingAction?.userId}
      />

      <ConfirmationModal
        isOpen={showActivateConfirm}
        onClose={() => {
          setShowActivateConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmActivate}
        title="Reactivate account"
        message={
          pendingAction
            ? `Restore sign-in for ${pendingAction.userName}?\n\nThey will be able to log in again. Use this after they contact support and ask to come back.`
            : ""
        }
        confirmText="Reactivate"
        cancelText="Cancel"
        type="warning"
        isLoading={processing === pendingAction?.userId}
      />
    </div>
  );
};

function UserBadgeColorEditor({
  user,
  disabled,
  onSaved,
  onError,
}: {
  user: User;
  disabled: boolean;
  onSaved: (color: string | null) => void;
  onError: (message: string | null) => void;
}) {
  const [value, setValue] = useState(user.badge_color || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(user.badge_color || "");
  }, [user.badge_color]);

  const save = async () => {
    try {
      setSaving(true);
      onError(null);
      const result = await setUserBadgeColor(user.user_id, value);
      if (!result.success) {
        throw new Error(result.message || "Failed to save badge color");
      }
      onSaved(result.data?.badge_color ?? (value.trim() ? value : null));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save badge color");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-user-card__badge-color">
      <span className="admin-user-card__badge-color-label">Name badge color</span>
      <AdminBadgeColorField
        value={value}
        onChange={setValue}
        onSave={() => void save()}
        saving={saving}
        disabled={disabled}
        showSave
        hint="Set purple for special accounts. Members with a package keep the membership color unless you override it here."
      />
    </div>
  );
}

export default AdminUsers;

