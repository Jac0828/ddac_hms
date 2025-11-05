# Changes Summary - Vite Migration & Backend Updates

## Backend Changes (HMS.Api)

### Program.cs Updates

**Key Changes:**

1. **ForwardedHeaders Configuration** (Lines 12-20)
   - Added ForwardedHeadersOptions configuration for reverse proxy support (Elastic Beanstalk)
   - Configures XForwardedFor, XForwardedProto, XForwardedHost headers

2. **CORS Policy "AppCors"** (Lines 102-130)
   - Reads allowed origins from `CORS__AllowedOrigins` environment variable (comma-separated)
   - Defaults to `http://localhost:5173` and `http://localhost:3000` if empty
   - Uses `AllowAnyHeader()` and `AllowAnyMethod()`

3. **Swagger in Production** (Lines 138-144)
   - Swagger enabled in Production (not just Development)
   - Mapped at `/swagger` route

4. **Health Endpoint** (Lines 149-152)
   - `/healthz` endpoint returning 200 OK (no database hit)
   - Returns: `{"status":"healthy","timestamp":"..."}`

5. **Auto-migration** (Lines 156-181)
   - Controlled by `RUN_MIGRATIONS` environment variable (default: `true`)
   - Runs `db.Database.Migrate()` on startup with try/catch and logging

**Code Snippets:**

```csharp
// ForwardedHeaders (Lines 12-20)
builder.Services.Configure<Microsoft.AspNetCore.HttpOverrides.ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor |
                                Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto |
                                Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// CORS Policy (Lines 105-130)
var allowedOrigins = builder.Configuration["CORS__AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
if (allowedOrigins == null || allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:5173", "http://localhost:3000" };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("Content-Length", "Content-Type", "Authorization");
    });
});

// Health Endpoint (Lines 149-152)
app.MapGet("/healthz", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithName("HealthCheck")
   .AllowAnonymous();
```

## Frontend Changes (hms-client)

### Migration from CRA to Vite

**New Files Created:**

1. **`vite.config.ts`**
   - Vite configuration
   - Server port: 5173
   - Build output: `dist/`

2. **`index.html`** (root)
   - Vite-style HTML entry point
   - References `/src/main.tsx`

3. **`tsconfig.json`** & **`tsconfig.node.json`**
   - TypeScript configuration for Vite
   - Strict mode enabled

4. **`src/vite-env.d.ts`**
   - TypeScript definitions for Vite environment variables

5. **`.env.development`**
   ```
   VITE_API_BASE_URL=http://localhost:5272
   ```

6. **`.env.production`**
   ```
   VITE_API_BASE_URL=
   ```

7. **`src/lib/api.ts`**
   - API client using `import.meta.env.VITE_API_BASE_URL`
   - Simple fetch wrapper with JWT token handling
   - Health check function

8. **`src/pages/Dashboard.tsx`**
   - Demo page calling `/healthz` endpoint
   - Displays API base URL and health status
   - Refresh button for testing

9. **`src/main.tsx`**
   - Vite entry point (replaces index.tsx)

**Updated Files:**

1. **`package.json`**
   - Removed CRA dependencies (`react-scripts`, etc.)
   - Added Vite dependencies (`vite`, `@vitejs/plugin-react`)
   - Updated scripts:
     - `dev`: `vite` (replaces `react-scripts start`)
     - `build:prod`: `vite build`
     - `preview`: `vite preview`

2. **`src/App.tsx`**
   - Added Dashboard route: `/dashboard`
   - Imported Dashboard component

3. **`src/components/Navbar.tsx`**
   - Added Dashboard link to navigation

**Code Snippets:**

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5272';

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return apiRequest<{ status: string; timestamp: string }>('/healthz');
}

// src/pages/Dashboard.tsx
const Dashboard = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  // ... fetches and displays health status
};
```

## Documentation Updates

### CHECKLIST.md
- Added local development steps
- Updated EB environment variables section
- Added frontend Vite-specific instructions
- Added troubleshooting section

### README_DEPLOY.md (hms-client)
- Updated for Vite (not CRA)
- Instructions for `.env.development` and `.env.production`
- Build commands: `npm run build:prod`
- Notes about environment variables being embedded at build time

## Next Steps

1. **Install Vite dependencies:**
   ```bash
   cd hms-client
   npm install
   ```

2. **Test locally:**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173` and navigate to `/dashboard` to test API connection.

3. **Build for production:**
   ```bash
   echo "VITE_API_BASE_URL=https://your-eb-url.elasticbeanstalk.com" > .env.production
   npm run build:prod
   ```

4. **Deploy:**
   - Backend: Upload zip to Elastic Beanstalk
   - Frontend: Deploy `dist/` directory to S3 + CloudFront

## Important Notes

- **Environment Variables**: Vite embeds env vars at build time (not runtime)
- **CORS**: Backend defaults to `localhost:5173` (Vite) and `localhost:3000` (fallback)
- **Health Endpoint**: `/healthz` returns 200 OK without database hit
- **Swagger**: Enabled in Production at `/swagger`
- **Migrations**: Auto-run on startup if `RUN_MIGRATIONS=true`

