import React, { useState, useEffect } from "react";
import {
  Search,
  Newspaper,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import {
  getPosts,
  getPost,
  approvePost,
  deletePost,
  type Post,
  type PostsResponse,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPosts();
  }, [page, statusFilter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PostsResponse = await getPosts({
        page,
        limit: 20,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      });
      setPosts(response.data || []);
      setFilteredPosts(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load posts:", err);
      // Don't set error if it's just an empty result
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPosts(
        posts.filter(
          (post) =>
            post.text?.toLowerCase().includes(query) ||
            post.author_name?.toLowerCase().includes(query) ||
            post.post_id?.includes(query)
        )
      );
    }
  }, [searchQuery, posts]);

  const handleAction = async (
    postId: string,
    action: string,
    actionFn: (id: string) => Promise<any>
  ) => {
    try {
      setProcessing(postId);
      setError(null);
      setSuccess(null);
      await actionFn(postId);
      setSuccess(`Post ${action} successfully`);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} post`);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1>
          <Newspaper size={20} />
          Posts Management
        </h1>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search posts by content or author..."
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
          <span>Loading posts...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Newspaper size={48} />
          <p>No posts yet</p>
        </div>
      ) : (
        <>
          <div className="admin-posts-list">
            {filteredPosts.map((post) => (
              <div key={post.post_id} className="admin-post-card">
                <div className="admin-post-card__header">
                  <div className="admin-post-card__author">
                    {post.author_picture && (
                      <img
                        src={post.author_picture}
                        alt={post.author_name}
                        className="admin-post-card__avatar"
                      />
                    )}
                    <div>
                      <h4>{post.author_name || "Unknown"}</h4>
                      <span className="admin-post-card__date">
                        {formatDate(post.time)}
                      </span>
                    </div>
                  </div>
                  <div className="admin-post-card__badges">
                    {!post.has_approved && (
                      <span className="badge badge--pending">Pending</span>
                    )}
                    {post.has_approved && (
                      <span className="badge badge--approved">Approved</span>
                    )}
                  </div>
                </div>

                <div className="admin-post-card__content">
                  <p>{post.text || "No content"}</p>
                  <div className="admin-post-card__meta">
                    <span>Post ID: {post.post_id}</span>
                    <span>Type: {post.post_type || "text"}</span>
                  </div>
                </div>

                <div className="admin-post-card__actions">
                  <button
                    onClick={() => getPost(post.post_id)}
                    className="admin-action-btn admin-action-btn--view"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  {!post.has_approved && (
                    <button
                      onClick={() => handleAction(post.post_id, "approve", approvePost)}
                      disabled={processing === post.post_id}
                      className="admin-action-btn admin-action-btn--approve"
                    >
                      {processing === post.post_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleAction(post.post_id, "delete", (id) =>
                        deletePost(id, "Removed by administrator")
                      )
                    }
                    disabled={processing === post.post_id}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === post.post_id ? (
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

export default AdminPosts;

