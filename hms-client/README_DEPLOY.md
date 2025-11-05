# HMS Client - Deployment Guide

## Overview

This React application (created with Create React App) connects to the HMS API backend. The API base URL must be configured before building for production.

## Environment Variables

The application uses `REACT_APP_API_BASE_URL` to determine the API endpoint.

### Local Development

For local development, the default API URL is `http://localhost:5272`.

### Production Build

Before building for production:

1. **Set the API Base URL**

   Create a `.env.production` file in the `hms-client` directory (or copy from `.env.production.template`):

   ```bash
   REACT_APP_API_BASE_URL=https://your-elastic-beanstalk-url.elasticbeanstalk.com
   ```

   Replace `https://your-elastic-beanstalk-url.elasticbeanstalk.com` with your actual Elastic Beanstalk API URL.

2. **Build for Production**

   ```bash
   npm run build:prod
   ```

   This will create an optimized production build in the `build/` directory.

3. **Deploy to S3 + CloudFront**

   After building, deploy the contents of the `build/` directory to your S3 bucket and configure CloudFront.

## Important Notes

- The API base URL is set at **build time**, not runtime. You must rebuild the application if the API URL changes.
- Ensure CORS is properly configured on the backend to allow requests from your frontend domain.
- The backend CORS configuration uses the `CORS__AllowedOrigins` environment variable (comma-separated list of allowed origins).

## Example

```bash
# 1. Set API URL
echo "REACT_APP_API_BASE_URL=https://hms-api.us-east-1.elasticbeanstalk.com" > .env.production

# 2. Build
npm run build:prod

# 3. Deploy build/ directory to S3
aws s3 sync build/ s3://your-bucket-name --delete
```

