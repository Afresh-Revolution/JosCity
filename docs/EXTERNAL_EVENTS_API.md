# External Events API – Integration Guide

This document describes how to integrate events from **another website you own** so they appear on JOSCITY’s Events section. You can do this in two ways: **pull** (JOSCITY fetches from your site) or **push** (your site sends events to JOSCITY).

---

## 1. Option A: JOSCITY Pulls Events From Your Website (recommended)

Your other website exposes a **public (or key-protected) API** that returns a list of events. JOSCITY will call this API and merge the results with its own events on the Events page.

### What your other website must provide

- **Endpoint:**  
  A GET endpoint that returns events, e.g.  
  `GET https://your-other-site.com/api/events`  
  (or a path you choose).

- **Response format:**  
  JSON with an array of events. Each event should match the shape below so JOSCITY can display it.

- **CORS (if JOSCITY frontend calls directly):**  
  Allow requests from JOSCITY’s origin (e.g. your JOSCITY domain).  
  If only the JOSCITY **backend** calls your API, CORS is not required.

- **Optional – API key:**  
  If you use a key, send it in a header (e.g. `X-API-Key` or `Authorization: Bearer <key>`). JOSCITY backend would store the key and send it when calling your API.

### Event object shape (your API should return)

Use the same field names so JOSCITY can merge and display without mapping.

| Field           | Type   | Required | Description                          |
|----------------|--------|----------|--------------------------------------|
| `event_id`     | number | Yes      | Unique ID on your system             |
| `event_title`  | string | Yes      | Title                                |
| `event_description` | string | No  | Description (can be HTML or plain)   |
| `event_category`   | string | No  | e.g. "Music", "Food", "Sport"        |
| `event_date`   | string | Yes      | ISO 8601 datetime, e.g. `2025-03-01T18:00:00` |
| `event_location`   | string | No  | Venue or address                     |
| `event_cover`  | string | No       | Full URL to cover image              |
| `event_capacity`   | number | No  | Max attendees                        |
| `source`       | string | Recommended | e.g. `"your-site-name"` so JOSCITY can label external events |

**Example response from your site:**

```json
{
  "success": true,
  "data": [
    {
      "event_id": 101,
      "event_title": "Concert Night",
      "event_description": "Live music event.",
      "event_category": "Music",
      "event_date": "2025-03-15T19:00:00",
      "event_location": "Main Hall",
      "event_cover": "https://your-other-site.com/images/event1.jpg",
      "event_capacity": 200,
      "source": "your-site-name"
    }
  ]
}
```

### What JOSCITY needs to implement (for Option A)

- **Backend:**  
  - A job or route that calls your `GET /api/events` (or equivalent) with optional API key.  
  - Merge your events with JOSCITY’s own events (e.g. by adding a `source` or `external_source` field and combining arrays).  
  - Cache or store external events if you want to reduce repeated calls.

- **Frontend:**  
  - Events page already consumes a single list; once the backend returns merged events (with `source` for external ones), the existing UI can show them.  
  - Optional: filter or badge “From [Your Site Name]” using `source`.

---

## 2. Option B: Your Website Pushes Events to JOSCITY

Your other website **sends** events to JOSCITY via an API. JOSCITY stores them (e.g. in the same `events` table with an `external_source` or `source_site` column) and shows them on the Events page like native events.

### What JOSCITY must implement (for Option B)

- **New route:**  
  e.g. `POST /api/events/external` (or `/api/integrations/events`).

- **Authentication:**  
  API key or shared secret (e.g. header `X-API-Key` or `Authorization: Bearer <token>`).  
  Validate the key on every request and reject unauthorized calls.

- **Database:**  
  - Either add a column to the existing `events` table, e.g. `source_site` (string, nullable) and `external_id` (string, nullable), or  
  - Create an `external_events` table and merge when returning the events list.  
  - Ensure `event_admin` or equivalent is set to a system user or null for external events.

- **Payload:**  
  Accept the same event shape as in the table above (e.g. `event_title`, `event_description`, `event_date`, `event_location`, `event_cover`, `event_category`, `event_capacity`).  
  Map them into your schema and set `source_site = 'your-site-name'`.

- **Idempotency (optional but recommended):**  
  Use `external_id` (your event id) to avoid duplicates when your site resends the same event (e.g. on update).

### What your other website must do

- **Call JOSCITY when events are created/updated:**  
  `POST https://joscity-api.example.com/api/events/external`  
  Headers:  
  - `Content-Type: application/json`  
  - `X-API-Key: <your-secret-key>` (or whatever JOSCITY implements)

- **Body:**  
  Same event object shape as in the table above. Include a stable `event_id` or `external_id` so JOSCITY can update instead of duplicate.

- **Security:**  
  Use HTTPS only. Keep the API key secret (env var on your server, never in frontend code).

---

## 3. Event categories (align with JOSCITY)

To avoid mismatches, prefer these category values when possible:

- Art, Crafts, Dance, Drinks, Films, Fitness, Food, Game, Party, Health, Sport, Literature, Music, Religion  

(Or map your categories to these on the JOSCITY side when merging.)

---

## 4. Checklist summary

**If you choose Option A (JOSCITY pulls):**

- [ ] Your site: Implement `GET /api/events` (or agreed path) returning the JSON shape above.  
- [ ] Your site: Add CORS for JOSCITY origin if the frontend calls directly; otherwise ensure the backend can reach your URL.  
- [ ] Your site: Optional – protect with API key and share the key with JOSCITY.  
- [ ] JOSCITY: Add backend logic to call your API, merge events, and return combined list (with `source` if needed).  
- [ ] JOSCITY: Optionally show “From [Your Site]” on event cards using `source`.

**If you choose Option B (your site pushes):**

- [ ] JOSCITY: Add `POST /api/events/external` (or similar), API key auth, and DB storage (new column or table).  
- [ ] JOSCITY: Include external events in `GET /api/events` response.  
- [ ] Your site: On create/update of an event, call JOSCITY’s API with the event payload and API key.  
- [ ] Your site: Store API key securely; use HTTPS only.

---

## 5. Notes

- **Rate limits:** If JOSCITY pulls (Option A), consider rate limiting your endpoint. If your site pushes (Option B), JOSCITY may rate limit by API key.  
- **Images:** Use full URLs for `event_cover` so JOSCITY can display them without hosting the files.  
- **Dates:** Use ISO 8601 and a consistent timezone (e.g. UTC or your local with offset) so sorting and display are correct.

Once you decide between Option A and B, you can implement the corresponding side and use this doc as the contract between the two systems.
