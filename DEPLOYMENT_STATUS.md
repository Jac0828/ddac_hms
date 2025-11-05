# Deployment Status Check

## ✅ Scripts Created

1. **`check-deployment.sh`** - Discovers and checks deployed endpoints
2. **`configure-and-check.sh`** - Helper script to configure and check

## 🔧 Usage

### Quick Check (After AWS is configured)

```bash
cd /Users/jac/ddac_hms
export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"
./check-deployment.sh
```

### Or Use Helper Script

```bash
./configure-and-check.sh
```

## 📋 What the Script Does

1. **Checks AWS Authentication** - Verifies AWS CLI is configured
2. **Discovers EB Environment** - Finds Elastic Beanstalk environment
3. **Gets EB URL** - Extracts backend URL from EB status
4. **Discovers CloudFront** - Finds CloudFront distribution
5. **Gets CloudFront URL** - Extracts frontend URL
6. **Opens in Browser** - Opens Swagger UI and frontend
7. **Health Checks** - Tests endpoints with curl
8. **Summary** - Prints all URLs

## 📍 Expected Output

After successful deployment:

```
==========================================
DEPLOYMENT SUMMARY
==========================================
Backend (Swagger):    http://[eb-env].us-east-1.elasticbeanstalk.com/swagger
Backend (Root):       http://[eb-env].us-east-1.elasticbeanstalk.com
Frontend (CloudFront): https://[cloudfront-domain].cloudfront.net
==========================================
```

## ⚠️ Current Status

**AWS CLI:** Not configured yet

**Action Required:**
1. Configure AWS: `aws configure`
2. Then run: `./check-deployment.sh`

## 🔍 Manual Check

If you want to check manually:

```bash
# Check EB environments
cd HMS.Api
eb list

# Check EB status
eb status

# Check CloudFront distributions
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName,Comment,Status]" --output table
```

