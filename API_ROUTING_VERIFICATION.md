# API Routing Verification & Troubleshooting Guide

## 🔍 Current API Route Structure

### Backend Routes (server.ts)

```
/api/admin/*          → Admin routes
/api/auth/*           → Authentication routes  
/api/landing-page/*   → Public landing page routes
/api/*                → Feed routes (stories, reactions, comments, shares)
/api/ping             → Health check
```

### Frontend API Calls

```
authApi → /api/auth/*
feedApi → /api/*
publicLandingPageApi → /api/landing-page/*
adminApi → /api/admin/*
```

---

## ✅ Verified Route Mappings

### 1. Authentication Routes ✅

| Frontend Call | Backend Route | Status |
|--------------|---------------|--------|
| `authApi.registerPersonal()` | `POST /api/auth/signup` | ✅ Match |
| `authApi.registerBusiness()` | `POST /api/auth/signup` | ✅ Match |
| `authApi.signIn()` | `POST /api/auth/signin` | ✅ Match |
| `authApi.signOut()` | `POST /api/auth/signout` | ✅ Match |
| `authApi.forgetPassword()` | `POST /api/auth/forget_password` | ✅ Match |
| `authApi.forgetPasswordConfirm()` | `POST /api/auth/forget_password_confirm` | ✅ Match |
| `authApi.forgetPasswordReset()` | `POST /api/auth/forget_password_reset` | ✅ Match |
| `authApi.resendActivation()` | `POST /api/auth/resend_activation` | ✅ Match |

### 2. Feed Routes ✅

| Frontend Call | Backend Route | Status |
|--------------|---------------|--------|
| `feedApi.createStory()` | `POST /api/stories` | ✅ Match |
| `feedApi.getStories()` | `GET /api/stories` | ✅ Match |
| `feedApi.getMyStories()` | `GET /api/stories/my` | ✅ Match |
| `feedApi.viewStory()` | `GET /api/stories/:id/view` | ✅ Match |
| `feedApi.getStoryViews()` | `GET /api/stories/:id/views` | ✅ Match |
| `feedApi.deleteStory()` | `DELETE /api/stories/:id` | ✅ Match |
| `feedApi.reactToPost()` | `POST /api/posts/:id/react` | ✅ Match |
| `feedApi.removeReaction()` | `DELETE /api/posts/:id/react` | ✅ Match |
| `feedApi.getPostReactions()` | `GET /api/posts/:id/reactions` | ✅ Match |
| `feedApi.commentOnPost()` | `POST /api/posts/:id/comment` | ✅ Match |
| `feedApi.replyToComment()` | `POST /api/comments/:id/reply` | ✅ Match |
| `feedApi.getPostComments()` | `GET /api/posts/:id/comments` | ✅ Match |
| `feedApi.deleteComment()` | `DELETE /api/comments/:id` | ✅ Match |
| `feedApi.sharePost()` | `POST /api/posts/:id/share` | ✅ Match |
| `feedApi.getPostShares()` | `GET /api/posts/:id/shares` | ✅ Match |

### 3. Landing Page Routes ✅

| Frontend Call | Backend Route | Status |
|--------------|---------------|--------|
| `publicHeroApi.getSettings()` | `GET /api/landing-page/hero/settings` | ✅ Match |
| `publicHeroApi.getSlides()` | `GET /api/landing-page/hero/slides` | ✅ Match |
| `publicEventsApi.getSettings()` | `GET /api/landing-page/events/settings` | ✅ Match |
| `publicEventsApi.getEvents()` | `GET /api/landing-page/events` | ✅ Match |
| `publicServicesApi.getSettings()` | `GET /api/landing-page/services/settings` | ✅ Match |
| `publicServicesApi.getServices()` | `GET /api/landing-page/services` | ✅ Match |
| `publicPricingApi.getSettings()` | `GET /api/landing-page/pricing/settings` | ✅ Match |
| `publicPricingApi.getPlans()` | `GET /api/landing-page/pricing/plans` | ✅ Match |
| `publicContactApi.getSettings()` | `GET /api/landing-page/contact/settings` | ✅ Match |
| `publicContactApi.getInformation()` | `GET /api/landing-page/contact/information` | ✅ Match |
| `publicFooterApi.getSettings()` | `GET /api/landing-page/footer/settings` | ✅ Match |
| `publicFooterApi.getLinks()` | `GET /api/landing-page/footer/links` | ✅ Match |
| `publicNavbarApi.getMenuItems()` | `GET /api/landing-page/navbar/menu-items` | ✅ Match |
| `publicNavbarApi.getSettings()` | `GET /api/landing-page/navbar/settings` | ✅ Match |

