# Ticketing (Gatewav) integration – JOSCITY implementation

JOSCITY fetches events from the Ticketing platform feed and shows them on the Events page with **Buy tickets** links to the Ticketing site.

## What was implemented

- **Backend (New_Joscity):** `GET /api/events` now:
  1. Returns events from the JOSCITY database (unchanged).
  2. Calls `GET https://ticketing-back.onrender.com/api/events/feed/joscity` for the Gatewav feed.
  3. Calls `GET https://ticketing-back.onrender.com/api/events` to get event UUIDs.
  4. Matches feed events to raw events by title + date and builds `ticket_url`: `{TICKETING_FRONTEND_BASE}/event/{uuid}`.
  5. Merges both lists, sorts by date (newest first), and returns paginated data. Each external event includes `source: "gatewav"` and `ticket_url` (or `null` if UUID not found).

- **Frontend:** Events page:
  - Normalizes and displays both JOSCITY and Gatewav events.
  - For events with `source === "gatewav"` and `ticket_url`: shows a **Gatewav** badge and a **Buy tickets** button (opens Ticketing site in a new tab). Edit/Delete and Going/Interested are hidden for these events.
  - JOSCITY-created events behave as before (Edit, Delete, Going, Interested).

## Environment variables (backend)

Set these in `New_Joscity/.env` (or your backend env). All are optional; defaults point to the Ticketing backend and Gatewav.

| Variable | Default | Description |
|----------|---------|-------------|
| `TICKETING_FEED_URL` | `https://ticketing-back.onrender.com/api/events/feed/joscity` | Feed endpoint JOSCITY calls. |
| `TICKETING_EVENTS_URL` | `https://ticketing-back.onrender.com/api/events` | Raw events endpoint used to resolve event UUIDs for ticket links. |
| `TICKETING_FRONTEND_BASE` | `https://gatewav.com` | Base URL for ticket links; final link is `{base}/event/{uuid}`. |
| `TICKETING_JOSCITY_API_KEY` | *(empty)* | If the Ticketing backend requires an API key, set it here. Sent as `X-API-Key` and `Authorization: Bearer <key>`. |

If the Ticketing backend uses a different host, set `TICKETING_FEED_URL` and `TICKETING_EVENTS_URL` accordingly. If ticket links should point to another domain, set `TICKETING_FRONTEND_BASE`.

## Checklist (already done)

- [x] Backend calls `GET .../api/events/feed/joscity`.
- [x] Backend sends optional API key via `X-API-Key` / `Authorization: Bearer <key>` when `TICKETING_JOSCITY_API_KEY` is set.
- [x] Backend fetches raw `GET .../api/events` and matches by title+date to get UUIDs.
- [x] Backend adds `source: "gatewav"` and `ticket_url` to each feed event and merges with DB events.
- [x] Frontend shows Gatewav events with a **Buy tickets** link and Gatewav badge; JOSCITY-only actions (Edit/Delete/Going/Interested) are hidden for external events.

## CORS

Calls are made **from the JOSCITY backend** to the Ticketing backend, so CORS on the Ticketing side is not required for this integration. If you later call the feed from the browser, add JOSCITY’s origin to the Ticketing backend’s CORS allowed origins.

## Troubleshooting

**Log: "Ticketing feed: 404 Not found"**  
The Ticketing backend returned 404 for the feed URL. JOSCITY still returns its own events; external (Gatewav) events are omitted.

- **Ticketing side:** Ensure the feed route exists and is deployed (e.g. `GET /api/events/feed/joscity`) and returns a JSON array of events or an object with a `data`/`events` array.
- **JOSCITY side:** If the Ticketing API uses a different base URL or path, set **`TICKETING_FEED_URL`** in JOSCITY env to the full URL (e.g. `https://your-ticketing-api.com/api/events/feed/joscity`).
