import React from "react";

const AdminNavBadge: React.FC<{ count?: number | null }> = ({ count }) => {
  const n = Number(count || 0);
  if (!Number.isFinite(n) || n < 1) return null;
  return <span className="admin-nav-badge">{n > 99 ? "99+" : n}</span>;
};

export default AdminNavBadge;
