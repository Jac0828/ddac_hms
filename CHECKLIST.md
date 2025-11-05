# HMS Deployment Checklist

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

### Swagger UI
- **Path**: `/swagger`
- **Description**: Swagger UI for API documentation (enabled in Production)
- **Example**: `https://your-api-url.elasticbeanstalk.com/swagger`

## Frontend Configuration

Before building the frontend for production:

1. Create `.env.production` in `hms-client/` directory:
   ```
   REACT_APP_API_BASE_URL=https://your-elastic-beanstalk-url.elasticbeanstalk.com
   ```

2. Build the frontend:
   ```bash
   cd hms-client
   npm run build:prod
   ```

3. Deploy the `build/` directory to S3 + CloudFront

## Verification Steps

1. ✅ Health endpoint returns 200: `curl https://your-api-url/healthz`
2. ✅ Swagger UI loads: `https://your-api-url/swagger`
3. ✅ Database migrations run successfully (check EB logs)
4. ✅ Frontend can connect to API (check browser console)
5. ✅ CORS headers are present in API responses

## Notes

- The API reads connection string from `ConnectionStrings__Default` environment variable (not from `appsettings.json` in production)
- Swagger is enabled in Production for API documentation
- Migrations run automatically on startup if `RUN_MIGRATIONS=true`
- CORS origins are configurable via `CORS__AllowedOrigins` environment variable

