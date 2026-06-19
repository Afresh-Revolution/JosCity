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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewPost, setViewPost] = useState<Post | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, [page]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PostsResponse = await getPosts({
        page,
        limit: 20,
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewPost(null);
    setViewError(null);
    setViewLoading(false);
  };

  const handleViewPost = async (postId: string) => {
    setIsViewModalOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewPost(null);

    try {
      const response = await getPost(postId);
      if (!response.success || !response.data) {
        throw new Error("Post not found");
      }
      setViewPost(response.data);
    } catch (err) {
      setViewError(
        err instanceof Error ? err.message : "Failed to load post details"
      );
    } finally {
      setViewLoading(false);
    }
  };

  const getPostImage = (post: Post): string | undefined => {
    const record = post as Post & {
      image?: string;
      post_image?: string;
      media_url?: string;
    };
    return record.image || record.post_image || record.media_url;
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
                    type="button"
                    onClick={() => handleViewPost(post.post_id)}
                    disabled={processing === post.post_id}
                    className="admin-action-btn admin-action-btn--view"
                  >
                    <Eye size={16} />
                    View
                  </button>
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

      {isViewModalOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!viewLoading && processing !== viewPost?.post_id) {
              closeViewModal();
            }
          }}
        >
          <div
            className="admin-event-modal admin-post-view-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-post-view-title"
          >
            <div className="admin-event-modal__header">
              <h2 id="admin-post-view-title">Post Details</h2>
              <button
                type="button"
                onClick={closeViewModal}
                aria-label="Close post details"
                disabled={viewLoading}
              >
                <XCircle size={20} />
              </button>
            </div>

            {viewError && (
              <div className="admin-event-modal__message admin-event-modal__message--error">
                <AlertCircle size={18} />
                <span>{viewError}</span>
                <button type="button" onClick={() => setViewError(null)}>
                  <XCircle size={18} />
                </button>
              </div>
            )}

            <div className="admin-post-view-modal__body">
              {viewLoading ? (
                <div className="admin-post-view-modal__loading">
                  <Loader2 size={28} className="spinner" />
                  <span>Loading post...</span>
                </div>
              ) : viewPost ? (
                <>
                  <div className="admin-post-view-modal__author">
                    {viewPost.author_picture ? (
                      <img
                        src={viewPost.author_picture}
                        alt={viewPost.author_name || "Author"}
                        className="admin-post-view-modal__avatar"
                      />
                    ) : (
                      <div className="admin-post-view-modal__avatar admin-post-view-modal__avatar--placeholder">
                        {(viewPost.author_name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3>{viewPost.author_name || "Unknown"}</h3>
                      <span>{formatDate(viewPost.time)}</span>
                    </div>
                  </div>

                  <div className="admin-post-view-modal__content">
                    <p>{viewPost.text || "No content"}</p>
                  </div>

                  {getPostImage(viewPost) && (
                    <div className="admin-post-view-modal__media">
                      <img
                        src={getPostImage(viewPost)}
                        alt="Post media"
                      />
                    </div>
                  )}

                  <dl className="admin-post-view-modal__meta">
                    <div>
                      <dt>Post ID</dt>
                      <dd>{viewPost.post_id}</dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{viewPost.post_type || "text"}</dd>
                    </div>
                    <div>
                      <dt>User ID</dt>
                      <dd>{viewPost.user_id}</dd>
                    </div>
                    <div>
                      <dt>User Type</dt>
                      <dd>{viewPost.user_type || "—"}</dd>
                    </div>
                  </dl>
                </>
              ) : null}
            </div>

            {viewPost && (
              <div className="admin-event-modal__actions">
                <button
                  type="button"
                  className="admin-action-btn"
                  onClick={closeViewModal}
                  disabled={processing === viewPost.post_id}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--delete"
                  onClick={async () => {
                    await handleAction(viewPost.post_id, "delete", (id) =>
                      deletePost(id, "Removed by administrator")
                    );
                    closeViewModal();
                  }}
                  disabled={processing === viewPost.post_id}
                >
                  {processing === viewPost.post_id ? (
                    <Loader2 size={16} className="spinner" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;

