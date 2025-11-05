# AWS Deployment - Quick Start

## 🚀 Quick Deployment

### Step 1: Install Prerequisites

```bash
./INSTALL_PREREQUISITES.sh
```

This installs:
- AWS CLI
- EB CLI (Elastic Beanstalk)

### Step 2: Configure AWS

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `us-east-1`
- Default output format: `json`

### Step 3: Deploy

```bash
./deploy-to-aws.sh
```

## 📋 What the Script Does

1. ✅ Creates S3 buckets for frontend and logs
2. ✅ Builds React frontend
3. ✅ Uploads frontend to S3
4. ✅ Creates CloudFront distribution with OAC
5. ✅ Builds .NET 8 API
6. ✅ Creates Elastic Beanstalk application
7. ✅ Deploys API to EB
8. ✅ Configures security groups (EB → RDS)
9. ✅ Sets up CORS for CloudFront and localhost

## 📍 Output URLs

After deployment, you'll get:

- **Frontend:** https://[cloudfront-domain].cloudfront.net
- **Backend:** http://[eb-environment].us-east-1.elasticbeanstalk.com
- **Swagger:** http://[eb-environment].us-east-1.elasticbeanstalk.com/swagger

## ⚙️ Configuration

All variables are in `deploy-to-aws.sh`:
- AWS Region: us-east-1
- RDS Endpoint: Already configured
- Frontend: hms-client
- Backend: HMS.Api

## 🔧 Manual Steps (if script fails)

See `DEPLOYMENT_GUIDE.md` for detailed manual steps.

## ⚠️ Important Notes

1. **CloudFront deployment** takes 5-15 minutes
2. **EB environment creation** takes 5-10 minutes
3. **Security groups** need to be configured for EB → RDS access
4. **CORS** is configured for CloudFront domain and localhost

## 📝 After Deployment

1. Update React app API URL to EB URL
2. Rebuild and redeploy frontend
3. Test endpoints
4. Verify database connection

