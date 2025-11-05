#!/bin/bash

set -euo pipefail

# ======================
# ==== VARIABLES =======
# ======================

# ---- REQUIRED (already known/provided) ----
AWS_REGION="us-east-1"
RDS_ENDPOINT="hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB_NAME="postgres"
RDS_DB_USER="postgres"
RDS_DB_PASS="admin1234"
RDS_SG_ID="sg-00c99757cb867e4b0"

# ---- PROJECT LAYOUT ----
API_DIR="./HMS.Api"
INFRA_DIR="./HMS.Infrastructure"
FRONTEND_DIR="./hms-client"  # React app is in hms-client

# ---- NAMES (must be globally unique where noted) ----
APP_SLUG="hms-ddac"
EB_APP_NAME="hms-ddac-app"
EB_ENV_NAME="hms-ddac-env"
TIMESTAMP=$(date +%s)
S3_FRONTEND_BUCKET="hms-ddac-frontend-${TIMESTAMP}"
S3_LOGS_BUCKET="hms-ddac-logs-${TIMESTAMP}"
CF_COMMENT="HMS Frontend CDN"

# ---- CORS ----
LOCAL_ORIGINS=("http://localhost:5173" "http://localhost:3000")

echo "=========================================="
echo "HMS AWS Deployment Automation"
echo "=========================================="
echo ""

# ======================
# Prechecks
# ======================
echo "== Prechecks =="
which aws >/dev/null || { echo "❌ AWS CLI not installed."; exit 1; }
echo "✅ AWS CLI found"

aws sts get-caller-identity --region "$AWS_REGION" >/dev/null || { echo "❌ AWS CLI not configured/authenticated."; exit 1; }
echo "✅ AWS CLI authenticated"

which dotnet >/dev/null || { echo "❌ .NET SDK missing"; exit 1; }
echo "✅ .NET SDK found: $(dotnet --version)"

which zip >/dev/null || { echo "❌ zip tool missing"; exit 1; }
echo "✅ zip tool found"
echo ""

# ======================
# Ensure EB CLI
# ======================
echo "== Ensure EB CLI =="
# Add Python bin paths to PATH
export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"

if ! command -v eb >/dev/null 2>&1; then
  if command -v pip3 >/dev/null 2>&1; then
    echo "Installing EB CLI..."
    pip3 install --user awsebcli || true
    export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"
  fi
fi

if ! command -v eb >/dev/null 2>&1; then
  echo "❌ EB CLI still missing; try: pip3 install --user awsebcli"
  echo "   Then add to PATH: export PATH=\"\$HOME/.local/bin:\$HOME/Library/Python/3.13/bin:\$PATH\""
  exit 1
fi
echo "✅ EB CLI found: $(eb --version 2>&1 | head -1)"
echo ""

# ======================
# Create S3 buckets
# ======================
echo "== Create S3 buckets =="

# Create logs bucket (optional)
echo "Creating logs bucket: ${S3_LOGS_BUCKET}"
aws s3 mb "s3://${S3_LOGS_BUCKET}" --region "$AWS_REGION" 2>&1 | grep -v "already exists" || true
echo "✅ Logs bucket ready"

# Create frontend bucket
echo "Creating frontend bucket: ${S3_FRONTEND_BUCKET}"
aws s3 mb "s3://${S3_FRONTEND_BUCKET}" --region "$AWS_REGION" 2>&1 | grep -v "already exists" || true

# Block all public access at bucket level (we'll use CloudFront OAC)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws s3api put-public-access-block \
  --bucket "${S3_FRONTEND_BUCKET}" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true 2>&1 || true
echo "✅ Frontend bucket ready (private)"
echo ""

# ======================
# Build and deploy frontend
# ======================
echo "== Build frontend =="
if [ -d "$FRONTEND_DIR" ]; then
  pushd "$FRONTEND_DIR"
    if [ -f package.json ]; then
      echo "Detecting package manager..."
      if command -v pnpm >/dev/null 2>&1; then 
        PM=pnpm
      elif command -v yarn >/dev/null 2>&1; then 
        PM=yarn
      else 
        PM=npm
      fi
      echo "Using: $PM"
      
      echo "Installing dependencies..."
      $PM install
      
      echo "Building React app..."
      # Update API URL to use EB (will be set after EB is created)
      $PM run build || { echo "❌ React build failed"; exit 1; }
      
      # Find dist or build directory
      if [ -d "dist" ]; then 
        BUILD_DIR="dist"
      elif [ -d "build" ]; then 
        BUILD_DIR="build"
      else 
        echo "❌ No dist/build directory found"
        exit 1
      fi
      
      echo "Uploading build to S3..."
      aws s3 sync "$BUILD_DIR/" "s3://${S3_FRONTEND_BUCKET}/" --delete
      echo "✅ Frontend deployed to S3"
    else
      echo "⚠️  No package.json in FRONTEND_DIR; skipping frontend build"
    fi
  popd
