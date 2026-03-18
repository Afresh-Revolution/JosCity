import React, { useState, useEffect } from "react";
import {
  Search,
  Users,
  Trash2,
  Loader2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import {
  getGroups,
  deleteGroup,
  type Group,
  type GroupsResponse,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminGroups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadGroups();
  }, [page]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: GroupsResponse = await getGroups({
        page,
        limit: 20,
        search: searchQuery || undefined,
      });
      setGroups(response.data || []);
      setFilteredGroups(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load groups:", err);
      // Don't set error if it's just an empty result
      setGroups([]);
      setFilteredGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredGroups(
        groups.filter(
          (group) =>
            group.group_title?.toLowerCase().includes(query) ||
            group.group_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, groups]);

  const handleDelete = async (groupId: string) => {
    try {
      setProcessing(groupId);
      setError(null);
      setSuccess(null);
      await deleteGroup(groupId);
      setSuccess("Group deleted successfully");
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
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
          Groups Management
        </h1>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search groups by name or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span>Loading groups...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Users size={48} />
          <p>No groups yet</p>
        </div>
      ) : (
        <>
          <div className="admin-groups-grid">
            {filteredGroups.map((group) => (
              <div key={group.group_id} className="admin-group-card">
                <div className="admin-group-card__header">
                  {group.group_picture && (
                    <img
                      src={group.group_picture}
                      alt={group.group_title}
                      className="admin-group-card__image"
                    />
                  )}
                  <div className="admin-group-card__info">
                    <h3>{group.group_title}</h3>
                    <p className="admin-group-card__name">@{group.group_name}</p>
                  </div>
                </div>

                <div className="admin-group-card__details">
                  <span>Created: {formatDate(group.group_date)}</span>
                </div>

                <div className="admin-group-card__actions">
                  <button
                    onClick={() => handleDelete(group.group_id)}
                    disabled={processing === group.group_id}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === group.group_id ? (
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

export default AdminGroups;

