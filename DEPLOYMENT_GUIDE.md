# AWS Deployment Guide - HMS

## Prerequisites

### Required Tools

1. **AWS CLI**
   ```bash
   brew install awscli
   aws configure
   ```

2. **EB CLI (Elastic Beanstalk)**
   ```bash
   pip install --user awsebcli
   export PATH="$HOME/.local/bin:$PATH"
   ```

3. **.NET 8 SDK** ✅ (Already installed: 8.0.415)

4. **zip** ✅ (Already installed)

### AWS Configuration

1. **Configure AWS CLI:**
   ```bash
   aws configure
   ```
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `us-east-1`
   - Default output format: `json`

2. **Verify authentication:**
   ```bash
   aws sts get-caller-identity
   ```

## Deployment Steps

### Option 1: Automated Script (Recommended)

Once AWS CLI and EB CLI are installed:

```bash
cd /Users/jac/ddac_hms
./deploy-to-aws.sh
```

### Option 2: Manual Steps

#### Step 1: Build Frontend

```bash
cd hms-client
npm install
npm run build

# Output will be in build/ or dist/
```

#### Step 2: Deploy Frontend to S3 + CloudFront

```bash
# Create S3 bucket
aws s3 mb s3://hms-ddac-frontend-$(date +%s) --region us-east-1

# Upload build
aws s3 sync build/ s3://YOUR_BUCKET_NAME/ --delete

# Create CloudFront distribution (see script for details)
```

#### Step 3: Deploy Backend to EB

```bash
cd HMS.Api

# Initialize EB (first time only)
eb init hms-ddac-app --region us-east-1 --platform "64bit Amazon Linux 2023 v6.1.6 running .NET Core"

# Create environment
eb create hms-ddac-env \
  --envvars "ASPNETCORE_ENVIRONMENT=Production,ConnectionStrings__Default=Host=hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com;Port=5432;Database=postgres;Username=postgres;Password=admin1234;SSL Mode=Require;Trust Server Certificate=true"

# Deploy
eb deploy
```

#### Step 4: Configure Security Groups

1. Find EB security group
2. Add rule to RDS security group (`sg-00c99757cb867e4b0`):
   - Type: PostgreSQL
   - Port: 5432
   - Source: EB security group ID

#### Step 5: Configure CORS

```bash
cd HMS.Api
eb setenv "CORS__AllowedOrigins=https://YOUR_CLOUDFRONT_DOMAIN,http://localhost:5173,http://localhost:3000"
```

## Current Configuration

### Variables
- **AWS Region:** us-east-1
- **RDS Endpoint:** hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com
- **RDS Security Group:** sg-00c99757cb867e4b0
- **Frontend Directory:** ./hms-client
- **Backend Directory:** ./HMS.Api

### Project Structure
- ✅ HMS.Api - Backend API (.NET 8)
- ✅ HMS.Infrastructure - EF Core migrations
- ✅ HMS.Domain - Domain models
- ✅ hms-client - React frontend

## Next Steps

1. **Install AWS CLI:**
   ```bash
   brew install awscli
   aws configure
   ```

2. **Install EB CLI:**
   ```bash
   pip install --user awsebcli
   ```

3. **Run deployment script:**
   ```bash
   ./deploy-to-aws.sh
   ```

## Expected Output

After successful deployment:

- **Frontend URL:** https://[cloudfront-domain].cloudfront.net
- **Backend URL:** http://[eb-environment].us-east-1.elasticbeanstalk.com
- **Swagger:** http://[eb-environment].us-east-1.elasticbeanstalk.com/swagger

## Troubleshooting

### AWS CLI not found
- Install: `brew install awscli`
- Verify: `aws --version`

### EB CLI not found
- Install: `pip install --user awsebcli`
- Add to PATH: `export PATH="$HOME/.local/bin:$PATH"`

### Connection timeout to RDS
- Check security group rules
- Ensure EB security group is allowed in RDS security group

### Build failures
- Ensure .NET 8 SDK is installed
- Ensure all packages are restored: `dotnet restore`

