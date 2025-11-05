# Next Steps: Deployment Guide

## Overview

Since you're deploying from Visual Studio (zip) to Elastic Beanstalk without AWS CLI access, follow these steps:

## Step 1: Prepare Backend Deployment Package

### Option A: Using Visual Studio (Recommended)

1. **Right-click on `HMS.Api` project** → **Publish**
2. Select **Folder** as publish target
3. Choose a folder (e.g., `HMS.Api/publish`)
4. Click **Publish**
5. **Navigate to the publish folder** and create a zip file:
   - On Windows: Right-click folder → Send to → Compressed (zipped) folder
   - On macOS/Linux: Use the script below

### Option B: Using Command Line

Run this script to create the deployment zip:

```bash
cd /Users/jac/ddac_hms
./prepare-backend-deploy.sh
```

This will create `HMS.Api/hms-api-deploy.zip` ready for EB upload.

## Step 2: Configure Elastic Beanstalk Environment Variables

Since you can't use AWS CLI in Academy, configure via AWS Console:

### In AWS Console:

1. Go to **Elastic Beanstalk** → Your Application → Your Environment
2. Click **Configuration** → **Software** → **Environment properties**
3. Add these environment variables:

```
ASPNETCORE_ENVIRONMENT = Production
RUN_MIGRATIONS = true
ConnectionStrings__Default = Host=hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com;Port=5432;Database=postgres;Username=postgres;Password=admin1234;SSL Mode=Require;Trust Server Certificate=true
CORS__AllowedOrigins = http://localhost:5173,http://localhost:3000
```

**Important:** Use double underscore (`__`) for nested config like `ConnectionStrings__Default`.

4. Click **Apply** and wait for environment update (2-5 minutes)

## Step 3: Deploy Backend to Elastic Beanstalk

1. In AWS Console → **Elastic Beanstalk** → Your Application → Your Environment
2. Click **Upload and deploy**
3. Choose the zip file you created (`hms-api-deploy.zip`)
4. Click **Deploy**
5. Wait for deployment to complete (5-10 minutes)

## Step 4: Get Your Backend URL

After deployment completes:

1. In EB Console, note your **Environment URL** (e.g., `http://hms-ddac-env.us-east-1.elasticbeanstalk.com`)
2. Test the health endpoint:
   ```
   http://your-eb-url.elasticbeanstalk.com/healthz
   ```
3. Test Swagger:
   ```
   http://your-eb-url.elasticbeanstalk.com/swagger
   ```

## Step 5: Build Frontend for Production

**Before building**, you need to know your backend URL from Step 4.

### Build with Production API URL:

```bash
cd /Users/jac/ddac_hms/hms-client

# Set your EB backend URL
EB_URL="http://your-eb-url.elasticbeanstalk.com"  # Replace with your actual EB URL

# Create production env file
echo "REACT_APP_API_BASE_URL=${EB_URL}" > .env.production

# Build for production
npm run build:prod
```

This creates optimized production build in `hms-client/build/` directory.

### Alternative: Use the helper script

```bash
cd /Users/jac/ddac_hms
./build-frontend.sh http://your-eb-url.elasticbeanstalk.com
```

## Step 6: Deploy Frontend to S3 + CloudFront

Since you can't use AWS CLI, use AWS Console:

### Create S3 Bucket:

1. Go to **S3** → **Create bucket**
2. Bucket name: `hms-frontend-YYYYMMDD` (use date for uniqueness)
3. Region: `us-east-1`
4. **Uncheck "Block all public access"** (we'll use CloudFront)
5. Create bucket

### Upload Frontend Files:

1. Open your bucket
2. Click **Upload**
3. Upload **all files** from `hms-client/build/` directory
   - **Important:** Upload files, not the folder itself
   - Select all files in the build folder
4. Click **Upload**

### Create CloudFront Distribution:

1. Go to **CloudFront** → **Create distribution**
2. **Origin domain:** Select your S3 bucket
3. **Viewer protocol policy:** Redirect HTTP to HTTPS
4. **Allowed HTTP methods:** GET, HEAD, OPTIONS
5. **Default root object:** `index.html`
6. **Error pages:**
   - HTTP error code: `403`, Custom error response: `Yes`, Response page path: `/index.html`, HTTP response code: `200`
   - HTTP error code: `404`, Custom error response: `Yes`, Response page path: `/index.html`, HTTP response code: `200`
7. Create distribution (takes 5-15 minutes to deploy)

### Update CORS on Backend:

After CloudFront is ready, update EB environment variable:

1. Go to **EB Console** → Your Environment → **Configuration** → **Software**
2. Update `CORS__AllowedOrigins`:
   ```
   CORS__AllowedOrigins = https://your-cloudfront-url.cloudfront.net,http://localhost:5173,http://localhost:3000
   ```
3. Click **Apply**

## Step 7: Verify Deployment

### Backend:

✅ Health check: `http://your-eb-url/healthz` (should return `{"status":"healthy",...}`)
✅ Swagger: `http://your-eb-url/swagger` (should load Swagger UI)
✅ Check EB logs to confirm migrations ran successfully

### Frontend:

✅ Open: `https://your-cloudfront-url.cloudfront.net`
✅ Try logging in
✅ Check browser console for API connection errors

## Troubleshooting

### Backend Issues:

- **Migrations not running?** Check EB logs → Check `RUN_MIGRATIONS` env var
- **Database connection failed?** Check security group allows EB → RDS (port 5432)
- **CORS errors?** Verify `CORS__AllowedOrigins` includes your frontend URL

### Frontend Issues:

- **API calls failing?** Check `REACT_APP_API_BASE_URL` in `.env.production` matches your EB URL
- **404 errors?** Configure CloudFront error pages (see Step 6)
- **CORS errors?** Update backend `CORS__AllowedOrigins` to include CloudFront URL

## Quick Reference

| Component | URL Pattern |
|-----------|-------------|
| Backend Health | `http://your-eb-url/healthz` |
| Backend Swagger | `http://your-eb-url/swagger` |
| Frontend | `https://your-cloudfront-url.cloudfront.net` |

## Files Created

- `prepare-backend-deploy.sh` - Script to create backend zip
- `build-frontend.sh` - Script to build frontend with API URL
- `CHECKLIST.md` - Complete checklist of environment variables