### 4. Admin Routes ✅

All admin routes are properly mapped in `adminApi.ts`

---

## 🐛 Common 500 Error Causes

### 1. Database Connection Issues

**Symptoms:**
- 500 Internal Server Error
- Generic error message: "Registration failed. Please try again."

**Check:**
```bash
# In backend terminal, look for:
❌ Database Connection Failed
❌ Error setting search_path
```

**Solution:**
- Verify `.env` file has correct database credentials
- Check if PostgreSQL is running
- Verify `DATABASE_URL` or individual DB env vars are set
- Test connection: `psql -U your_user -d joscity`

### 2. Missing Database Schema/Tables

**Symptoms:**
- 500 error on registration
- Error in backend logs about missing table

**Check:**
```sql
-- Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'joscity' 
  AND table_name = 'users'
);
```

**Solution:**
- Run database setup scripts:
  ```bash
  cd JosCity-Backend
  npm run setup-db
  ```

### 3. Schema Path Issues

**Symptoms:**
- "relation does not exist" errors
- Tables not found

**Check:**
- Backend uses `joscity` schema
- Database connection should set `search_path TO joscity, public`

**Solution:**
- Ensure database has `joscity` schema created
- Check `database.ts` sets search_path correctly

### 4. Transaction Errors

**Symptoms:**
- 500 error during registration
- Rollback errors in logs

**Check:**
- Backend logs for transaction errors
- Database connection pool issues

---

## 🔧 Quick Debugging Steps

### Step 1: Check Backend is Running

```bash
# Terminal 1 - Backend
cd JosCity-Backend
npm run dev

# Should see:
🚀 Server running on port 3000
✅ Connected to PostgreSQL Database
```

### Step 2: Test Health Endpoint

```bash
# In browser or Thunder Client
GET http://localhost:3000/api/ping

# Expected:
{
  "message": "pong",
  "status": "healthy"
}
```

### Step 3: Check Backend Logs

When you make a request, check backend terminal for:
- ✅ Request received: `POST /api/auth/signup`
- ❌ Error messages
- ❌ Database connection errors
- ❌ SQL errors

### Step 4: Test with Thunder Client

**Test Registration:**
```
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "first_name": "Test",
  "last_name": "User",
  "gender": "male",
  "phone_number": "08012345678",
  "nin_number": "12345678901",
  "email": "test@example.com",
  "password": "Test123!",
  "address": "123 Test St",
  "account_type": "personal"
}
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Registration submitted for review...",
  "user_id": 123,
  "status": "under_review",
  "account_type": "personal"
}
```

**If 500 Error:**
- Check backend terminal for actual error
- Check database connection
- Check if tables exist

---

## 📋 Route Verification Checklist

- [x] Auth routes match (`/api/auth/*`)
- [x] Feed routes match (`/api/*`)
- [x] Landing page routes match (`/api/landing-page/*`)
- [x] Admin routes match (`/api/admin/*`)
- [x] Vite proxy configured correctly
- [x] CORS enabled on backend
- [ ] Database connection working
- [ ] Database tables exist
- [ ] Schema path set correctly

---

## 🚨 Most Likely Issues

Based on your 500 error, check:

1. **Database not connected** → Check `.env` file
2. **Tables don't exist** → Run `npm run setup-db`
3. **Schema not set** → Check `joscity` schema exists
4. **Backend not running** → Start with `npm run dev`

---

## 🔍 How to Check Backend Logs

When you make a request, the backend terminal should show:

**Good:**
```
POST /api/auth/signup
Signup successful
```

**Bad:**
```
POST /api/auth/signup
Signup error: [actual error message]
❌ Database Connection Failed
```

**Check the actual error message in backend terminal** - that will tell you exactly what's wrong!










