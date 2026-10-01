import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, Download, Loader2, XCircle } from "lucide-react";
import { getAuditLog, type AuditLogEntry, type AuditLogResponse } from "../services/adminApi";
import "../main.css";
import "../scss/_admin.scss";

const CATEGORIES = [
  { value: "all", label: "All activity" },
  { value: "signup", label: "Signups" },
  { value: "wallet", label: "Wallet" },
  { value: "points", label: "Points" },
  { value: "order", label: "Orders" },
  { value: "report", label: "Reports" },
] as const;

const PAGE_SIZE = 50;
const EXPORT_LIMIT = 25000;

type Filters = {
  category: string;
  year: string;
  from: string;
  to: string;
  timeFrom: string;
  timeTo: string;
  q: string;
};

const EMPTY_FILTERS: Filters = {
  category: "all",
  year: "",
  from: "",
  to: "",
  timeFrom: "",
  timeTo: "",
  q: "",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatWhen(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1] || match[2];
  return `${month} ${Number(match[3])}, ${match[1]} · ${match[4]}:${match[5]}`;
}

function categoryLabel(value: string): string {
  return CATEGORIES.find((item) => item.value === value)?.label || value;
}

function xmlEscape(value: string): string {
  return value
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;");
}

function cell(value: string, type: "String" | "Number" = "String"): string {
  return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
}

function stampLabel(filters: Filters): string {
  const parts = [
    filters.category && filters.category !== "all" ? filters.category : "all",
    filters.year ? `year-${filters.year}` : "all-years",
    filters.from ? `from-${filters.from}` : "from-start",
    filters.to ? `to-${filters.to}` : "to-latest",
  ];
  if (filters.timeFrom) parts.push(`time-from-${filters.timeFrom.replace(":", "")}`);
  if (filters.timeTo) parts.push(`time-to-${filters.timeTo.replace(":", "")}`);
  if (filters.q) parts.push("search");
  return parts.join("_");
}