else
  echo "⚠️  FRONTEND_DIR ($FRONTEND_DIR) not found; skipping frontend"
fi
echo ""

# ======================
# Create CloudFront with OAC
# ======================
echo "== Create CloudFront with OAC =="

# Create Origin Access Control
echo "Creating Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config '{
  "Name": "'"${APP_SLUG}-oac-${TIMESTAMP}"'",
  "Description": "OAC for HMS frontend",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}' --query 'OriginAccessControl.Id' --output text)
echo "✅ OAC created: ${OAC_ID}"

# Create CloudFront distribution
echo "Creating CloudFront distribution..."
DIST_CONFIG_FILE=$(mktemp)
cat > "$DIST_CONFIG_FILE" <<JSON
{
  "CallerReference": "ref-${TIMESTAMP}",
  "Comment": "${CF_COMMENT}",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3Origin",
      "DomainName": "${S3_FRONTEND_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
      "S3OriginConfig": { "OriginAccessIdentity": "" },
      "OriginAccessControlId": "${OAC_ID}"
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] },
    "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] },
    "Compress": true,
    "ForwardedValues": { "QueryString": true, "Cookies": { "Forward": "none" } },
    "MinTTL": 0
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 0
    }]
  },
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
JSON

DIST_ID=$(aws cloudfront create-distribution --distribution-config file://"$DIST_CONFIG_FILE" --query 'Distribution.Id' --output text)
CF_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)
CF_ARN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.ARN' --output text)
echo "✅ CloudFront Distribution created: ${DIST_ID}"
echo "   Domain: https://${CF_DOMAIN}"
echo ""

# Update S3 bucket policy to allow CloudFront
echo "== Allow CloudFront OAC to read S3 bucket =="
cat > /tmp/bucket-policy.json <<POL
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${S3_FRONTEND_BUCKET}/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "${CF_ARN}"
      }
    }
  }]
}
POL

aws s3api put-bucket-policy --bucket "${S3_FRONTEND_BUCKET}" --policy file:///tmp/bucket-policy.json
echo "✅ S3 bucket policy updated"
echo ""

# ======================
# Prepare backend for EB
# ======================
echo "== Prepare backend for EB =="
pushd "$API_DIR"
  echo "Restoring packages..."
  dotnet restore
  
  echo "Publishing API..."
  dotnet publish -c Release -o publish
  
  echo "Creating deployment package..."
  cd publish
  zip -r ../hms-api.zip . >/dev/null
  cd ..
  echo "✅ Deployment package created: hms-api.zip"
popd
echo ""

# ======================
# Create EB application and environment
# ======================
echo "== Create EB application and environment =="

# EB init (non-interactive)
if [ ! -d ".elasticbeanstalk" ]; then
  echo "Initializing EB application..."
  cd "$API_DIR"
  eb init "$EB_APP_NAME" --region "$AWS_REGION" --platform "64bit Amazon Linux 2023 v6.1.6 running .NET Core" --non-interactive || \
  eb init "$EB_APP_NAME" --region "$AWS_REGION" --platform "net 8" --non-interactive || true
  cd ..
fi

# Create/ensure instance profile for EB
PROFILE_NAME="aws-elasticbeanstalk-ec2-role"
echo "Checking instance profile: ${PROFILE_NAME}..."

if ! aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" >/dev/null 2>&1; then
  echo "Creating instance profile..."
  aws iam create-role --role-name "$PROFILE_NAME" --assume-role-policy-document '{
    "Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }' >/dev/null 2>&1 || true
  
  aws iam attach-role-policy --role-name "$PROFILE_NAME" --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier 2>&1 || true
  aws iam attach-role-policy --role-name "$PROFILE_NAME" --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker 2>&1 || true
  aws iam attach-role-policy --role-name "$PROFILE_NAME" --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier 2>&1 || true
  
  aws iam create-instance-profile --instance-profile-name "$PROFILE_NAME" >/dev/null 2>&1 || true
  aws iam add-role-to-instance-profile --instance-profile-name "$PROFILE_NAME" --role-name "$PROFILE_NAME" 2>&1 || true
  echo "Waiting for instance profile to propagate..."
  sleep 10
fi
echo "✅ Instance profile ready"

