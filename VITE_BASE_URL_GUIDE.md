# VITE_BASE_URL Configuration Guide

## Location and Purpose

### Where is VITE_BASE_URL located?

1. **In `.env` file** (root directory):
   - Currently commented out in your `.env` file
   - Should be added as: `VITE_BASE_URL=https://your-backend-url.com/api`

2. **In `vite.config.ts`**:
   - Line 11: `const baseUrl = env.BASE_URL || env.VITE_BASE_URL || '';`
   - The config loads it from `.env` and exposes it

3. **In `src/api/config.js`**:
   - Line 13: `import.meta.env.APP_BASE_URL || import.meta.env.VITE_BASE_URL || ""`
   - Used as a fallback if APP_BASE_URL is not set

4. **In `src/vite-env.d.ts`**:
   - Line 6: TypeScript definition for `VITE_BASE_URL`

### What is its purpose?

**VITE_BASE_URL** is the **standard Vite convention** for environment variables that need to be accessible in client-side code.

#### Key Points:

1. **Vite Requirement**: In Vite, environment variables must be prefixed with `VITE_` to be exposed to client-side code
   - Without the `VITE_` prefix, variables are only available in server-side code (Node.js)
   - `VITE_BASE_URL` is automatically available via `import.meta.env.VITE_BASE_URL`

2. **Current Setup**: 
   - Your project uses `BASE_URL` (without VITE_ prefix) which is loaded via `vite.config.ts` and exposed as `APP_BASE_URL`
   - This works but requires custom configuration in `vite.config.ts`
   - `VITE_BASE_URL` would work out-of-the-box without custom config

3. **Why Both?**:
   - `BASE_URL` → Custom approach (exposed as `APP_BASE_URL`)
   - `VITE_BASE_URL` → Standard Vite approach (works automatically)
   - The code checks both for maximum compatibility

## How to Add VITE_BASE_URL

### Option 1: Add to `.env` file (Recommended)

Open your `.env` file and add:

```env
# For local development
VITE_BASE_URL=http://localhost:3000/api

# For production (uncomment when deploying)
# VITE_BASE_URL=https://new-joscity.onrender.com/api
```

### Option 2: Set in deployment platform

For production deployments (Vercel, Render, etc.), add it in the platform's environment variables:
- **Key**: `VITE_BASE_URL`
- **Value**: `https://your-backend-url.com/api`

## Current Configuration Status

✅ **Already Configured:**
- `vite.config.ts` loads `VITE_BASE_URL` from `.env`
- `src/api/config.js` checks for `VITE_BASE_URL` as fallback
- TypeScript definitions exist in `src/vite-env.d.ts`

⚠️ **Needs Action:**
- Add `VITE_BASE_URL` to your `.env` file (currently commented out)

## Priority Order

The code checks environment variables in this order:

1. `import.meta.env.APP_BASE_URL` (from `BASE_URL` in `.env` via vite.config.ts)
2. `import.meta.env.VITE_BASE_URL` (standard Vite way)
3. Fallback to `/api` (for local development with proxy)

## Example `.env` File

```env
# Custom BASE_URL (exposed as APP_BASE_URL)
BASE_URL=http://localhost:3000/api

# Standard Vite environment variable (automatically exposed)
VITE_BASE_URL=http://localhost:3000/api

# Production URLs (uncomment when deploying)
# BASE_URL=https://new-joscity.onrender.com/api
# VITE_BASE_URL=https://new-joscity.onrender.com/api
```

## Benefits of Using VITE_BASE_URL

1. **Standard Convention**: Follows Vite's recommended approach
2. **No Custom Config Needed**: Works without `vite.config.ts` modifications
3. **Better Compatibility**: Works with all Vite plugins and tools
4. **Easier Deployment**: Most deployment platforms expect `VITE_` prefixed variables

## Next Steps

1. Open your `.env` file
2. Uncomment or add: `VITE_BASE_URL=http://localhost:3000/api`
3. For production, set: `VITE_BASE_URL=https://new-joscity.onrender.com/api`
4. Restart your dev server after making changes

The code will automatically use `VITE_BASE_URL` if `APP_BASE_URL` is not available, providing a seamless fallback mechanism.


