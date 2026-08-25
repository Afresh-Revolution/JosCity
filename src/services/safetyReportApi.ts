import { apiUrl } from "../api/config";

export const REPORT_REASONS = [
  { id: "child_safety", label: "Child safety or sexual exploitation" },
  { id: "nudity", label: "Nudity or sexual content" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "violence", label: "Violence or dangerous content" },
  { id: "hate", label: "Hate speech" },
  { id: "scam", label: "Scam or fraud" },
  { id: "spam", label: "Spam" },
  { id: "impersonation", label: "Impersonation" },
  { id: "illegal", label: "Illegal goods or activity" },
  { id: "other", label: "Other" },
] as const;

export type SafetyContentType =
  | "profile"
  | "post"
  | "comment"
  | "story"
  | "reel"
  | "message"
  | "conversation"
  | "listing"
  | "general";

export type SafetyReportPayload = {
  content_type: SafetyContentType;
  content_id?: string | number | null;
  reported_user_id?: number | null;
  reason: string;
  description?: string;
};

export type SafetyReportResult = {
  success: boolean;
  already_reported?: boolean;
  message?: string;
};

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function submitSafetyReport(
  payload: SafetyReportPayload
): Promise<SafetyReportResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(apiUrl("/safety-reports"), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({
        content_type: payload.content_type,
        content_id: payload.content_id ?? null,
        reported_user_id: payload.reported_user_id ?? null,
        reason: payload.reason,
        description: payload.description || "",
      }),
    });
    const data = (await response.json().catch(() => ({}))) as SafetyReportResult & {
      error?: string;
    };
    if (!response.ok) {
      return {
        success: false,
        message: data.message || data.error || "Could not submit this report.",
      };
    }
    return {
      success: true,
      already_reported: data.already_reported,
      message: data.message,
    };
  } catch {
    return { success: false, message: "Could not submit this report." };
  } finally {
    window.clearTimeout(timer);
  }
}
