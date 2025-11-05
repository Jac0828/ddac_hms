# Diagnosing White Page Issue - Fixed

## ✅ Root Cause Found and Fixed

**Problem:** `src/services/api.ts` was using CRA syntax (`process.env.REACT_APP_API_BASE_URL`) instead of Vite syntax (`import.meta.env.VITE_API_BASE_URL`).

**Fix Applied:** Updated `services/api.ts` to use Vite environment variables.

## Steps to Fix White Page

### 1. Restart Frontend (Required)

Since we fixed the code, you need to restart the frontend:

```bash
# Stop the current frontend (Ctrl+C if running)
cd /Users/jac/ddac_hms/hms-client
npm run dev
```

### 2. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab:** Should show no errors now
- **Network tab:** Should see successful API calls to `http://localhost:5272/healthz`

### 3. Verify Environment Variable

Make sure `.env.development` exists and has the correct value:

```bash
cd /Users/jac/ddac_hms/hms-client
cat .env.development
```

Should show:
```
VITE_API_BASE_URL=http://localhost:5272
```

If missing or wrong:
```bash
echo "VITE_API_BASE_URL=http://localhost:5272" > .env.development
npm run dev
```

### 4. Clear Browser Cache

1. Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) to hard refresh
2. Or open in incognito/private window

### 5. Verify Backend is Running

Make sure backend is running on port 5272:

```bash
curl http://localhost:5272/healthz
```

Should return:
```json
{"status":"healthy","timestamp":"..."}
```

## What Should Happen Now

1. **Frontend loads:** `http://localhost:5173` shows the Home page with navigation
2. **Dashboard works:** `http://localhost:5173/dashboard` shows:
   - API Base URL: `http://localhost:5272`
   - Health check status (loading spinner, then success/error)
3. **No console errors:** Browser console shows no JavaScript errors

## If Still Not Working

### Check 1: Verify Both Services Running

**Terminal 1 - Backend:**
```bash
cd HMS.Api
dotnet run
```
Look for: `Now listening on: http://localhost:XXXX`

**Terminal 2 - Frontend:**
```bash
cd hms-client
npm run dev
```
Look for: `Local: http://localhost:5173/`

### Check 2: Browser Console Errors

Open browser DevTools (F12):
- **Console tab:** Copy any red error messages
- **Network tab:** Check if requests to `/healthz` are failing

### Check 3: Port Mismatch

If backend is on a different port (e.g., 5024), update `.env.development`:
```bash
cd hms-client
echo "VITE_API_BASE_URL=http://localhost:5024" > .env.development
npm run dev
```

## Quick Test

1. **Backend health check:**
   ```bash
   curl http://localhost:5272/healthz
   ```
   Should return JSON with status "healthy"

2. **Frontend in browser:**
   - Open: `http://localhost:5173`
   - Should see Home page with navigation bar
   - Click "Dashboard" or go to: `http://localhost:5173/dashboard`
   - Should see Dashboard with API health check

## Summary

✅ **Fixed:** Updated `services/api.ts` to use Vite env vars
✅ **Next:** Restart frontend (`npm run dev`)
✅ **Verify:** Check browser console for errors
✅ **Test:** Visit `http://localhost:5173/dashboard`

The white page should now be fixed!

