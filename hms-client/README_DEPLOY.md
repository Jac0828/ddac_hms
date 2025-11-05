# HMS Client - Deployment Guide (Vite)

## Overview

This React application uses **Vite** as the build tool. The API base URL is configured via environment variables using `VITE_API_BASE_URL`.

## Environment Variables

Vite uses environment variables prefixed with `VITE_`. These are embedded at **build time** (not runtime).

### Development

The `.env.development` file is used when running `npm run dev`:

```bash
VITE_API_BASE_URL=http://localhost:5272
```

### Production

Before building for production, set `VITE_API_BASE_URL` in `.env.production`:

```bash
VITE_API_BASE_URL=https://your-elastic-beanstalk-url.elasticbeanstalk.com
```

**Important:** Replace `https://your-elastic-beanstalk-url.elasticbeanstalk.com` with your actual Elastic Beanstalk backend URL.

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

3. **API Base URL:**
   - Default: `http://localhost:5272` (from `.env.development`)
   - Make sure your backend API is running on port 5272, or update `.env.development`

## Production Build

1. **Set production API URL:**
   ```bash
   echo "VITE_API_BASE_URL=https://your-eb-url.elasticbeanstalk.com" > .env.production
   ```

2. **Build for production:**
   ```bash
   npm run build:prod
   ```
   This creates an optimized production build in the `dist/` directory.

3. **Preview production build locally (optional):**
   ```bash
   npm run preview
   ```

4. **Deploy to S3 + CloudFront:**
   - Upload all files from the `dist/` directory to your S3 bucket
   - Configure CloudFront to serve from S3
   - Update backend `CORS__AllowedOrigins` to include your CloudFront URL

## Important Notes

- Environment variables are embedded at **build time**, not runtime
- You must rebuild the application if the API URL changes
- The `.env.production` file should NOT be committed to version control (contains production URLs)
- Ensure CORS is properly configured on the backend to allow requests from your frontend domain

## Example Workflow

```bash
# 1. Set production API URL
echo "VITE_API_BASE_URL=https://hms-api.us-east-1.elasticbeanstalk.com" > .env.production

# 2. Build
npm run build:prod

# 3. Deploy dist/ directory to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 4. Update CloudFront distribution
# (via AWS Console or CLI)

# 5. Update backend CORS
# (via EB Console: CORS__AllowedOrigins=https://your-cloudfront-url.cloudfront.net,http://localhost:5173)
```
