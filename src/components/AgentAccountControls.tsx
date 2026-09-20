import { useState } from "react";
import { ShieldCheck, Download, Settings, Flag, Ban, PauseCircle, Trash2, Mail, ChevronRight } from "lucide-react";
const sections = [
 { title: "Security & privacy", rows: [
  { title: "Verification & security", icon: ShieldCheck, subtitle: "Identity verification and account protection", copy: "Agent verification, password changes and session management will be available when agent accounts launch. Verification is not submitted; the purple badge is a design preview. No identity documents are collected here." },
  { title: "Download my data", icon: Download, subtitle: "A copy of your profile and transactions", copy: "Your export will include your agent profile, requests, job history and transactions. Data export is not connected in this preview." },
  { title: "Device permissions", icon: Settings, subtitle: "Manage photos, location and notifications", copy: "Open this website's site settings in your browser to review permissions. Grant only the access needed for features you use. This preview does not track your location." }
 ]},
 { title: "Safety & support", rows: [
  { title: "Report a safety concern", icon: Flag, subtitle: "Child safety, abuse or prohibited content", copy: "Describe your concern and include a relevant profile, post or job reference. Do not upload or forward illegal content. This preview does not submit reports." },
  { title: "Blocked accounts", icon: Ban, subtitle: "Manage accounts you have blocked", copy: "No blocked accounts in this agent preview. Blocking and unblocking will be connected to your agent account before launch." }
 ]},
 { title: "Account access", rows: [
  { title: "Deactivate account", icon: PauseCircle, subtitle: "Temporarily pause your agent account", copy: "Deactivation pauses your account; it does not delete your data. Reactivation rules will be shown before confirmation. This preview cannot deactivate an account." },
  { title: "Delete account", icon: Trash2, subtitle: "Permanently delete your agent account and data", copy: "Deletion permanently removes your agent account and associated data, except records legally required to be retained. Retention reasons and periods must be shown before confirmation. This preview cannot delete an account." }
 ]}
];
export default function AgentAccountControls() {
 const [selected, setSelected] = useState<typeof sections[number]["rows"][number] | null>(null);
 const [details, setDetails] = useState("");
 return <>{sections.map(section => <section key={section.title}><h2 className="agent-settings-label">{section.title}</h2><div className="agent-card agent-settings-list">{section.rows.map(row => <button key={row.title} className={`agent-menu-row${row.title === "Delete account" ? " agent-danger" : ""}`} onClick={() => { setDetails(""); setSelected(row); }}><row.icon /><span><strong>{row.title}</strong><small>{row.subtitle}</small></span><ChevronRight /></button>)}</div></section>)}<a className="agent-menu-row" href="https://joscity.com/contact" target="_blank" rel="noreferrer"><Mail /><span><strong>Contact support</strong><small>support@joscity.com</small></span><ChevronRight /></a>
 {selected && <div className="agent-dialog-backdrop"><section className="agent-card agent-dialog" role="dialog" aria-modal="true" aria-labelledby="agent-account-panel-title"><h2 id="agent-account-panel-title">{selected.title}</h2><p>{selected.copy}</p>{selected.title === "Report a safety concern" && <label>Safety concern details (preview)<textarea rows={4} value={details} onChange={e => setDetails(e.target.value)} /></label>}{!["Device permissions", "Blocked accounts"].includes(selected.title) && <button disabled>Not available in preview</button>}{selected.title === "Report a safety concern" && <a href="https://joscity.com/contact" target="_blank" rel="noreferrer">Contact support</a>}<button autoFocus onClick={() => setSelected(null)}>Close</button></section></div>}
 </>;
}
