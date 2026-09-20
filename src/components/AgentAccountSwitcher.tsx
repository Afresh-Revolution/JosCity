import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAccountType, isAuthenticated } from "../utils/userUtils";
import "../pages/AgentPreview.css";
export default function AgentAccountSwitcher({ current, className }: { current?: "personal" | "business" | "agent"; className?: string }) {
 const [open, setOpen] = useState(false); const navigate = useNavigate();
 const active = current || (getUserAccountType().toLowerCase() === "business" ? "business" : "personal");
 return <><button type="button" className={className} onClick={() => setOpen(true)}>Switch account</button>{open && <div className="agent-preview agent-switch-root"><div className="agent-dialog-backdrop"><section className="agent-card agent-dialog" role="dialog" aria-modal="true" aria-labelledby="agent-switch-title"><h2 id="agent-switch-title">Switch account</h2><p>Choose the account you want to use.</p>{(["personal", "business", "agent"] as const).filter(type => type !== active).map(type => <button key={type} onClick={() => { setOpen(false); if (type === "agent") navigate("/agents"); else if (isAuthenticated() && (getUserAccountType().toLowerCase() === "business" ? "business" : "personal") === type) navigate("/newsfeed"); else navigate(`/signin?type=${type}`); }}>{type === "agent" ? "Agent" : type === "business" ? "Business" : "Personal"}</button>)}<button onClick={() => setOpen(false)}>Cancel</button></section></div></div>}</>;
}
