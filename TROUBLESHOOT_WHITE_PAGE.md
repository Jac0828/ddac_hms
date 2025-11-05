# Troubleshooting: White/Empty Page Issues

## Problem: Backend Shows "Welcome" Page

**Solution:** I've added a root redirect to Swagger. After restarting the backend:

1. **Restart backend:**
   ```bash
   cd HMS.Api
   dotnet run
   ```

2. **Visit root URL:** `http://localhost:5272`
   - Should now redirect to `/swagger` automatically

3. **Or visit directly:**
   - Swagger: `http://localhost:5272/swagger`
   - Health: `http://localhost:5272/healthz`

## Problem: Frontend Shows White/Empty Page

### Check 1: Is Frontend Running?

```bash
cd hms-client
npm run dev
```

Look for output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Check 2: Visit Correct URL

- Frontend: `http://localhost:5173`
- Dashboard: `http://localhost:5173/dashboard`
- Home: `http://localhost:5173/`

### Check 3: Browser Console Errors

Open browser DevTools (F12) and check:
- **Console tab:** Look for JavaScript errors
- **Network tab:** Check if API calls are failing
- **Elements tab:** Verify `<div id="root">` exists

### Check 4: Common Issues

#### Issue: Missing Dependencies
```bash
cd hms-client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Issue: Port Conflict
Vite will automatically try next port if 5173 is busy. Check terminal output for actual port.

#### Issue: API Base URL Not Set
Check `.env.development`:
```bash
cat .env.development
# Should show: VITE_API_BASE_URL=http://localhost:5272
```

If missing or wrong:
```bash
echo "VITE_API_BASE_URL=http://localhost:5272" > .env.development
npm run dev
```

#### Issue: CORS Errors
If you see CORS errors in console:
- Backend CORS is configured for `http://localhost:5173`
- Make sure you're using the exact port shown in Vite output
- Check backend logs for CORS errors

### Check 5: Component Import Errors

Verify all components exist:
```bash
cd hms-client
ls -la src/components/
ls -la src/pages/
ls -la src/contexts/
```

Should see:
- `Home.tsx`
- `Login.tsx`
- `Register.tsx`
- `Navbar.tsx`
- `RoomsList.tsx`
- `pages/Dashboard.tsx`
- `contexts/AuthContext.tsx`

### Check 6: Build Errors

Try building to see errors:
```bash
cd hms-client
npm run build
```

Look for TypeScript or import errors.

## Quick Fix Steps

1. **Restart Backend:**
   ```bash
   cd HMS.Api
   dotnet run
   ```
   Wait for: `Now listening on: http://localhost:XXXX`

2. **Restart Frontend:**
   ```bash
   cd hms-client
   npm run dev
   ```
   Wait for: `Local: http://localhost:5173/`

3. **Open Browser:**
   - Frontend: `http://localhost:5173`
   - Backend Swagger: `http://localhost:5272/swagger` (or the port shown)

4. **Check Browser Console:**
   - Press F12
   - Check Console tab for errors
   - Check Network tab for failed requests

## Expected Behavior

### Backend (`http://localhost:5272`):
- Root `/` should redirect to `/swagger`
- `/swagger` should show Swagger UI
- `/healthz` should return `{"status":"healthy","timestamp":"..."}`

### Frontend (`http://localhost:5173`):
- Root `/` should show Home component
- `/dashboard` should show Dashboard with API health check
- Should show Navbar with navigation links
- Should display API Base URL and health status

## Still Not Working?

1. **Clear browser cache:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Try incognito/private window**
3. **Check terminal output** for errors
4. **Verify both services are running** in separate terminals