function buildWorkbook(rows: AuditLogEntry[], filters: Filters): string {
  const headers = [
    "When",
    "Year",
    "Date",
    "Time",
    "Category",
    "Action",
    "Name",
    "Email",
    "Amount",
    "Currency",
    "Status",
    "Reference",
    "Details",
  ];
  const headerRow = `<Row>${headers.map((header) => cell(header)).join("")}</Row>`;
  const body = rows
    .map((row) => {
      const date = row.occurred_at.slice(0, 10);
      const time = row.occurred_at.slice(11, 19);
      const year = row.occurred_at.slice(0, 4);
      const amount = row.amount && Number.isFinite(Number(row.amount)) ? row.amount : "";
      return `<Row>${[
        cell(row.occurred_at),
        cell(year),
        cell(date),
        cell(time),
        cell(categoryLabel(row.category)),
        cell(row.action),
        cell(row.actor),
        cell(row.email),
        amount ? cell(amount, "Number") : cell(""),
        cell(row.currency),
        cell(row.status),
        cell(row.reference),
        cell(row.details),
      ].join("")}</Row>`;
    })
    .join("");
  const note = `Filter: ${stampLabel(filters).split("_").join(" ")} · ${rows.length} rows`;
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Audit log">
<Table>
<Column ss:Width="150"/><Column ss:Width="60"/><Column ss:Width="90"/><Column ss:Width="70"/>
<Column ss:Width="90"/><Column ss:Width="160"/><Column ss:Width="160"/><Column ss:Width="200"/>
<Column ss:Width="90"/><Column ss:Width="70"/><Column ss:Width="90"/><Column ss:Width="90"/><Column ss:Width="220"/>
<Row><Cell ss:MergeAcross="12"><Data ss:Type="String">${xmlEscape(note)}</Data></Cell></Row>
${headerRow}
${body}
</Table>
</Worksheet>
</Workbook>`;
}

function downloadWorkbook(rows: AuditLogEntry[], filters: Filters) {
  const xml = buildWorkbook(rows, filters);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `joscity-audit-${stampLabel(filters)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const AdminAudit = () => {
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 8 }, (_, index) => String(currentYear - index)),
    [currentYear]
  );
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [log, setLog] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAuditLog({ ...filters, page, limit: PAGE_SIZE });
      if (!response.success) throw new Error("Could not load the audit log");
      setLog(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the audit log");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => {
    setPage(1);
    setFilters({ ...draft });
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      const response = await getAuditLog({ ...filters, page: 1, limit: EXPORT_LIMIT });
      if (!response.success) throw new Error("Could not export the audit log");
      if (response.data.length === 0) {
        setError("Nothing matches these filters to export.");
        return;
      }
      downloadWorkbook(response.data, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export the audit log");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = log ? Math.max(1, Math.ceil(log.total / PAGE_SIZE)) : 1;

  return (
    <div className="admin-dashboard admin-audit">
      <div className="admin-dashboard__header">
        <h1>
          <ClipboardList size={20} />
          Audit log
        </h1>
      </div>

      {error ? (
        <div className="admin-dashboard__message admin-dashboard__message--error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
            <XCircle size={18} />
          </button>
        </div>
      ) : null}

      <form
        className="admin-audit__panel"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="admin-audit__grid">
          <label className="admin-audit__field">
            <span>Activity</span>
            <select
              value={draft.category}
              onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-audit__field">
            <span>Year</span>
            <select
              value={draft.year}
              onChange={(event) => setDraft((current) => ({ ...current, year: event.target.value }))}
            >
              <option value="">All years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-audit__field">
            <span>From date</span>
            <input
              type="date"
              value={draft.from}
              onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
            />
          </label>
          <label className="admin-audit__field">
            <span>To date</span>
            <input
              type="date"
              value={draft.to}
              onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
            />
          </label>
          <label className="admin-audit__field">
            <span>From time</span>
            <input
              type="time"
              value={draft.timeFrom}
              onChange={(event) => setDraft((current) => ({ ...current, timeFrom: event.target.value }))}
            />
          </label>
          <label className="admin-audit__field">
            <span>To time</span>
            <input
              type="time"
              value={draft.timeTo}
              onChange={(event) => setDraft((current) => ({ ...current, timeTo: event.target.value }))}
            />
          </label>
          <label className="admin-audit__field admin-audit__field--wide">
            <span>Search</span>
            <input
              type="search"
              placeholder="Name, email, or reference"
              value={draft.q}
              onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
            />
          </label>
        </div>
        <div className="admin-audit__actions">
          <button type="submit" className="admin-audit__apply">
            Apply filters
          </button>
          <button type="button" className="admin-audit__ghost" onClick={clearFilters}>
            Clear
          </button>
          <button
            type="button"
            className="admin-audit__ghost"
            onClick={() => void handleExport()}
            disabled={exporting || loading}
          >
            {exporting ? <Loader2 size={16} className="spinner" /> : <Download size={16} />}
            Export Excel
          </button>
        </div>
        <p className="admin-audit__hint">Excel export uses the filters applied to this list.</p>
      </form>

      {log ? (
        <div className="admin-audit__stats">
          <div>
            <strong>{log.total}</strong>
            <span>Matching</span>
          </div>
          <div>
            <strong>{log.counts.signup}</strong>
            <span>Signups</span>
          </div>
          <div>
            <strong>{log.counts.wallet}</strong>
            <span>Wallet</span>
          </div>
          <div>
            <strong>{log.counts.points}</strong>
            <span>Points</span>
          </div>
          <div>
            <strong>{log.counts.order}</strong>
            <span>Orders</span>
          </div>
          <div>
            <strong>{log.counts.report}</strong>
            <span>Reports</span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="admin-dashboard__loading">
          <Loader2 size={32} className="spinner" />
          <span className="admin-dashboard__loading-text">Loading audit log...</span>
        </div>
      ) : !log ? null : log.data.length === 0 ? (
        <p className="admin-signup-reports__empty">No activity matches these filters.</p>
      ) : (
        <>
          <ul className="admin-audit__cards">
            {log.data.map((row) => (
              <li key={row.id} className="admin-audit__card">
                <div className="admin-audit__card-top">
                  <span className={`admin-audit__pill admin-audit__pill--${row.category}`}>
                    {categoryLabel(row.category)}
                  </span>
                  <time>{formatWhen(row.occurred_at)}</time>
                </div>
                <strong>{row.action}</strong>
                <p>{row.actor}</p>
                {row.email ? <p className="admin-audit__muted">{row.email}</p> : null}
                <dl>
                  <div>
                    <dt>Amount</dt>
                    <dd>{row.amount ? `${row.amount} ${row.currency}` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{row.status || "—"}</dd>
                  </div>
                  <div>
                    <dt>Reference</dt>
                    <dd>{row.reference}</dd>
                  </div>
                </dl>
                {row.details ? <p className="admin-audit__muted">{row.details}</p> : null}
              </li>
            ))}
          </ul>
          <div className="admin-audit__table-wrap">
            <table className="admin-signup-reports__table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Activity</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {log.data.map((row) => (
                  <tr key={row.id}>
                    <td>{formatWhen(row.occurred_at)}</td>
                    <td>
                      <strong>{row.action}</strong>
                      <span>{categoryLabel(row.category)}</span>
                    </td>
                    <td>
                      <strong>{row.actor}</strong>
                      {row.email ? <span>{row.email}</span> : null}
                    </td>
                    <td>{row.amount ? `${row.amount} ${row.currency}` : "—"}</td>
                    <td>{row.status || "—"}</td>
                    <td>
                      <strong>{row.reference}</strong>
                      {row.details ? <span>{row.details}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-signup-reports__pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAudit;
