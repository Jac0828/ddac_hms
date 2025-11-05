# Quick Deploy - HMS to AWS

## ✅ Prerequisites Installed

- ✅ AWS CLI: Installed
- ✅ EB CLI: Installed (needs PATH)
- ✅ .NET 8 SDK: Installed

## 🔧 Next Steps

### Step 1: Configure AWS CLI (Required)

If you haven't configured AWS CLI yet:

```bash
aws configure
```

Enter:
- **AWS Access Key ID:** [Your AWS Access Key]
- **AWS Secret Access Key:** [Your AWS Secret Key]
- **Default region:** `us-east-1`
- **Default output format:** `json`

### Step 2: Verify AWS Authentication

```bash
aws sts get-caller-identity --region us-east-1
```

Should return your AWS account details.

### Step 3: Run Deployment

**Option A: Automated Setup (Recommended)**
```bash
cd /Users/jac/ddac_hms
./SETUP_AND_DEPLOY.sh
```

**Option B: Manual Deployment**
```bash
cd /Users/jac/ddac_hms
export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"
./deploy-to-aws.sh
```

## 📋 What Happens

1. **S3 Buckets** - Created for frontend and logs
2. **Frontend Build** - React app built from `hms-client`
3. **Frontend Upload** - Deployed to S3
4. **CloudFront** - CDN distribution created (5-15 min)
5. **Backend Build** - .NET 8 API published
6. **Elastic Beanstalk** - Application and environment created
7. **Backend Deploy** - API deployed to EB
8. **Security Groups** - EB → RDS access configured
9. **CORS** - CloudFront and localhost origins allowed

## ⏱️ Timeline

- **Setup:** 2-3 minutes
- **S3/Frontend:** 2-3 minutes
- **CloudFront:** 5-15 minutes (propagation)
- **EB Environment:** 5-10 minutes
- **EB Deploy:** 3-5 minutes

**Total:** ~15-25 minutes

## 🎯 Expected Output

After deployment:

- **Frontend:** `https://[cloudfront-domain].cloudfront.net`
- **Backend:** `http://[eb-environment].us-east-1.elasticbeanstalk.com`
- **Swagger:** `http://[eb-environment].us-east-1.elasticbeanstalk.com/swagger`

## ⚠️ Important

1. **AWS Credentials** must be configured first
2. **CloudFront** takes 5-15 minutes to fully deploy
3. **EB Environment** needs to be healthy before use
4. **Security Groups** are auto-configured by script

## 🔍 Check Status

```bash
# CloudFront
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName,Status]"

# EB Status
cd HMS.Api
eb status
```

