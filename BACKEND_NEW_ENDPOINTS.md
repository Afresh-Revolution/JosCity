# Backend API Endpoints (New_Joscity)

The frontend (JOSCITY) expects these endpoints. **The following have been implemented** in New_Joscity; ensure your database has the required columns.

---

## 1. Post actions (feed routes)

Base path: `/api/feed` (same as existing create post).

### DELETE `/api/feed/posts/:id`
- **Auth**: Required (Bearer).
- **Description**: Delete a post. Only the post owner can delete.
- **Response**: `{ "success": true, "message": "Post deleted" }` or 403/404.

### PATCH `/api/feed/posts/:id`
- **Auth**: Required.
- **Body**: `{ "text": "updated caption" }`.
- **Description**: Update post text (edit). Only the post owner can edit.
- **Response**: `{ "success": true, "data": <post>, "message": "Post updated" }`.

### PATCH `/api/feed/posts/:id/pin`
- **Auth**: Required.
- **Body**: `{ "pinned": true | false }`.
- **Description**: Pin or unpin post for the current user (or for the feed order). Only the post owner can pin.
- **Response**: `{ "success": true, "data": <post>, "message": "Post pinned" }`.

---

## 2. Notifications

### GET `/api/notifications`
- **Auth**: Required.
- **Description**: List notifications for the current user (comment on my post, reaction on my post, etc.).
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "from_user_id": 2,
      "action": "commented on your post",
      "node_type": "post",
      "node_id": 10,
      "time": "2024-01-01T12:00:00Z",
      "is_read": false,
      "from_user": {
        "display_name": "Jane Doe",
        "profile_image_url": "https://..."
      }
    }
  ]
}
```

### PATCH `/api/notifications/:id/read`
- **Auth**: Required.
- **Description**: Mark one notification as read.
- **Response**: `{ "success": true }`.

### PATCH `/api/notifications/read-all`
- **Auth**: Required.
- **Description**: Mark all notifications of the current user as read.
- **Response**: `{ "success": true }`.

**When to create notifications:**
- When a user **comments** on a post → create notification for the **post owner** (to_user_id = post.user_id), action e.g. "commented on your post", node_type "post", node_id = post_id.
- When a user **reacts** (like, etc.) to a post → create notification for the **post owner** (to_user_id = post.user_id), action e.g. "reacted to your post", node_type "post", node_id = post_id.

**Notifications table** should have: `id` (serial PK), `to_user_id`, `from_user_id`, `action`, `node_type`, `node_id`, `time`, `is_read` (boolean, default false). If missing columns:
```sql
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
```
**Posts table** for pin: `is_pinned` (boolean), `updated_at` (timestamp). If missing:
```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

---

## 3. Friends (see BACKEND_API_REQUIREMENTS.md)

Implement:

- `POST /api/friends/request` — body: `{ "user_id": number }`
- `POST /api/friends/request/:requestId/accept`
- `POST /api/friends/request/:requestId/reject`
- `GET /api/friends/my`
- `GET /api/friends/requests` — returns `{ sent: [], received: [] }`
- `DELETE /api/friends/:userId`
- `GET /api/friends/check/:userId` — returns `{ are_friends, request_status }`

---

## 4. Comments (existing)

Ensure that when a comment is created (e.g. `POST /api/posts/:postId/comment` or your existing route), you **insert a row into the notifications table** for the post owner so they see it in GET `/api/notifications` and get the badge + tone on the frontend.

---

## 5. Reactions (existing)

Ensure that when a reaction is added (e.g. `POST /api/posts/:postId/react`), you **insert a row into the notifications table** for the post owner.
