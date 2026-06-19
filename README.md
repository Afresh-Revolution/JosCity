# JosCity — Complete Platform Documentation

**Jos Smart City Platform**  
A digital ecosystem connecting residents, businesses, and visitors in Jos, Plateau State, Nigeria.

This document describes every major aspect of the JosCity website: what it is, how it is built, what features exist today, how security works, how the user experience is designed, and where development is headed. It covers both the frontend application in this repository and the backend services that power it.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Vision and Mission](#2-vision-and-mission)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [User Types and Access Levels](#5-user-types-and-access-levels)
6. [Public Website (Marketing and Legal)](#6-public-website-marketing-and-legal)
7. [Authentication and Onboarding](#7-authentication-and-onboarding)
8. [News Feed and Social Features](#8-news-feed-and-social-features)
9. [People and Connections](#9-people-and-connections)
10. [Real-Time Chat](#10-real-time-chat)
11. [Stories and Reels](#11-stories-and-reels)
12. [Forums](#12-forums)
13. [News Articles](#13-news-articles)
14. [Events and Ticketing](#14-events-and-ticketing)
15. [Marketplace](#15-marketplace)
16. [User Profiles](#16-user-profiles)
17. [Admin Console](#17-admin-console)
18. [Progressive Web App (PWA)](#18-progressive-web-app-pwa)
19. [Backend Services](#19-backend-services)
20. [Database and Data Model](#20-database-and-data-model)
21. [External Integrations](#21-external-integrations)
22. [Security](#22-security)
23. [User Interface and User Experience](#23-user-interface-and-user-experience)
24. [Deployment and Hosting](#24-deployment-and-hosting)
25. [Development Setup](#25-development-setup)
26. [Feature Maturity and Progress](#26-feature-maturity-and-progress)
27. [Roadmap](#27-roadmap)
28. [Known Gaps and Limitations](#28-known-gaps-and-limitations)
29. [Contact and Legal](#29-contact-and-legal)

---

## 1. Overview

JosCity is a full-featured smart city platform that combines:

- A **public marketing website** for discovery, registration, and information
- A **social networking experience** centered on a news feed (posts, stories, reels, chat)
- A **business marketplace** where vendors list products and consumers purchase them
- An **events platform** with local event creation and external ticketing via Gatewav
- **Community tools** including forums, news articles, and people discovery
- A **comprehensive admin console** for moderation, content management, and platform operations

The frontend is a React single-page application (SPA) built with Vite and TypeScript. It is installable as a Progressive Web App (PWA) and works across desktop, tablet, and mobile browsers.

The backend is **not included in this repository**. It runs as separate Node.js/Express services (primarily the **New_Joscity** project on port 3000, with a forums and marketplace microservice on port 3001). This frontend communicates with those services through REST APIs and Socket.IO for real-time chat.

Production deployments reference hosts such as `joscity-com.onrender.com` (frontend) and `new-joscity.onrender.com` (API).

---

## 2. Vision and Mission

**Vision:** Transform Jos into a connected smart city where residents, businesses, and visitors interact through one integrated digital platform.

**Mission:** Provide a secure, accessible platform that empowers local businesses, rewards community engagement, and simplifies access to city services and local commerce.

**Long-term platform goals** (documented in product vision, not all live yet):

- CBC (City Business Coin) as a unified digital currency
- RFID membership cards for in-person identification and payments
- Points and rewards tied to social and commercial activity
- Hospital and healthcare integration
- Municipal bill payments and service requests
- Government service integrations

---

## 3. System Architecture

The platform is split into three logical layers:

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│         React SPA + PWA + Service Worker                 │
│              (this repository — JOSCITY)                 │
└───────────────────────┬─────────────────────────────────┘
                        │  HTTPS / REST / WebSocket
          ┌─────────────┴─────────────┐
          ▼
┌─────────────────────┐   ┌─────────────────────────┐
│   Main API Server   │   │  Forums + Marketplace   │
│   (New_Joscity)     │   │  Microservice             │
│   Port 3000         │   │  Port 3001                │
│                     │   │                           │
│  Auth, Feed, Chat,  │   │  /api/forums              │
│  Events, Admin,     │   │  /api/marketplace         │
│  Users, News, etc.  │   │                           │
└──────────┬──────────┘   └────────────┬──────────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              │   (primary DB)  │
              └─────────────────┘
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
      Cloudinary    SMTP Email   Gatewav Ticketing
      (images)     (Nodemailer)  (external events)
```

**In development**, the Vite dev server (port 5173) proxies API requests:

- `/api` and `/socket.io` → main API (default `localhost:3000`)
- `/api/forums`, `/api/admin/forums`, `/api/marketplace` → microservice (default `localhost:3001`)

**In production**, the frontend is a static build served from CDN/hosting; the browser calls the API directly using the configured base URL.

---

## 4. Technology Stack

### Frontend (this repository)

| Layer | Technology |
|-------|------------|
| UI framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 5 |
| Routing | React Router DOM 7 |
| Styling | SCSS with CSS custom properties (light/dark themes) |
| Icons | Lucide React |
| Animation | Framer Motion (theme toggle, marketplace cards) |
| Real-time | Socket.IO client |
| PWA | vite-plugin-pwa + custom service worker |
| State | Local React state, hooks, and browser localStorage (no Redux or React Query) |

### Backend (external repositories)

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript (JosCity-Backend) / JavaScript (New_Joscity) |
| Database | PostgreSQL (primary); MySQL also supported per docs |
| Authentication | JWT (JSON Web Tokens) |
| Password hashing | bcryptjs |
| Email | Nodemailer (SMTP) |
| File storage | Cloudinary (profile pictures and media) |
| Real-time | Socket.IO server |

---

## 5. User Types and Access Levels

### Personal accounts

Individual residents and consumers. They can:

- Browse and interact with the news feed
- Connect with other users (friend requests, chat)
- Purchase from the marketplace (cart and checkout)
- Attend and register interest in events
- Join forums, post reels, save content, and manage their profile

### Business accounts

Registered vendors and organizations. They can:

- Everything personal accounts can do, plus:
- Create marketplace listings and manage orders
- Create and manage events (including payment request workflows)
- Post to the business feed channel
- Access seller-specific marketplace views ("My Offers")

Business registration requires additional fields such as business name, CAC number, business type, and location.

### Admin accounts

Platform operators with a separate login at `/admin/login`. Admins use a distinct JWT (`adminToken`) and have access to the full admin console: user approval, content moderation, landing page CMS, wallet/points/ads management, and more.

### Account lifecycle states

| State | Meaning |
|-------|---------|
| Pending | Registered but awaiting admin approval |
| Approved | Full platform access granted |
| Rejected | Registration denied |
| Activated | Login activation code verified |
| Banned | Account suspended by admin |
| Verified | Identity or business verification badge |

New users must typically pass **admin approval** and **email activation** before full access is granted.

---

## 6. Public Website (Marketing and Legal)

### Landing page (`/`)

The homepage is a multi-section marketing site:

- **Navigation bar** — Links to key sections; theme toggle on desktop; mobile hamburger menu
- **Hero section** — Rotating slides (CMS-managed via admin); citizen registration count; call-to-action buttons
- **Admin broadcast strip** — Public notifications shown to all visitors (from admin notification system)
- **Services section** — Overview of platform capabilities
- **Events preview** — Upcoming public events from the API
- **Pricing section** — Membership tier information (Bronze through Platinum)
- **Guidelines section** — Community rules and expectations
- **Contact section** — Contact form and information
- **Footer** — Links to legal pages and social/contact details

Content on the landing page is largely editable through the admin **Pages Control Panel** without redeploying code.

### Other public pages

| Page | Route | Purpose |
|------|-------|---------|
| Welcome | `/welcome` | Branded onboarding introduction |
| About | `/about` | Platform information |
| Contact | `/contact` | Dedicated contact page |
| Coming Soon | `/coming-soon` | General placeholder |
| Services Coming Soon | `/services-coming-soon` | Municipal services placeholder |
| Success | `/success` | Post-registration confirmation |

### Legal and policy pages

| Page | Route |
|------|-------|
| Privacy Policy | `/privacy-policy` |
| Terms of Service | `/terms-of-service` |
| Cookie Policy | `/cookie-policy` |
| Accessibility Statement | `/accessibility` |

### Maintenance mode

When `VITE_MAINTENANCE_MODE=true`, every route displays a maintenance page instead of the normal application. Useful during deployments or scheduled downtime.

---

## 7. Authentication and Onboarding

### Registration

Two registration paths share the same form component with different tabs:

- **Personal registration** (`/registernow`) — Name, email, phone, gender, NIN, address, password
- **Business registration** (`/business-form`) — All personal fields plus business name, CAC number, business type, and business location

Client-side validation enforces field formats before submission. On success, users are directed to the success page and await admin approval.

### Sign in (`/signin`)

Users choose between personal and business login. The flow includes:

- Email and password authentication
- **Activation code** — Required when the account needs re-activation; the system checks dynamically whether a code is needed
- **Resend activation** — Rate-limited OTP resend to email
- **Forgot password** — Email OTP → confirm code → set new password

On successful login, a JWT and user object are stored in the browser. The user is typically redirected to the news feed.

### Session management

- Tokens are stored in `localStorage` under `token` or `authToken`
- User profile data is stored in `localStorage` under `user`
- Protected routes check for both token and user object before granting access
- Unauthenticated users are redirected to `/signin`
- Each device maintains its own session; the backend identifies users by user ID so data syncs across devices when logged in with the same account

---

## 8. News Feed and Social Features

The news feed (`/newsfeed`) is the core product experience.

### Layout

- **Header** — Search, notifications, chat, create actions, profile access; hides on scroll down for more content space
- **Left sidebar** — Navigation to all platform modules (Explore menu)
- **Main column** — Feed content, stories bar, create-post input
- **Right aside** — Trending hashtags, suggested friends, trending content
- **Mobile** — Sidebars collapse into slide-out drawers with overlay

### Feed content

Users see posts from connections and the broader community. The feed supports:

- **Text posts** with optional images and videos
- **Hashtag filtering** — Click or search hashtags to filter posts
- **Search** — Find people, hashtags, and posts
- **Business channel** — Separate feed filter for business-authored content (`/business`)
- **Trending hashtags** — Popular tags surfaced in the right panel

### Post interactions

| Action | Description |
|--------|-------------|
| Reactions | Like, love, and other reaction types |
| Comments | Threaded comments with replies |
| Shares | Share posts within the platform |
| Save / Unsave | Bookmark posts for later (`/saved`) |
| Pin | Pin own posts to profile feed top |
| Edit / Delete | Modify or remove own posts |
| View count | Track post views |

### Creating content

- **Post modal** — Text, photos, videos; business users can embed marketplace listing details
- **Story popup** — Temporary story content (24-hour style)
- **Reel modal** — Short-form video content
- **Scheduled posts** (`/scheduled`) — Schedule posts for future publication with date/time picker

### Notifications

- In-app notification panel with read/unread states
- Browser notifications with optional sound
- Web Push subscription support (requires VAPID key and backend push endpoint)
- Notification types include reactions, comments, friend requests, chat messages, and admin broadcasts

---

## 9. People and Connections

The People module (`/people`) helps users discover and connect with others.

### Sub-routes (same component, different views)

| Route | Purpose |
|-------|---------|
| `/people` | Discover users; nearby users based on location |
| `/request` | Incoming friend requests |
| `/sent-requests` | Outgoing pending requests |
| `/my-friends` | Current friends list |

### Features

- **Friend requests** — Send, accept, reject, or cancel
- **Unfriend** — Remove existing connections
- **Nearby users** — Location-based discovery with configurable range (default coordinates near Lagos; stored in localStorage)
- **User search** — Search approved users by name
- **Suggested friends** — Recommendations in the news feed aside
- **Approved directory** — Paginated list of approved platform members

---

## 10. Real-Time Chat

Chat is integrated into the news feed header and available across authenticated pages.

### Capabilities

- **Direct messages** — One-to-one conversations
- **Group chats** — Create groups, add/remove members, leave groups
- **Real-time delivery** — Socket.IO for instant message delivery
- **Typing indicators** — See when someone is typing
- **Read receipts** — Mark conversations as read; unread count badge
- **Presence** — Online/offline status and last seen timestamps
- **Message editing and deletion** — Edit or remove sent messages
- **Admin notifications** — Platform-wide alerts delivered via socket

Chat state refreshes automatically when friendships change (unfriend triggers UI refresh).

---

## 11. Stories and Reels

### Stories

- Create stories with image or video media
- View stories in a full-screen story viewer
- Story reactions and view tracking
- Stories expire (time-limited content model)
- View who has seen your stories

### Reels (`/reels`)

Short-form vertical video content:

- Paginated reel feed with categories and sorting (recent, views, trending)
- Create reels with video upload and optional thumbnail
- Full-screen reel viewer with comments
- Save/unsave reels; mark interested/not interested
- Report inappropriate reels
- Local cache in localStorage for faster reload
- Remix and sequence features marked as coming soon in the UI

---

## 12. Forums

Forums (`/forums`) run on a dedicated microservice (port 3001 in development).

### User capabilities

- **Discover** public forums
- **Create** forums (public or invite-only)
- **Join** via public listing or invite token
- **Post messages** in forum threads
- **Manage members** — Roles (admin/member), posting permissions, remove members
- **Forum settings** — Locking replies, regenerate invite links
- **Leave** forums

### Admin oversight

Admins can view, suspend, and delete forums through the admin console.

---

## 13. News Articles

The News section (`/news`) displays published articles managed by admins.

- Public read access to published articles
- Search within articles
- Deep linking via `?article=id` query parameter (scrolls to and highlights article)
- Featured article support
- Admin creates articles with rich text, images, and videos via multipart upload

---

## 14. Events and Ticketing

### Events page (`/events`)

A full events management and discovery experience:

**For all users:**
- Browse events with search and category filters
- View event details: title, description, date, location, cover image, capacity, price
- Mark **Going** or **Interested**
- Share events via share button

**For business/organizer users:**
- Create, edit, and delete own events
- Set event price in Naira
- Manage **payment requests** — Attendees submit bank transfer proof; organizers accept or reject
- View incoming customer payment requests

### Gatewav (external ticketing) integration

Events from the Gatewav/Ticketing platform are merged into the events list:

- External events show a **Gatewav badge** and **Buy tickets** button
- Ticket links open the Gatewav site in a new tab
- Edit, delete, going, and interested actions are hidden for external events
- Ticket sold/capacity counts display when the external feed provides them

The backend fetches from Gatewav APIs and merges results with locally created events, sorted by date.

### Legacy events page

`/events-old` retains an older landing-style events section for reference.

---

## 15. Marketplace

The marketplace (`/marketplace`) connects business sellers with personal consumers.

### Tabs

| Tab | Who | Purpose |
|-----|-----|---------|
| Market | All users | Browse and search product listings |
| My Offers | Business users | Create, edit, delete own listings |
| Cart | Personal consumers | Manage cart and checkout |

### Seller workflow

1. Business user creates a listing with title, description, price, category, and images
2. Listing appears in the public market browse view
3. Seller manages inventory through My Offers tab

### Buyer workflow

1. Personal consumer browses listings with search and category filters
2. Adds items to cart with quantity control
3. Checks out with delivery address details
4. Order placed through the marketplace API

### Media

Product images are uploaded through a dedicated marketplace media upload endpoint on the microservice.

---

## 16. User Profiles

Profiles are accessible at `/profile/:username`.

### Viewing

- Display name, username, member ID, bio, profile and cover photos
- Account type indicator (personal vs business)
- Business-specific fields (business name, type, location) for business accounts

### Editing (own profile)

- Update personal or business information
- Upload profile picture (stored via Cloudinary through the API)
- Theme toggle available on profile page

### Session

- Logout with confirmation modal
- Profile picture cached in localStorage for fast avatar display across the app

---

## 17. Admin Console

Admins log in at `/admin/login` and access the dashboard at `/admin`.

### Dashboard

- Platform statistics overview
- Pending registration count and quick actions

### User management

- View all users with search and filters
- Approve or reject pending registrations (with email notification)
- Ban, unban, verify users
- Assign user groups
- Delete accounts

### Content moderation

- **Posts** — Review, approve pre-moderated posts, delete violating content
- **Pages** — Manage social page entities; verify or delete
- **Groups** — View and delete groups
- **Forums** — Suspend or delete forums
- **Events** — Full CRUD on all events
- **Reports** — Review user-submitted reports; mark seen; delete

### Verification queue

- Review identity and business verification requests
- Approve or reject with admin action

### Monetization and payments

| Module | Purpose |
|--------|---------|
| Wallet | Approve/reject wallet payment requests |
| Points | Manage points payments and user balances |
| Affiliates | Affiliate payment approvals and statistics |
| Pro | Subscription package CRUD and subscriber list |
| Ads | User-submitted ads and system-wide ad management |
| Market | Marketplace product and order oversight |
| Funding | Funding request management |
| Monetization | General monetization payment tracking |

### Platform settings

- General platform configuration
- Registration settings (activation requirements, approval flow)

### Notifications

- Create broadcast notifications to all users or landing page visitors
- Set expiration, global scope, and landing page visibility

### News CMS

- Create, edit, delete news articles with image and video attachments

### Landing page CMS (Pages Control Panel)

A large in-admin editor for public website content:

- Navbar menu items and settings
- Hero slides (images, titles, subtitles, links)
- Services section content
- Events page settings
- Pricing plans and features
- Contact information
- Footer links and content

Changes made here update what visitors see on the public landing page without code changes.

---

## 18. Progressive Web App (PWA)

JosCity is installable as a PWA on supported browsers and devices.

### Install experience

- **Android/Desktop Chrome** — Native install prompt captured and offered to users
- **iOS** — Manual "Add to Home Screen" instructions provided
- App icons generated from the primary logo on each build

### Offline and updates

- Service worker precaches essential assets in production
- Hourly check for new versions
- **"New version available"** badge prompts users to reload for updates

### Mobile enhancements

- **Pull-to-refresh** on touch devices
- Standalone display mode (app-like, no browser chrome)
- Portrait-primary orientation lock in manifest

### Push notifications

Infrastructure exists for Web Push (VAPID public key via environment variable). Full end-to-end push delivery requires backend subscription storage and a push sender — partially wired on the frontend.

---

## 19. Backend Services

> **Note:** Backend source code lives in separate repositories (**New_Joscity**, **JosCity-Backend**), not in this frontend repo. The following describes the backend as consumed by this application.

### Main API server (port 3000)

Handles the majority of platform operations:

**Authentication** — Personal and business signup/login, activation codes, password reset OTP flow, profile management

**Feed and posts** — Create/read/update/delete posts, reactions, comments, shares, saves, scheduled posts, trending hashtags, hashtag search, pin/edit/delete

**Stories** — CRUD, views, reactions

**Reels** — List, create, view tracking, save, preferences, reports

**Friends** — Request, accept, reject, cancel, list, unfriend, status check

**Notifications** — User notifications CRUD; public landing broadcast endpoint

**Events** — Public and authenticated event CRUD; payment request workflow; Gatewav merge

**Chat** — Conversations, messages, groups, read state, presence, unread counts

**Users** — Nearby search, approved directory, profile update, trending hashtags, citizen count

**News** — Public published articles; admin CRUD

**Admin** — Full admin API (dashboard, users, posts, pages, groups, forums, events, reports, verification, settings, wallet, ads, pro, affiliates, points, market, funding, monetization, notifications)

**Profile** — Get/update profile; profile picture upload to Cloudinary

### Forums and marketplace microservice (port 3001)

Separate Express service for:

- All `/api/forums/*` routes (discover, create, join, messages, members, settings, invites)
- All `/api/marketplace/*` routes (listings, cart, checkout, media upload)

### Real-time layer

Socket.IO attached to the main API server handles:

- Chat message delivery, edits, deletions
- Typing indicators
- Read receipts
- Presence (online/offline, last seen)
- Admin notification broadcasts

### API conventions

- Base path: `/api`
- Authentication: `Authorization: Bearer <JWT>` header
- Admin routes: separate admin JWT
- Responses: JSON with `success`, `data`, and `message` fields
- File uploads: multipart form data (Multer-style on backend)
- Timeouts: frontend enforces 20–45 second request timeouts

---

## 20. Database and Data Model

The backend uses **PostgreSQL** as the primary database (MySQL also documented as supported).

### Core entities

| Entity | Key concepts |
|--------|-------------|
| **Users** | Personal and business profiles, account status, activation, ban, verification, groups, last seen |
| **Posts** | Text, media, type, pin state, share count, hidden flag, feed channel |
| **Comments** | Threaded with parent references, soft delete |
| **Stories** | Media, expiry, view and reaction tracking |
| **Events** | Title, description, category, date, location, cover, capacity, price, payment bank details |
| **Friendships** | Request/sent/received status, friend lists |
| **Notifications** | Action, node reference, read state, global/landing flags, expiration |
| **Chat** | Conversations (direct/group), messages, participants, read state |
| **Forums** | Forum metadata, members, roles, messages, invite tokens |
| **Marketplace** | Listings, cart items, orders, seller bank details |
| **News** | Admin articles with images and videos |
| **Reports** | User-submitted content reports |
| **Monetization** | Wallet, points, affiliates, ads, pro packages, funding tables |

Account approval gates exist at the database/API level — for example, only approved accounts can comment on posts.

---

## 21. External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Cloudinary** | Profile picture and media storage | Active |
| **Nodemailer (SMTP)** | Activation emails, password reset OTP, approval notifications | Active |
| **Gatewav / Ticketing** | External event feed and ticket purchase links | Active |
| **Web Push (VAPID)** | Browser push notifications | Partially wired |
| **Firebase** | Listed in dependencies | Not used in current codebase |
| **Render** | Hosting for frontend and API | Production deployment |

---

## 22. Security

This section describes security measures honestly — distinguishing what is implemented from what is planned or documented as vision.

### Authentication security (implemented)

| Measure | Detail |
|---------|--------|
| Password hashing | bcrypt on backend |
| JWT tokens | Separate tokens for users and admins; admin tokens refreshable |
| Activation codes | Email OTP required at login when account needs activation |
| Account approval | Admin must approve registrations before full access |
| Password reset | OTP-based (not magic links); confirm then reset flow |
| Session check | Protected routes verify token + user object client-side; API verifies JWT server-side |
| Ownership checks | Users can only edit/delete own posts and comments; API enforces on server |

### Transport and header security (implemented)

| Measure | Where |
|---------|-------|
| HTTPS | Production URLs use HTTPS |
| HSTS | Strict-Transport-Security header on Vercel deployment (1 year, includeSubDomains, preload) |
| X-Content-Type-Options | nosniff — dev, preview, and production |
| X-Frame-Options | SAMEORIGIN — prevents clickjacking |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Restricts camera, microphone, geolocation, payment to same origin |
| Cross-Origin-Opener-Policy | same-origin-allow-popups |

### Input validation (implemented)

- Client-side validation schemas for registration and forms
- Server-side validation expected on backend (parameterized SQL queries used per controller evidence)
- Request timeouts prevent hung connections

### Content security (partially implemented)

| Measure | Status |
|---------|--------|
| User reporting | Implemented — users can report content; admin reviews in Reports module |
| Admin moderation | Implemented — posts, forums, users, events |
| Automated content filtering | Planned/vision — not confirmed in current codebase |
| Pre-moderation flags | Implemented for admin post review |

### Security considerations and gaps

| Topic | Assessment |
|-------|------------|
| Token storage | JWT stored in localStorage — standard SPA pattern but vulnerable to XSS; httpOnly cookies not used |
| Rate limiting | Mentioned in docs for external APIs; not verifiable in frontend repo |
| CORS | Handled on backend; dev uses Vite proxy to avoid CORS during development |
| Optional inspect blocking | `VITE_PREVENT_INSPECT` can discourage browser devtools (client-side only, not true security) |
| 2FA | Documented as optional/planned — not confirmed as live user feature |
| Database encryption at rest | Documented in vision — depends on hosting provider |
| AI content moderation | Vision document — not implemented in frontend |

**Overall security level:** The platform implements **standard web application security** for an SPA + JWT architecture: HTTPS, security headers, password hashing, JWT auth, role separation, account approval, and admin moderation. It does **not** currently implement advanced measures like httpOnly cookie sessions, mandatory 2FA, or automated AI moderation. Security posture is appropriate for a community platform in active development, with room to harden before handling high-value financial transactions at scale.

---

## 23. User Interface and User Experience

### Design system

- **Primary brand color:** Green (`#34b86a`)
- **Typography:** Arimo font family
- **Themes:** Light and dark mode with CSS custom properties; default is dark when no preference is saved
- **Icons:** Lucide React icon set throughout
- **Spacing and layout:** Feature-scoped SCSS modules per page/section

### Theme behavior

- Theme preference persisted in localStorage
- Toggle available on landing page (desktop navbar; mobile in hamburger menu) and user profile
- Draggable floating dark mode toggle (Framer Motion) with saved position
- All major pages respect `[data-theme="dark"]` and light mode variables

### Responsive design

- Mobile-first breakpoints at approximately 480px, 768px, and 992px
- News feed sidebars become slide-out drawers on mobile with backdrop overlay
- Header auto-hides on scroll down to maximize content area
- Landing page sections stack vertically on small screens
- PWA standalone mode optimized for mobile portrait

### Interaction patterns

- **Modals** for create/edit flows (posts, stories, reels, events, marketplace listings, forums)
- **Confirmation modals** for destructive actions (delete, logout, unfriend)
- **Lazy loading** for images (`LazyImage` component)
- **Image compression** before upload to reduce payload size
- **Scroll animations** on landing page sections
- **Pull-to-refresh** on PWA touch devices
- **Emoji picker** in forums and chat contexts
- **Avatar component** with fallback initials

### Accessibility

- Dedicated accessibility statement page (`/accessibility`)
- Keyboard navigation supported in standard HTML form controls
- Theme contrast options via dark/light modes
- Full WCAG 2.1 compliance is stated as a goal in vision docs; formal audit status not documented

### Performance considerations

- Code splitting via Vite's dynamic imports where applicable
- Reels feed cached in localStorage
- Service worker precaching for PWA assets
- API request timeouts to prevent indefinite loading states
- Image preloading utilities for hero and critical assets

---

## 24. Deployment and Hosting

### Frontend

| Platform | Config file | Notes |
|----------|-------------|-------|
| Vercel | `vercel.json` | Static build with security headers |
| Render | `render.yaml` | Static site from `dist/` |
| Netlify | `netlify.toml` | Alternative deployment |

Build command: `npm run build` (compiles SCSS, TypeScript, Vite production bundle, copies PWA icons)

### Backend

Deployed separately (referenced: `new-joscity.onrender.com`). Requires its own environment configuration for database, JWT, SMTP, Cloudinary, and Gatewav API keys.

### Environment variables (frontend)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` / `VITE_API_URL` / `VITE_BASE_URL` | API root URL |
| `VITE_SOCKET_PATH` | Socket.IO path |
| `VITE_MAINTENANCE_MODE` | Enable maintenance page |
| `VITE_VAPID_PUBLIC_KEY` | Web Push public key |
| `VITE_PREVENT_INSPECT` | Block devtools shortcuts |
| `VITE_API_TARGET` | Dev proxy target for main API |
| `VITE_FORUMS_API_TARGET` | Dev proxy for forums service |
| `VITE_MARKETPLACE_API_TARGET` | Dev proxy for marketplace service |

### Environment variables (backend — external repo)

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port |
| `DATABASE_URL` | PostgreSQL connection |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | MySQL alternative |
| `JWT_SECRET` | Token signing key |
| `SMTP_*` | Email delivery |
| `TICKETING_*` | Gatewav integration URLs and API key |
| Cloudinary credentials | Media upload (exact var names in backend repo) |

---

## 25. Development Setup

### Prerequisites

- Node.js 14 or higher
- npm
- Running backend services (New_Joscity on port 3000; forums/marketplace on port 3001)
- PostgreSQL database configured in backend

### Frontend

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Compile SCSS only
npm run build:main-css
```

### Backend (separate repository)

```bash
cd New_Joscity   # or JosCity-Backend
npm install
# Configure .env with database, JWT, SMTP, etc.
npm run dev      # Development with hot reload
npm run build && npm start   # Production
```

Point frontend at local API by default (Vite proxy handles this in dev) or set `VITE_API_BASE_URL` for production builds.

---

## 26. Feature Maturity and Progress

### Fully implemented and live

| Feature | Maturity |
|---------|----------|
| Landing page with CMS | High |
| Personal and business registration | High |
| Sign in with activation and password reset | High |
| News feed (posts, reactions, comments, shares) | High |
| Stories | High |
| Reels | High |
| Real-time chat | High |
| Friend system and people discovery | High |
| Forums | High |
| News articles | High |
| Events (create, browse, payment requests) | High |
| Gatewav ticketing integration | High |
| Marketplace (listings, cart, checkout) | High |
| Scheduled and saved posts | High |
| Business feed channel | High |
| User profiles | High |
| Admin console (broad surface) | High |
| PWA install and update | High |
| Light/dark themes | High |
| Legal pages | High |

### Partially implemented or placeholder

| Feature | Status |
|---------|--------|
| Web Push notifications | Frontend subscription code exists; backend push sender not fully wired |
| Jobs (`/jobs`) | Route shows "Coming Soon" placeholder; full `Jobs.tsx` page exists but uses localStorage mock data, not routed |
| Offers (`/offers`) | Route shows placeholder; full page built but not connected |
| Movies (`/movies`) | Route shows placeholder; page component exists but not connected |
| Courses | Page component exists; no route |
| Reel remix/sequence | UI shows "coming soon" |
| Admin ads create modal | TODO in code |
| CBC coin / digital wallet (user-facing) | Admin wallet UI exists; end-user wallet not exposed as main feature |
| RFID cards | Documented in vision; not in frontend |
| Hospital integration | Documented as Phase 2; not in frontend |
| Municipal bill payments | Marketing copy; `/services-coming-soon` placeholder |
| Firebase | Dependency installed; zero usage in source |
| Axios | Dependency installed; app uses native fetch |

### Vision vs reality

The `aboutjoscity.md` vision document describes CBC currency, RFID cards, points multipliers, hospital integration, and municipal services in detail. These represent **product goals**. The **currently shipped application** focuses on social networking, marketplace, events, forums, and admin operations. Monetization admin modules (wallet, points, affiliates, pro) have admin UI and API endpoints, but the full end-user wallet and points economy described in vision docs is not yet a primary user-facing experience.

---

## 27. Roadmap

### Phase 1 — Complete

- User registration and authentication (personal and business)
- Business marketplace
- Social networking (feed, stories, chat, friends)
- Event management with external ticketing
- Pricing and membership presentation
- Admin panel and landing page CMS

### Phase 2 — In Progress

- Hospital and healthcare integration
- Enhanced RFID card features
- Expanded points and rewards system (user-facing)
- Native mobile app development
- Jobs, Offers, Movies modules (pages built; routing and backend pending)

### Phase 3 — Planned

- Advanced analytics dashboard
- AI-powered recommendations
- Government service integrations
- International payment gateway support
- Full CBC digital currency rollout
- Automated content moderation

---

## 28. Known Gaps and Limitations

1. **Backend not in this repo** — Full backend audit requires the New_Joscity or JosCity-Backend repository.
2. **Token in localStorage** — XSS risk; consider httpOnly cookies for production hardening.
3. **Placeholder routes** — Jobs, Offers, and Movies show coming-soon UI despite substantial page implementations existing off-route.
4. **Vision features** — CBC, RFID, hospital, and municipal services are documented but not user-accessible.
5. **Unused dependencies** — Firebase and Axios are installed but unused.
6. **No `.env.example`** — Environment variables are documented here but no template file is committed.
7. **Duplicate components** — Some components (e.g., PostCard) exist in multiple locations.
8. **Location default** — Nearby features default to Lagos coordinates unless user location is set.

---

## 29. Contact and Legal

**Support email:** support@joscity.com  
**Phone:** +234 7067621916  
**Location:** Jos, Plateau State, Nigeria

**Legal pages (in application):**

- [Privacy Policy](/privacy-policy)
- [Terms of Service](/terms-of-service)
- [Cookie Policy](/cookie-policy)
- [Accessibility Statement](/accessibility)

---

## Related Documentation

| Document | Location | Contents |
|----------|----------|----------|
| Route reference | `ROUTES.md` | All frontend routes |
| Product vision | `aboutjoscity.md` | Detailed feature vision and security goals |
| Gatewav integration | `docs/TICKETING_GATEWAV_INTEGRATION.md` | External ticketing setup |
| External events API | `docs/EXTERNAL_EVENTS_API.md` | Push integration for external events |
| Backend endpoints | `BACKEND_NEW_ENDPOINTS.md` | Notification and post action API contract |
| API base URL guide | `VITE_BASE_URL_GUIDE.md` | Environment URL configuration |

---

**Last updated:** May 2026  
**Repository:** Frontend SPA (React + Vite + TypeScript)  
**Backend:** New_Joscity / JosCity-Backend (separate repositories)

*JosCity — Connecting Jos, Empowering Community, Building the Future*
