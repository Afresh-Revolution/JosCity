# JOSCITY ↔ Ticketing (Gatewav) integration

This document describes how **JOSCITY** and the **Ticketing platform (Gatewav)** integrate so that Ticketing events appear on JOSCITY’s Events page with links to buy tickets on the Ticketing site.

---

## Table of contents

1. [Overview](#1-overview)
2. [Ticketing platform: what to provide](#2-ticketing-platform-what-to-provide)
3. [JOSCITY: what it does](#3-joscity-what-it-does)
4. [Data contract](#4-data-contract)
5. [Environment variables (JOSCITY)](#5-environment-variables-joscity)
6. [CORS and network](#6-cors-and-network)
7. [Troubleshooting](#7-troubleshooting)
8. [Quick reference](#8-quick-reference)

---

## 1. Overview

| Role | Responsibility |
|------|----------------|
| **Ticketing backend** | Exposes a **feed endpoint** that returns a list of events in a defined JSON shape. Optionally exposes a **raw events** endpoint so JOSCITY can resolve event UUIDs for “Buy tickets” links. |
| **JOSCITY backend** | Calls the Ticketing feed (and raw events) on each `GET /api/events` request, merges external events with JOSCITY’s own events, and returns a combined list. |
| **JOSCITY frontend** | Shows all events (JOSCITY + Ticketing). For Ticketing events, shows a “Gatewav” badge and a “Buy tickets” link that opens the Ticketing site. |

Flow:

1. User opens JOSCITY Events page → frontend calls JOSCITY `GET /api/events`.
2. JOSCITY backend loads its own events from the DB, then calls the Ticketing feed (and raw events) and merges.
3. Response includes both; each Ticketing event has `source: "gatewav"` and `ticket_url` (link to Ticketing site).
4. Frontend renders “Buy tickets” for those events.

---

## 2. Ticketing platform: what to provide

### 2.1 Feed endpoint (required)

JOSCITY will call this URL to get the list of events to show.

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | e.g. `https://ticketing-back.onrender.com/api/events/feed/joscity` (or your chosen path) |
| **Query params** | None required |
| **Response** | JSON: either a **raw array** of event objects, or an object with a **`data`** or **`events`** array. |

**Event object shape** (each item in the array):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | number | Yes | Unique numeric ID (for display / matching). |
| `event_title` | string | Yes | Title. |
| `event_description` | string | No | Description (plain or HTML). |
| `event_category` | string | No | e.g. "Music", "Food", "Sport". |
| `event_date` | string | Yes | ISO 8601 datetime, e.g. `2025-03-01T18:00:00.000Z`. |
| `event_location` | string | No | Venue or address. |
| `event_cover` | string | No | Full URL to cover image. |
| `event_capacity` | number | No | Max attendees. Omit if 0. |
| `source` | string | Yes | Use `"gatewav"` so JOSCITY can label external events. |

**Example response (raw array):**

```json
[
  {
    "event_id": 123456789012,
    "event_title": "Live Concert",
    "event_description": "An amazing night of music.",
    "event_category": "Music",
    "event_date": "2025-03-15T19:00:00.000Z",
    "event_location": "Main Arena, Lagos",
    "event_cover": "https://example.com/cover.jpg",
    "event_capacity": 500,
    "source": "gatewav"
  }
]
```

**Example response (wrapped):**

```json
{
  "success": true,
  "data": [
    { "event_id": 1, "event_title": "...", "event_date": "...", "source": "gatewav", ... }
  ]
}
```

### 2.2 Raw events endpoint (for “Buy tickets” links)

To build a link like `https://gatewav.com/event/{uuid}`, JOSCITY needs the event **UUID** (`id`). The feed only provides numeric `event_id`, so JOSCITY calls a second endpoint to get a list of events that include `id` (string UUID).

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | e.g. `https://ticketing-back.onrender.com/api/events` |
| **Response** | JSON array (or object with `data`/`events`) where each event has at least `id` (string UUID), `title`, `date`. |

JOSCITY matches feed events to raw events by **title + date** and uses `id` for `ticket_url`. If this endpoint is missing or fails, Ticketing events still appear on JOSCITY but “Buy tickets” may have no link (or a fallback).

### 2.3 API key (optional)

If the Ticketing backend requires an API key for the feed (or raw events):

- JOSCITY sends it in **`X-API-Key`** and **`Authorization: Bearer <key>`**.
- JOSCITY reads the key from env: **`TICKETING_JOSCITY_API_KEY`**. If not set, no key is sent.
- If the key is wrong or missing and your API returns 401, JOSCITY will not receive events and will only return its own events.

### 2.4 CORS

Calls are made **from the JOSCITY backend (server)** to the Ticketing backend, so **CORS is not required** for this integration. If you later allow browser clients to call the Ticketing API directly, add JOSCITY’s origin to your CORS allowed origins.

---

## 3. JOSCITY: what it does

### 3.1 Backend (New_Joscity)

- On each **`GET /api/events`** request:
  1. Loads events from the JOSCITY database (same as before).
  2. Calls the **Ticketing feed URL** (see [§5](#5-environment-variables-joscity)). On 404/5xx or parse error, continues with no external events (no failure to the client).
  3. Optionally calls the **Ticketing raw events URL** to build a mapping `(title, date) → uuid`.
  4. For each feed event, sets `source: "gatewav"` and `ticket_url: "https://gatewav.com/event/{uuid}"` when a matching UUID is found; otherwise `ticket_url: null`.
  5. Merges DB events and Ticketing events, sorts by `event_date` (newest first), paginates, and returns the combined list.

- **Auth:** If `TICKETING_JOSCITY_API_KEY` is set, it is sent as `X-API-Key` and `Authorization: Bearer <key>` on both feed and raw requests.

### 3.2 Frontend

- Events page calls JOSCITY `GET /api/events` and displays all returned events.
- For events with **`source === "gatewav"`** and a **`ticket_url`**:
  - Shows a **“Gatewav”** badge.
  - Shows a **“Buy tickets”** button that opens `ticket_url` in a new tab.
  - Hides Edit/Delete and Going/Interested (those apply only to JOSCITY-created events).
- JOSCITY-created events keep Edit/Delete (for owner) and Going/Interested as before.

---

## 4. Data contract

### 4.1 Event object (from Ticketing feed)

Use the field names in the table in [§2.1](#21-feed-endpoint-required). JOSCITY maps them as-is; it also accepts a wrapped response with `data` or `events`.

### 4.2 Ticket link

- **Format:** `{TICKETING_FRONTEND_BASE}/event/{uuid}`
- **Example:** `https://gatewav.com/event/a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- **UUID:** Comes from the raw events endpoint (`id` field). If no raw endpoint or no match, `ticket_url` is `null`.

### 4.3 Categories

JOSCITY uses categories such as: Art, Crafts, Dance, Drinks, Films, Fitness, Food, Game, Party, Health, Sport, Literature, Music, Religion. Aligning Ticketing categories with these improves filtering on JOSCITY.

---

## 5. Environment variables (JOSCITY)

Set these in **New_Joscity** (e.g. `.env`). All are optional; defaults assume the Ticketing backend and Gatewav frontend.

| Variable | Default | Description |
|----------|---------|-------------|
| **TICKETING_FEED_URL** | `https://ticketing-back.onrender.com/api/events/feed/joscity` | Full URL of the Ticketing feed endpoint. |
| **TICKETING_EVENTS_URL** | `https://ticketing-back.onrender.com/api/events` | Full URL of the raw events endpoint (for UUIDs). |
| **TICKETING_FRONTEND_BASE** | `https://gatewav.com` | Base URL for “Buy tickets” links; final link is `{base}/event/{uuid}`. |
| **TICKETING_JOSCITY_API_KEY** | *(empty)* | If the Ticketing API requires an API key, set it here. Sent as `X-API-Key` and `Authorization: Bearer <key>`. |

---

## 6. CORS and network

- JOSCITY backend calls Ticketing from the **server**; CORS does not apply to these requests.
- Ensure the Ticketing backend is reachable from where JOSCITY runs (no firewall blocking outbound HTTPS to the Ticketing host).
- Timeouts: JOSCITY uses a 15s timeout per request; if the Ticketing API is slow, consider optimizing or caching on the Ticketing side.

---

## 7. Troubleshooting

### “Ticketing feed: 404 Not found”

- **Meaning:** The Ticketing backend returned 404 for the feed URL. JOSCITY still returns its own events; Ticketing events are omitted.
- **Ticketing side:** Implement and deploy the feed route (e.g. `GET /api/events/feed/joscity`) and return JSON as in [§2.1](#21-feed-endpoint-required).
- **JOSCITY side:** If your Ticketing API is at a different URL, set **TICKETING_FEED_URL** to that full URL.

### “Ticketing feed bad response: 401 …”

- **Meaning:** The Ticketing API rejected the request (e.g. missing or invalid API key).
- **JOSCITY side:** Set **TICKETING_JOSCITY_API_KEY** to the value expected by the Ticketing backend.
- **Ticketing side:** If you require a key, ensure JOSCITY’s key is allowed and that you accept `X-API-Key` or `Authorization: Bearer <key>`.

### “Ticketing feed fetch error: …”

- **Meaning:** Network error, timeout, or unexpected failure calling the Ticketing API.
- Check that the Ticketing backend is up and that **TICKETING_FEED_URL** and **TICKETING_EVENTS_URL** are correct. Ensure DNS and outbound HTTPS work from the JOSCITY server.

### Events show but “Buy tickets” does nothing or has no link

- **Meaning:** Feed works but UUID resolution failed (raw events endpoint missing, wrong URL, or no match by title+date).
- Ensure **TICKETING_EVENTS_URL** is correct and returns events with `id` (UUID), `title`, and `date`. JOSCITY matches by normalized title and date; small differences can prevent a match.

---

## 8. Quick reference

| Topic | Value |
|-------|--------|
| **Feed URL** | `GET` **TICKETING_FEED_URL** (default: `.../api/events/feed/joscity`) |
| **Raw events URL** | `GET` **TICKETING_EVENTS_URL** (default: `.../api/events`) |
| **Ticket link** | **TICKETING_FRONTEND_BASE** + `/event/` + `{uuid}` |
| **Source identifier** | `source: "gatewav"` |
| **Auth** | Optional: `X-API-Key` and `Authorization: Bearer <key>` from **TICKETING_JOSCITY_API_KEY** |
| **JOSCITY endpoint** | `GET /api/events` (returns merged JOSCITY + Ticketing events) |

---

*Last updated for the JOSCITY ↔ Ticketing (Gatewav) integration.*
