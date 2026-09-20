import { Link } from "react-router-dom";
import NewsFeed from "./NewsFeed/NewsFeed";
import AgentBottomNav from "../components/AgentBottomNav";
import { isAuthenticated } from "../utils/userUtils";
export default function AgentFeed() { return <div className="agent-feed-page">{isAuthenticated() ? <NewsFeed agentMode /> : <div className="agent-preview"><main><AgentBottomNav /><h1>One city. One community.</h1><p>Agents use the same JOSCITY feed. Sign in with an existing account to see community posts.</p><Link to="/signin" state={{ redirectTo: "/agents/feed" }}>Sign in to view the feed</Link></main></div>}</div>; }
