import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
} from "lucide-react";
import { apiUrl } from "../api/config";
import "./AdminBroadcastStrip.scss";

export type AdminBroadcastType =
  | "normal"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface AdminBroadcastItem {
  id: number | string;
  title?: string | null;
  message?: string | null;
  notification_type: AdminBroadcastType;
  time?: string | null;
  expires_at?: string | null;
}

const EMPTY_DASHBOARD_ITEMS: AdminBroadcastItem[] = [];

export function normalizeAdminBroadcastType(
  raw: string | undefined | null
): AdminBroadcastType {
  const v = String(raw || "normal").toLowerCase();
  if (
    v === "normal" ||
    v === "info" ||
    v === "success" ||
    v === "warning" ||
    v === "danger"
  ) {
    return v;
  }
  return "normal";
}

function typeIcon(t: AdminBroadcastType, size = 22) {
  switch (t) {
    case "info":
      return <Info size={size} aria-hidden />;
    case "success":
      return <CheckCircle2 size={size} aria-hidden />;
    case "warning":
      return <AlertTriangle size={size} aria-hidden />;
    case "danger":
      return <AlertOctagon size={size} aria-hidden />;
    default:
      return <Bell size={size} aria-hidden />;
  }
}

function typeLabel(t: AdminBroadcastType): string {
  switch (t) {
    case "info":
      return "Information";
    case "success":
      return "Success";
    case "warning":
      return "Warning";
    case "danger":
      return "Important alert";
    default:
      return "Announcement";
  }
}

type Props =
  | {
      variant: "landing";
      items?: undefined;
      onHasItemsChange?: (has: boolean) => void;
    }
  | {
      variant: "dashboard";
      items: AdminBroadcastItem[];
      onHasItemsChange?: (has: boolean) => void;
    };

export default function AdminBroadcastStrip(props: Props) {
  const { variant, onHasItemsChange } = props;
  const dashboardItems =
    variant === "dashboard" ? props.items : EMPTY_DASHBOARD_ITEMS;
  const [items, setItems] = useState<AdminBroadcastItem[]>(
    variant === "dashboard" ? dashboardItems : []
  );
  const [loading, setLoading] = useState(variant === "landing");
  const [selected, setSelected] = useState<AdminBroadcastItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (variant === "dashboard") {
      setItems(dashboardItems);
    }
  }, [variant, dashboardItems]);

  useEffect(() => {
    if (variant !== "landing") return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(
          apiUrl("/notifications/public/landing?limit=20"),
          { signal: AbortSignal.timeout(12000) }
        );
        const json = (await res.json()) as {
          success?: boolean;
          data?: Array<Record<string, unknown>>;
        };
        if (!res.ok || json.success === false || !Array.isArray(json.data)) {
          if (!cancelled) {
            setItems([]);
            setLoading(false);
          }
          return;
        }
        const mapped: AdminBroadcastItem[] = json.data.map((row) => ({
          id: row.id as number | string,
          title: (row.title as string) || null,
          message: (row.message as string) || null,
          notification_type: normalizeAdminBroadcastType(
            row.notification_type as string
          ),
          time: (row.time as string) || null,
          expires_at: (row.expires_at as string) || null,
        }));
        if (!cancelled) {
          setItems(mapped);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [variant]);

  useEffect(() => {
    onHasItemsChange?.(items.length > 0);
  }, [items.length, onHasItemsChange]);

  const openPanel = useCallback((item: AdminBroadcastItem) => {
    setSelected(item);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => setSelected(null), 280);
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [panelOpen, closePanel]);

  if (loading && variant === "landing") {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`admin-broadcast-strip admin-broadcast-strip--${variant}`}
        role="region"
        aria-label="Announcements from JosCity"
      >
        <div className="admin-broadcast-strip__inner">
          {items.map((item) => {
            const t = item.notification_type;
            return (
              <button
                key={String(item.id)}
                type="button"
                className={`admin-broadcast-strip__chip admin-broadcast-strip__chip--${t}`}
                onClick={() => openPanel(item)}
                aria-label={`${typeLabel(t)}: ${item.title || "Open announcement"}`}
              >
                <span className="admin-broadcast-strip__chip-icon">
                  {typeIcon(t, 20)}
                </span>
                <span className="admin-broadcast-strip__chip-text">
                  {item.title?.trim() || typeLabel(t)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {panelOpen && selected && (
        <div
          className="admin-broadcast-panel-overlay"
          role="presentation"
          onClick={closePanel}
        >
          <div
            className="admin-broadcast-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-broadcast-panel-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`admin-broadcast-panel__accent admin-broadcast-panel__accent--${selected.notification_type}`}
            />
            <button
              type="button"
              className="admin-broadcast-panel__close"
              onClick={closePanel}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <div className="admin-broadcast-panel__icon-wrap">
              {typeIcon(selected.notification_type, 32)}
            </div>
            <h2 id="admin-broadcast-panel-title" className="admin-broadcast-panel__title">
              {selected.title?.trim() || typeLabel(selected.notification_type)}
            </h2>
            <p className="admin-broadcast-panel__body">
              {selected.message?.trim() || "—"}
            </p>
            {(selected.time || selected.expires_at) && (
              <p className="admin-broadcast-panel__meta">
                {selected.time && (
                  <span>
                    Posted{" "}
                    {new Date(selected.time).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
                {selected.expires_at && (
                  <span className="admin-broadcast-panel__expires">
                    {" · "}
                    Until{" "}
                    {new Date(selected.expires_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
