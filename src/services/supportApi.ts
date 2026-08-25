import { apiUrl } from "../api/config";

export type PublicFaq = {
  id: number;
  question: string;
  answer: string;
};

export type PublicSupportContent = {
  kicker?: string;
  title?: string;
  chat_hours?: string;
  faqs?: PublicFaq[];
  emails?: Array<{ id: number; label: string; value: string }>;
  phones?: Array<{ id: number; label: string; value: string }>;
};

export async function getPublicSupport(): Promise<PublicSupportContent> {
  const response = await fetch(apiUrl("/support"), {
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: PublicSupportContent;
    message?: string;
  };
  if (!response.ok || !payload.data) {
    throw new Error(payload.message || "Could not load common questions");
  }
  return payload.data;
}