# Create EB environment if missing
cd "$API_DIR"
if ! eb list 2>/dev/null | grep -q "$EB_ENV_NAME"; then
  echo "Creating EB environment: ${EB_ENV_NAME}..."
  CONNECTION_STRING="Host=${RDS_ENDPOINT};Port=${RDS_PORT};Database=${RDS_DB_NAME};Username=${RDS_DB_USER};Password=${RDS_DB_PASS};SSL Mode=Require;Trust Server Certificate=true"
  
  eb create "$EB_ENV_NAME" \
    --single \
    --envvars "ASPNETCORE_ENVIRONMENT=Production,ConnectionStrings__Default=${CONNECTION_STRING}" \
    --instance_profile "$PROFILE_NAME" \
    --timeout 30 || {
      echo "⚠️  Environment creation may have failed or already exists"
    }
else
  echo "✅ EB environment already exists: ${EB_ENV_NAME}"
fi

# Deploy
echo "Deploying to EB..."
eb deploy "$EB_ENV_NAME" --staged || {
  echo "Deploying with zip file..."
  eb deploy "$EB_ENV_NAME" --label "build-${TIMESTAMP}" || true
}

EB_URL=$(eb status "$EB_ENV_NAME" 2>/dev/null | grep -i cname | awk -F': ' '{print $2}' | tr -d ' ' || echo "")
if [ -z "$EB_URL" ]; then
  EB_URL=$(eb status "$EB_ENV_NAME" 2>/dev/null | grep -i "CNAME" | head -1 | awk '{print $NF}' || echo "")
fi

cd ..
echo "✅ EB deployment initiated"
echo "   URL: http://${EB_URL}"
echo ""

# ======================
# Allow EB instances to access RDS
# ======================
echo "== Allow EB instances to access RDS =="

# Find EB auto SG
EB_INSTANCES_SG=$(aws ec2 describe-instances --region "$AWS_REGION" \
  --filters "Name=tag:elasticbeanstalk:environment-name,Values=${EB_ENV_NAME}" \
  --query "Reservations[].Instances[].SecurityGroups[].GroupId" --output text 2>/dev/null | tr '\t' '\n' | sort -u | head -n1)

if [ -n "$EB_INSTANCES_SG" ] && [ "$EB_INSTANCES_SG" != "None" ]; then
  echo "Found EB security group: ${EB_INSTANCES_SG}"
  aws ec2 authorize-security-group-ingress \
    --region "$AWS_REGION" \
    --group-id "$RDS_SG_ID" \
    --ip-permissions IpProtocol=tcp,FromPort=5432,ToPort=5432,UserIdGroupPairs="[{GroupId=${EB_INSTANCES_SG},Description='EB -> RDS'}]" \
    2>&1 | grep -v "already exists" || echo "✅ Security group rule added (or already exists)"
else
  echo "⚠️  Could not resolve EB instance SG; ensure RDS SG allows EB SG inbound on 5432 manually"
fi
echo ""

# ======================
# Configure CORS on API
# ======================
echo "== Configure CORS on API =="

# Add allowed origins for CloudFront + localhost
ALLOWED_ORIGINS="https://${CF_DOMAIN}"
for o in "${LOCAL_ORIGINS[@]}"; do 
  ALLOWED_ORIGINS="${ALLOWED_ORIGINS},${o}"
done

echo "Setting CORS allowed origins: ${ALLOWED_ORIGINS}"
cd "$API_DIR"
eb setenv "CORS__AllowedOrigins=${ALLOWED_ORIGINS}" 2>&1 || echo "⚠️  CORS env var setting may have failed"
cd ..
echo ""

# ======================
# Final Summary
# ======================
echo "=========================================="
echo "DEPLOYMENT SUMMARY"
echo "=========================================="
echo ""
echo "Frontend (CloudFront):  https://${CF_DOMAIN}"
echo "Backend (EB):           http://${EB_URL}"
echo ""
echo "S3 Frontend Bucket:     ${S3_FRONTEND_BUCKET}"
echo "S3 Logs Bucket:          ${S3_LOGS_BUCKET}"
echo ""
echo "CloudFront Distribution: ${DIST_ID}"
echo "EB Environment:          ${EB_ENV_NAME}"
echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Wait for CloudFront distribution to deploy (5-15 minutes)"
echo "   Check status: aws cloudfront get-distribution --id ${DIST_ID}"
echo ""
echo "2. Wait for EB environment to be healthy"
echo "   Check status: cd ${API_DIR} && eb status"
echo ""
echo "3. Update React app API URL to: http://${EB_URL}"
echo "   Then rebuild and redeploy to S3"
echo ""
echo "4. Test endpoints:"
echo "   Frontend: https://${CF_DOMAIN}"
echo "   Backend:  http://${EB_URL}/swagger"
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="

