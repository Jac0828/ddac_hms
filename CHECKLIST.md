# HMS Deployment Checklist

## Local Development

### Backend (HMS.Api)

1. **Set up local PostgreSQL:**
   ```bash
   # Update appsettings.Development.json with local connection string
   # Or use environment variable: ConnectionStrings__Default
   ```

2. **Run migrations:**
   ```bash
   cd HMS.Api
   dotnet ef database update --project ../HMS.Infrastructure
   ```

3. **Start backend:**
   ```bash
   cd HMS.Api
   dotnet run
   ```
   Backend will be available at `http://localhost:5272`

### Frontend (hms-client)

1. **Install dependencies:**
   ```bash
   cd hms-client
   npm install
   ```

2. **Configure API URL:**
   - Development: `.env.development` should have `VITE_API_BASE_URL=http://localhost:5272`
   - Or update to match your backend port

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

4. **Test API connection:**
   - Navigate to `/dashboard` to see health check status
   - Verify API base URL is displayed correctly

## Elastic Beanstalk Environment Variables

Set the following environment variables in your Elastic Beanstalk environment configuration:

### Required Variables

1. **ASPNETCORE_ENVIRONMENT**
   - Value: `Production`
   - Description: Sets the application environment to Production

2. **RUN_MIGRATIONS**
   - Value: `true`
   - Description: Controls automatic database migration on startup (default: `true`). Set to `false` to skip migrations.

3. **ConnectionStrings__Default**
   - Value: Your PostgreSQL connection string (e.g., `Host=your-rds-endpoint.rds.amazonaws.com;Port=5432;Database=hms;Username=postgres;Password=your-password;SSL Mode=Require;Trust Server Certificate=true`)
   - Description: Database connection string. Use double underscore (`__`) to set nested configuration values.
   - **Note:** This overrides `appsettings.json` in production.

4. **CORS__AllowedOrigins**
   - Value: Comma-separated list of allowed origins (e.g., `https://your-frontend-domain.cloudfront.net,http://localhost:5173,http://localhost:3000`)
   - Description: CORS allowed origins for the API. Defaults to `http://localhost:5173,http://localhost:3000` if not set.

### Example Configuration

```
ASPNETCORE_ENVIRONMENT=Production
RUN_MIGRATIONS=true
ConnectionStrings__Default=Host=your-rds-endpoint.rds.amazonaws.com;Port=5432;Database=hms;Username=postgres;Password=your-password;SSL Mode=Require;Trust Server Certificate=true
CORS__AllowedOrigins=https://your-frontend-domain.cloudfront.net,http://localhost:5173,http://localhost:3000
```

## API Endpoints

### Health Check
- **Path**: `/healthz`
- **Method**: GET
- **Description**: Minimal health check endpoint returning 200-OK (no database hit)
- **Example**: `https://your-api-url.elasticbeanstalk.com/healthz`
- **Response**: `{"status":"healthy","timestamp":"2024-..."}`

### Swagger UI
- **Path**: `/swagger`
- **Description**: Swagger UI for API documentation (enabled in Production)
- **Example**: `https://your-api-url.elasticbeanstalk.com/swagger`

## Frontend Configuration

### Production Build

Before building the frontend for production:

1. **Set production API URL** in `.env.production`:
   ```bash
   cd hms-client
   echo "VITE_API_BASE_URL=https://your-elastic-beanstalk-url.elasticbeanstalk.com" > .env.production
   ```
   Replace with your actual EB URL.

2. **Build for production:**
   ```bash
   npm run build:prod
   ```
   This creates an optimized build in the `dist/` directory.

3. **Deploy `dist/` directory to S3 + CloudFront**

### Development

- Use `.env.development` with `VITE_API_BASE_URL=http://localhost:5272`
- Run `npm run dev` to start development server on port 5173

## Verification Steps

### Backend

1. ✅ Health endpoint returns 200: 
   ```bash
   curl https://your-api-url/healthz
   ```
   Should return: `{"status":"healthy","timestamp":"..."}`

2. ✅ Swagger UI loads: 
   ```bash
   open https://your-api-url/swagger
   ```

3. ✅ Database migrations run successfully (check EB logs)

### Frontend

4. ✅ Frontend can connect to API:
   - Navigate to `/dashboard` page
   - Check that health status is displayed
   - Verify API base URL is correct

5. ✅ CORS headers are present in API responses:
   - Check browser Network tab for CORS headers
   - Verify no CORS errors in console

## Troubleshooting

### Backend Issues

- **Migrations not running?** 
  - Check EB logs
  - Verify `RUN_MIGRATIONS=true` environment variable
  - Check `ConnectionStrings__Default` is set correctly

- **Database connection failed?** 
  - Verify RDS security group allows EB security group (port 5432)
  - Check connection string format
  - Verify SSL mode is correct

- **CORS errors?** 
  - Verify `CORS__AllowedOrigins` includes your frontend URL
  - Check that frontend URL matches exactly (including protocol)

### Frontend Issues

- **API calls failing?** 
  - Check `VITE_API_BASE_URL` in `.env.production` matches your EB URL
  - Rebuild after changing environment variables (they're embedded at build time)
  - Check browser console for errors

- **404 errors on routes?** 
  - Configure CloudFront error pages (403 → /index.html, 404 → /index.html)
  - Ensure SPA routing is configured correctly

- **CORS errors?** 
  - Update backend `CORS__AllowedOrigins` to include your CloudFront URL
  - Verify protocol matches (https vs http)

## Notes

- The API reads connection string from `ConnectionStrings__Default` environment variable (not from `appsettings.json` in production)
- Swagger is enabled in Production for API documentation
- Migrations run automatically on startup if `RUN_MIGRATIONS=true`
- CORS origins are configurable via `CORS__AllowedOrigins` environment variable
- Frontend uses Vite - environment variables must be set before build (embedded at build time)
- ForwardedHeaders are configured for reverse proxy (Elastic Beanstalk)
