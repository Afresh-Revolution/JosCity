# JosCity Membership Frontend Handoff

This covers the **JosCity website** and **JosCity admin**. Membership is sold on JosCity. The ride discount is applied later by the JosRide backend. The submitted mobile apps do not need this work yet.

Do **not** hardcode ₦2,000 / 10% or ₦5,000 / 30%. Admin owns amount and discount percent.

---

## What shipped on the backend

A JosCity user funds their wallet, pays for a plan, and that plan stays active for **30 days**. While it is active, JosRide automatically cuts that user's ride fare by `josride_discount_percent`.

| Who | What to build now |
|---|---|
| JosCity admin | Create / edit plans: title, amount, description, **JosRide discount %** |
| JosCity website | Show plans, pay from wallet, show current plan + expiry |
| JosCity mobile apps | No change for this release |
| JosRide apps / web | No change for this release. Discount is applied on the JosRide API fare |

Native JosRide riders (no JosCity account) are unaffected. Users without an active membership pay the full ride price.

---

## Auth

All authenticated routes use:

```http
Authorization: Bearer <jwt>
```

| Surface | Header |
|---|---|
| Admin | Admin JWT (`verifyAdminToken`) |
| Website (logged-in member) | User JWT from personal/business login |
| Public plan list | None |

---

## Data shapes

### Plan item (admin + public + account)

```ts
type MembershipPlanItem = {
  id: string;                       // e.g. "starter", "plus"
  title: string;                    // e.g. "Starter"
  amount: number;                   // NGN to debit from wallet. Not a ride price.
  description: string;              // Newline-separated benefit copy
  josride_discount_percent: number; // 0–100. 10 = 10% off every JosRide trip
};
```

Aliases accepted on **write** only: `ride_discount_percent`, `discount_percent`. Prefer `josride_discount_percent`.

If admin saves an item without that field, the previous percent is kept. Sending `0` clears it.

### Current membership (logged-in user)

```ts
type CurrentMembership = {
  package_id: string;
  title: string;
  amount: number;
  status: "ACTIVE" | "EXPIRED";
  renews_at: string;                // YYYY-MM-DD, last valid day
  expires_at: string;               // same as renews_at
  billing: "Billed every 30 days";
  badge_color: string | null;
  josride_discount_percent: number; // 0 when EXPIRED
} | null;
```

`current` is `null` if the user has never subscribed.

---

## 1. Admin — create and edit plans

This is the only place amounts and discount percents are set.

```http
GET  /api/admin/membership
PUT  /api/admin/membership
```

### GET response

```json
{
  "success": true,
  "data": {
    "personal": {
      "enabled": true,
      "amount": 2000,
      "description": "10% off every JosRide trip for 30 days",
      "currency": "NGN",
      "items": [
        {
          "id": "starter",
          "title": "Starter",
          "amount": 2000,
          "description": "10% off every JosRide trip for 30 days",
          "josride_discount_percent": 10
        },
        {
          "id": "plus",
          "title": "Plus",
          "amount": 5000,
          "description": "30% off every JosRide trip for 30 days",
          "josride_discount_percent": 30
        }
      ]
    },
    "business": {
      "enabled": true,
      "amount": 0,
      "description": "",
      "currency": "NGN",
      "items": []
    }
  }
}
```

`amount` / `description` on the plan object are mirrors of `items[0]` for older screens. New UI should edit `items[]` only.

### PUT body

Send `personal` and/or `business`. Business `enabled` is always treated as `true` on the server.

```json
{
  "personal": {
    "enabled": true,
    "currency": "NGN",
    "items": [
      {
        "id": "starter",
        "title": "Starter",
        "amount": 2000,
        "description": "10% off every JosRide trip for 30 days",
        "josride_discount_percent": 10
      },
      {
        "id": "plus",
        "title": "Plus",
        "amount": 5000,
        "description": "30% off every JosRide trip for 30 days",
        "josride_discount_percent": 30
      }
    ]
  }
}
```

### Admin UI requirements

For each item show:

- Title
- Amount (NGN) — membership fee, not a ride fare
- JosRide discount (%) — number input, 0–100
- Description / benefits (textarea; one benefit per line)

Helper copy under the percent field:

> This percent is taken off the original JosRide fare for 30 days after the member pays. The membership fee itself is not a ride credit.

Validation before save:

- `amount` ≥ 0
- `josride_discount_percent` between 0 and 100
- unique `id` per item (stable ids; website subscribe sends this as `package_id`)
- max 20 items per account type

Do not compute or preview a sample JosRide price on admin. Admin only stores the percent.

---

## 2. Website — public plans (optional, logged-out)

```http
GET /api/membership
```

Same `{ success, data: { personal, business } }` shape as admin GET. No auth.

Use this for a marketing / pricing page. For a logged-in “buy” page, prefer the account endpoint below so you also get `current`.

---

## 3. Website — member buy / manage page

```http
GET /api/account/membership
Authorization: Bearer <user jwt>
```

### Response

