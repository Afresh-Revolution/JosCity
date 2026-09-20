import { useSyncExternalStore } from "react";
export const JOB_STEPS = ["Accepted", "Sourcing", "Ready for delivery", "Out for delivery", "Delivered"] as const;
export type PreviewRequest = { id: string; title: string; service: string; category: string; description: string; budget: string; pickup: string; destination: string; deadline: string; images: string[]; customer: string; target?: string; stage: number; agent?: string; publicHandoff?: boolean };
const phoneImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop";
let state = {
  requestAlerts: true, jobAlerts: true, messageAlerts: true,
  firstName: "John", lastName: "Musa", email: "", phone: "", gender: "", address: "Jos North, Plateau",
  avatar: "", accepting: true, services: ["Help me buy", "Help me deliver"], category: "Electronics, Groceries", bio: "Helping Jos find gadgets and everyday essentials.",
  requests: [
    { id: "sample-buy", title: "Samsung Galaxy S25 (256GB)", service: "Help me buy", category: "Phones & gadgets", description: "Find a new, sealed 256GB phone, preferably black. Confirm warranty and share a receipt. Reference photo is illustrative.", budget: "1050000", pickup: "Terminus", destination: "Rayfield, Jos", deadline: "Tomorrow, before 5pm", images: [phoneImage], customer: "Chidi N. (sample)", stage: -1 },
    { id: "sample-delivery", title: "Deliver a sealed package", service: "Help me deliver", category: "Parcels", description: "One sealed parcel, approximately 2kg. Keep upright and call on arrival.", budget: "3000", pickup: "Terminus market entrance", destination: "Rayfield, Jos", deadline: "Today, before 6pm", images: [], customer: "Amina D. (sample)", stage: -1 },
  ] as PreviewRequest[],
};
const listeners = new Set<() => void>();
export function updateAgentPreview(patch: Partial<typeof state>) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); }
export function updatePreviewRequest(id: string, patch: Partial<PreviewRequest>) { updateAgentPreview({ requests: state.requests.map(item => item.id === id ? { ...item, ...patch } : item) }); }
export function addPreviewRequest(request: PreviewRequest) { updateAgentPreview({ requests: [request, ...state.requests] }); }
export function useAgentPreview() { return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state, () => state); }
export const SAMPLE_AGENTS = [
  { id: "amina", name: "Amina Danjuma", rating: 4.9, jobs: 240, category: "Fashion, Groceries", bio: "Personal shopping and careful deliveries around Rayfield.", accepting: true },
  { id: "john", name: "John Musa", rating: 4.8, jobs: 126, category: "Electronics, Groceries", bio: "Phones, gadgets and everyday essentials in Jos North.", accepting: true },
  { id: "daniel", name: "Daniel Pam", rating: 4.7, jobs: 92, category: "Furniture, Building materials", bio: "Sourcing home essentials and bulky items in Bukuru.", accepting: false },
];

export const BADGE_AGENT = "#8B5CF6";
export function formatAgentAmount(value: string | number) { const amount = Number(String(value).replace(/,/g, "")); return Number.isFinite(amount) ? amount.toLocaleString("en-NG", { maximumFractionDigits: 2 }) : "0"; }

const PENDING_KEY = "joscity.pendingAgentApplication";
export type PendingAgentApplication = { bio: string; category: string; services: string[]; nin: string };
export function savePendingAgentApplication(pending: PendingAgentApplication) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch { /* ignore */ }
}
export function loadPendingAgentApplication(): PendingAgentApplication | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingAgentApplication;
    return parsed && typeof parsed === "object" ? { bio: String(parsed.bio || ""), category: String(parsed.category || ""), services: Array.isArray(parsed.services) ? parsed.services.map(String) : [], nin: String(parsed.nin || "") } : null;
  } catch { return null; }
}
export function clearPendingAgentApplication() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}
export function becomePayloadFromSignup(pending: PendingAgentApplication) {
  const buy = pending.services.some(item => item.toLowerCase().includes("buy"));
  const deliver = pending.services.some(item => item.toLowerCase().includes("deliver"));
  return {
    agentType: buy && deliver ? "both" : deliver ? "deliver" : "buy",
    bio: pending.bio.trim(),
    categories: String(pending.category || "").split(/[,/|]/).map(item => item.trim()).filter(Boolean),
    ninNumber: pending.nin.replace(/\D/g, "") || undefined,
  };
}
