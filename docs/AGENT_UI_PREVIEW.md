# Agent UI preview

The website implementation lives in JOSCITY/src, independently of the Expo app.

Entry points:
- /welcome: Personal, Business, Agent.
- /agent-form: shared personal signup fields, service choices, agent bio and categories. Preview submission never invokes registration APIs.
- /signin?type=agent: third login choice, preview-only. No agent authentication request is sent.
- Account Actions on the existing personal/business profile: Switch account chooser.
- Existing feed sidebar below News and Forums: Help me buy, Help me deliver, Agents, Agent dashboard.

Agent routes: /agents, /agents/feed, /agents/wallet, /agents/profile, /agents/notifications. The Feeds route reuses the existing community feed and login guard; agent notifications stay separate and empty until backend support exists.

Customer routes: /agent-services/request?service=buy, /agent-services/request?service=deliver, /agent-services/directory. Request images are local previews, maximum three; direct requests preserve the chosen recipient. My preview requests links show progress and sample notification copy. No push is dispatched.

Dashboard includes earnings cards/chart, request details with View/Decline/Accept, Active/Completed jobs, five sequential status steps and public handoff to Help me buy agents as specified. Agent availability preserves directory ranking. Profile supports photo selection, name/contact/bio/category/service editing and the purple badge. Wallet includes sample earnings, escrow, rewards and activity. All agent state resets on reload.

Validation: npm run build; node --test tests/agent-ui.test.cjs. The running localhost:5173 server was checked for the updated entry modules. Browser automation was unavailable; rendered browser/device QA remains necessary.

Agent settings: `/agents/settings`, linked from Profile and the website sidebar. Editing, availability and notification preferences use session preview state. Appearance uses the existing website theme. Website navigation uses a desktop sidebar, responsive top links and inline navigation above the shared feed.