```json
{
  "success": true,
  "data": {
    "user_id": 6,
    "member_id": "JC-000006",
    "name": "Ada Okafor",
    "email": "ada@email.com",
    "account_status": "approved",
    "account_type": "personal",
    "member_since": "2026-01-12T10:00:00.000Z",
    "nin_verified": true,
    "verified": true,
    "membership_enabled": true,
    "amount": 2000,
    "description": "...",
    "currency": "NGN",
    "items": [ ],
    "packages": [
      {
        "id": "starter",
        "title": "Starter",
        "amount": 2000,
        "description": "10% off every JosRide trip for 30 days",
        "josride_discount_percent": 10,
        "features": ["10% off every JosRide trip for 30 days"],
        "sort_order": 0
      }
    ],
    "current": null,
    "billing_copy": "Billed every 30 days · pause or cancel anytime"
  }
}
```

Render **`packages`**, not `items`. Empty / zero-amount untitled rows are already filtered out.

`features` is `description` split on newlines.

### If `membership_enabled` is false

Show a coming-soon state. Do not offer subscribe.

### Current plan banner

| `current` | UI |
|---|---|
| `null` | “No active plan” |
| `status: "ACTIVE"` | Title, “X% off JosRide rides”, “Renews / expires `expires_at`” |
| `status: "EXPIRED"` | “Expired on `expires_at`” + CTA to buy again |

---

## 4. Website — pay for a plan

Membership is **not** charged on Paystack directly. Flow:

1. `GET /api/account/wallet` → `data.balance`
2. If `balance < package.amount`, send the user to the existing wallet funding screens (Paystack / Safe Haven / manual). Same endpoints already used by the website.
3. When balance is enough:

```http
POST /api/account/membership/subscribe
Authorization: Bearer <user jwt>
Content-Type: application/json

{ "package_id": "starter" }
```

`item_id` is also accepted.

### Success `200`

```json
{
  "success": true,
  "message": "Membership updated",
  "data": {
    "current": {
      "package_id": "starter",
      "title": "Starter",
      "amount": 2000,
      "status": "ACTIVE",
      "renews_at": "2026-10-01",
      "expires_at": "2026-10-01",
      "billing": "Billed every 30 days",
      "badge_color": null,
      "josride_discount_percent": 10
    }
  }
}
```

### Errors

| Status | `message` | UI |
|---|---|---|
| 400 | `Insufficient wallet balance. Fund your wallet and try again.` | Deep-link to wallet funding with the shortfall |
| 400 | `No membership package is available` | Hide subscribe / refresh plans |
| 401 | Authentication required | Login |
| 500 | `Could not update membership` | Generic retry |

Paying again while already active **replaces** the plan and resets the 30-day window from today. Confirm copy:

> This starts a new 30-day period from today and replaces your current plan.

There is no prorating and no auto-renew charge in this backend. After 30 days the discount simply stops until they pay again.

---

## 5. Website UI copy (suggested)

**Plan card**

- Title
- ₦ amount / 30 days
- “X% off every JosRide trip”
- Feature bullets from `features`

**After purchase**

> Your Starter plan is active. For 30 days, JosRide will automatically take 10% off the original price of each ride. You do not need to do anything in the JosRide app.

Do **not** tell the user they received ₦2,000 ride credit. The ₦2,000 only activates the percent.

---

## 6. What the website must not do

- Do not calculate a JosRide fare or discounted fare. That lives on JosRide.
- Do not call JosRide APIs from the JosCity site for this feature.
- Do not send `josride_discount_percent` on subscribe. The server copies it from the plan at payment time.
- Do not treat `amount` as a wallet credit toward rides.

---

## 7. Suggested page map

| Route | Audience | Data |
|---|---|---|
| Admin → Membership | Admin | `GET/PUT /api/admin/membership` |
| `/membership` or pricing | Public or logged-in | `GET /api/membership` or `GET /api/account/membership` |
| `/account/membership` | Logged-in | `GET /api/account/membership` + subscribe |
| Existing wallet / fund | Logged-in | unchanged wallet funding APIs |

Mobile app membership screens can stay “coming soon” until the next store release.

---

## 8. TypeScript client

A drop-in client lives at [frontend-integration/membershipApi.ts](frontend-integration/membershipApi.ts).

```ts
import { membershipApi } from "./membershipApi";

const { packages, current, membership_enabled } =
  await membershipApi.getAccountMembership(token);

await membershipApi.subscribe(token, packages[0].id);
```

---

## 9. QA checklist

Admin

- [ ] Create two personal plans (e.g. ₦2,000 / 10% and ₦5,000 / 30%)
- [ ] Reload GET and confirm percents persisted
- [ ] Edit amount only; discount percent must not reset to 0
- [ ] Disable personal membership; website shows coming soon

Website

- [ ] Logged-out pricing page lists plans and percents
- [ ] Logged-in page shows `current === null` before pay
- [ ] Subscribe with low wallet → insufficient-balance error + fund CTA
- [ ] Fund wallet, subscribe → `ACTIVE`, `josride_discount_percent` matches the plan, `expires_at` is ~30 days out
- [ ] Subscribe to the other plan → previous plan replaced, new 30 days
- [ ] After expiry (or by setting a past date in staging) status is `EXPIRED` and percent is 0

JosRide (backend already live; no app rebuild)

- [ ] Same JosCity user books a ride → `estimated_fare_ngn` is original minus percent
- [ ] A JosRide-only user (no JosCity login) still sees the full fare

