# Quick Start Guide - Running Backend and Frontend

## Prerequisites

- .NET 8 SDK installed ✅
- Node.js and npm installed ✅
- PostgreSQL running (or AWS RDS configured)

## Step 1: Start Backend (HMS.Api)

### Option A: Using Terminal

```bash
cd HMS.Api
dotnet run
```

The backend will start on: `http://localhost:5272` (or the port shown in the output)

### Option B: Using Visual Studio

1. Open `HMS.Api/HMS.Api.csproj` in Visual Studio
2. Press `F5` or click Run
3. Backend will start automatically

### Verify Backend is Running

- Health endpoint: `http://localhost:5272/healthz`
- Swagger UI: `http://localhost:5272/swagger`

```bash
curl http://localhost:5272/healthz
```

Should return: `{"status":"healthy","timestamp":"..."}`

## Step 2: Start Frontend (hms-client)

### In a New Terminal Window

```bash
cd hms-client
npm run dev
```

The frontend will start on: `http://localhost:5173`

### Verify Frontend is Running

- Open browser: `http://localhost:5173`
- Navigate to: `http://localhost:5173/dashboard`
- You should see:
  - API Base URL: `http://localhost:5272`
  - Health check status (if backend is running)

## Running Both Together

### Terminal 1 (Backend):
```bash
cd /Users/jac/ddac_hms/HMS.Api
dotnet run
```

### Terminal 2 (Frontend):
```bash
cd /Users/jac/ddac_hms/hms-client
npm run dev
```

## Common Issues

### Backend Issues

**Problem:** Port already in use
```bash
# Find process using port 5272
lsof -i :5272
# Kill the process or change port in launchSettings.json
```

**Problem:** Database connection failed
- Check PostgreSQL is running
- Verify connection string in `appsettings.Development.json`
- Or set environment variable: `ConnectionStrings__Default=...`

**Problem:** Migrations not applied
```bash
cd HMS.Api
dotnet ef database update --project ../HMS.Infrastructure
```

### Frontend Issues

**Problem:** API calls failing
- Check backend is running on port 5272
- Verify `.env.development` has: `VITE_API_BASE_URL=http://localhost:5272`
- Check browser console for CORS errors

**Problem:** CORS errors
- Backend CORS is configured to allow `http://localhost:5173`
- If you're using a different port, update backend `CORS__AllowedOrigins`

**Problem:** Port 5173 already in use
```bash
# Vite will automatically try the next available port
# Or change port in vite.config.ts
```

## Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Vite dev server |
| Backend API | http://localhost:5272 | ASP.NET Core API |
| Swagger | http://localhost:5272/swagger | API documentation |
| Health Check | http://localhost:5272/healthz | Health endpoint |

## Testing the Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5272/healthz
   ```
   Expected: `{"status":"healthy","timestamp":"..."}`

2. **Frontend Dashboard:**
   - Open: `http://localhost:5173/dashboard`
   - Should show API Base URL and health status

3. **Swagger UI:**
   - Open: `http://localhost:5272/swagger`
   - Should load API documentation

## Environment Variables

### Backend (HMS.Api)

For local development, uses `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=hms;Username=postgres;Password=postgres"
  }
}
```

Override with environment variables:
```bash
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=hms;Username=postgres;Password=postgres"
dotnet run
```

### Frontend (hms-client)

Uses `.env.development`:
```
VITE_API_BASE_URL=http://localhost:5272
```

## Next Steps

- ✅ Backend running on port 5272
- ✅ Frontend running on port 5173
- ✅ Test Dashboard page: `http://localhost:5173/dashboard`
- ✅ Test Swagger: `http://localhost:5272/swagger`

## Stopping Services

- **Backend:** Press `Ctrl+C` in the terminal running `dotnet run`
- **Frontend:** Press `Ctrl+C` in the terminal running `npm run dev`
