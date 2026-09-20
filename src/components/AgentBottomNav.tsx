import { Link, useLocation } from "react-router-dom";
import { Grid2X2, Newspaper, Wallet, User, Settings } from "lucide-react";
import "../pages/AgentPreview.css";
export default function AgentBottomNav() { const { pathname } = useLocation(); return <nav className="agent-feed-navigation" aria-label="Agent navigation">{([["Dashboard", "/agents", Grid2X2], ["Feeds", "/agents/feed", Newspaper], ["Wallet", "/agents/wallet", Wallet], ["Profile", "/agents/profile", User], ["Settings", "/agents/settings", Settings]] as const).map(([label, path, Icon]) => <Link key={label} to={path} aria-current={pathname === path ? "page" : undefined}><Icon size={22} /><span>{label}</span></Link>)}</nav>; }
