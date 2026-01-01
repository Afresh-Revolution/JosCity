import React, { useState, useEffect } from "react";
import {
  Search,
  Flag,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Shield,
} from "lucide-react";
import {
  getPages,
  verifyPage,
  deletePage,
  type Page,
  type PagesResponse,
} from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const AdminPages: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPages();
  }, [page]);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PagesResponse = await getPages({
        page,
        limit: 20,
        search: searchQuery || undefined,
      });
      setPages(response.data || []);
      setFilteredPages(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load pages:", err);
      // Don't set error if it's just an empty result
      setPages([]);
      setFilteredPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPages(pages);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPages(
        pages.filter(
          (page) =>
            page.page_title?.toLowerCase().includes(query) ||
            page.page_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, pages]);

  const handleAction = async (
    pageId: string,
    action: string,
    actionFn: (id: string) => Promise<any>
  ) => {
    try {
      setProcessing(pageId);
      setError(null);
      setSuccess(null);
      await actionFn(pageId);
      setSuccess(`Page ${action} successfully`);
      await loadPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} page`);
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
          <Flag size={20} />
          Pages Management
        </h1>
      </div>

      <div className="admin-dashboard__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search pages by name or title..."
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
          <span>Loading pages...</span>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="admin-dashboard__empty-state">
          <Flag size={48} />
          <p>No pages yet</p>
        </div>
      ) : (
        <>
          <div className="admin-pages-grid">
            {filteredPages.map((pageItem) => (
              <div key={pageItem.page_id} className="admin-page-card">
                <div className="admin-page-card__header">
                  {pageItem.page_picture && (
                    <img
                      src={pageItem.page_picture}
                      alt={pageItem.page_title}
                      className="admin-page-card__image"
                    />
                  )}
                  <div className="admin-page-card__info">
                    <h3>{pageItem.page_title}</h3>
                    <p className="admin-page-card__name">@{pageItem.page_name}</p>
                    <div className="admin-page-card__badges">
                      {pageItem.page_verified && (
                        <span className="badge badge--verified">
                          <Shield size={12} /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-page-card__details">
                  <span>Created: {formatDate(pageItem.page_date)}</span>
                </div>

                <div className="admin-page-card__actions">
                  {!pageItem.page_verified && (
                    <button
                      onClick={() => handleAction(pageItem.page_id, "verify", verifyPage)}
                      disabled={processing === pageItem.page_id}
                      className="admin-action-btn admin-action-btn--verify"
                    >
                      {processing === pageItem.page_id ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <Shield size={16} />
                      )}
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(pageItem.page_id, "delete", deletePage)}
                    disabled={processing === pageItem.page_id}
                    className="admin-action-btn admin-action-btn--delete"
                  >
                    {processing === pageItem.page_id ? (
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

export default AdminPages;

