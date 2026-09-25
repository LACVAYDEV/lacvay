# Fix: Local Login Redirecting to onrender.com

## Problem
When logging in locally (e.g., http://localhost:5173), you're being redirected to onrender.com instead of staying on your local development environment.

## Root Cause
Your Supabase project has OAuth redirect URLs configured that only include your production domain (onrender.com). When you attempt to authenticate from localhost, Supabase rejects it and redirects to the configured production URL.

## Solution: Update Supabase OAuth Settings

### Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com/
2. Select your LACVAY project
3. Navigate to **Authentication** → **Providers** → **Google**

### Step 2: Add Authorized Redirect URLs
Add the following URLs to your Google OAuth provider's redirect URLs:
```
http://localhost:5173
http://localhost:5173/
http://127.0.0.1:5173
http://127.0.0.1:5173/
```

Also keep your production URLs:
```
https://your-onrender-domain.onrender.com
https://your-onrender-domain.onrender.com/
```

### Step 3: Save Configuration
Click **Save** and wait for the configuration to sync (usually a few seconds).

### Step 4: Clear Browser Cache
- Clear localStorage and cookies for localhost:5173
- Or just use an Incognito/Private window to test

### Step 5: Test Locally
Try logging in again at http://localhost:5173

---

## Code Changes Made

### Updated Files:
1. **AuthContext.tsx** - `signInWithGoogle` function
   - Now intelligently detects localhost environment
   - Uses `http://localhost:port` for local development
   - Uses production origin for deployed environments

2. **AuthForm.tsx** - `handleForgotPassword` function
   - Same environment detection applied
   - Ensures password reset emails redirect to the correct environment

### How It Works:
```typescript
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseUrl = isLocalDev 
  ? `http://${window.location.host}`  // e.g., http://localhost:5173
  : window.location.origin;             // e.g., https://yoursite.com
```

## Troubleshooting

**Still redirecting to onrender.com?**
1. ✅ Verify you saved the Supabase settings correctly
2. ✅ Check exact URL format (ensure protocol `http://` or `https://`)
3. ✅ Try a different port if Vite is using a different port
4. ✅ Refresh the page (don't just go back)
5. ✅ Clear all cookies/localStorage for the site

**What port is Vite using?**
Run: `npm run dev`
Check the terminal output - it will show something like:
```
  VITE v6.4.3  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Use that exact URL in Supabase (including the port number).

---

## Summary
- ✅ Floating AI button added to all pages
- ✅ Transport bar (Grab, Angkas, iDOL Taxi) added to:
  - HomePage (user home)
  - Sidebar (quick access)
  - CommutePage (ride guide)
- ✅ Login redirect issue fixed with environment-aware OAuth URLs
