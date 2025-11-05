#!/bin/bash

# ========= VARIABLES =========
AWS_REGION="us-east-1"
PROJECT_ROOT="/Users/jac/ddac_hms"
EB_ENV_NAME="hms-ddac-env"
CF_COMMENT="HMS Frontend CDN"

# ========= PRECHECKS =========
set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/Library/Python/3.13/bin:$PATH"

echo "=========================================="
echo "HMS Deployment Health Check"
echo "=========================================="
echo ""

echo "== Prechecks =="
if ! aws sts get-caller-identity --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured/authenticated"
    exit 1
fi
echo "✅ AWS CLI authenticated"

if ! command -v eb >/dev/null 2>&1; then
    echo "❌ EB CLI not found in PATH"
    exit 1
fi
echo "✅ EB CLI found"

if ! command -v aws >/dev/null 2>&1; then
    echo "❌ AWS CLI not found in PATH"
    exit 1
fi
echo "✅ AWS CLI found"
echo ""

cd "$PROJECT_ROOT"

# ========= BACKEND (Elastic Beanstalk) =========
echo "== Resolve EB URL =="
cd HMS.Api

# Ensure env exists
if ! eb list 2>/dev/null | grep -q "$EB_ENV_NAME"; then
    echo "⚠️  EB environment '$EB_ENV_NAME' not found. Run 'eb list' to see available envs."
    echo ""
    echo "Available environments:"
    eb list 2>/dev/null || echo "  No environments found"
    EB_URL=""
else
    echo "✅ EB environment found: $EB_ENV_NAME"
    
    EB_URL=$(eb status "$EB_ENV_NAME" 2>/dev/null | grep -i "CNAME:" | awk -F': ' '{print $2}' | tr -d ' ' || echo "")
    
    if [ -z "${EB_URL:-}" ]; then
        # Try alternative parsing
        EB_URL=$(eb status "$EB_ENV_NAME" 2>/dev/null | grep -i cname | head -1 | awk '{print $NF}' || echo "")
    fi
fi

cd ..

if [ -z "${EB_URL:-}" ]; then
    echo "⚠️  Could not resolve EB CNAME. Environment may not be deployed yet."
    BACKEND_URL=""
else
    BACKEND_URL="http://${EB_URL}"
    echo "✅ Backend (EB): ${BACKEND_URL}"
    
    # Open Swagger (best-effort)
    echo "Opening Swagger UI..."
    open "${BACKEND_URL}/swagger" >/dev/null 2>&1 || true
    
    # Quick health checks
    echo ""
    echo "== Backend health checks =="
    echo "Testing root endpoint..."
    if curl -sS -I "${BACKEND_URL}" --max-time 10 2>&1 | head -5; then
        echo "✅ Root endpoint responding"
    else
        echo "⚠️  Root endpoint not responding"
    fi
    
    echo ""
    echo "Testing Swagger endpoint..."
    if curl -sS -I "${BACKEND_URL}/swagger" --max-time 10 2>&1 | head -5; then
        echo "✅ Swagger endpoint responding"
    else
        echo "⚠️  Swagger endpoint not responding"
    fi
fi

echo ""

# ========= FRONTEND (CloudFront) =========
echo "== Resolve CloudFront domain =="

# Preferred: by comment
CF_DOMAIN=$(aws cloudfront list-distributions --region "$AWS_REGION" \
  --query "DistributionList.Items[?Comment=='${CF_COMMENT}'].DomainName | [0]" --output text 2>/dev/null || echo "")

if [ -z "${CF_DOMAIN:-}" ] || [ "$CF_DOMAIN" = "None" ] || [ "$CF_DOMAIN" = "null" ]; then
    echo "No distribution found by comment; falling back to the latest distribution..."
    CF_DOMAIN=$(aws cloudfront list-distributions --region "$AWS_REGION" \
      --query "DistributionList.Items | sort_by(@,&LastModifiedTime)[-1].DomainName" --output text 2>/dev/null || echo "")
fi

if [ -z "${CF_DOMAIN:-}" ] || [ "$CF_DOMAIN" = "None" ] || [ "$CF_DOMAIN" = "null" ]; then
    echo "⚠️  Could not resolve any CloudFront distribution domain."
    echo "   Open AWS Console > CloudFront to verify."
    FRONTEND_URL=""
else
    FRONTEND_URL="https://${CF_DOMAIN}"
    echo "✅ Frontend (CloudFront): ${FRONTEND_URL}"
    
    # Open Frontend (best-effort)
    echo "Opening frontend..."
    open "${FRONTEND_URL}" >/dev/null 2>&1 || true
    
    # Frontend quick check
    echo ""
    echo "== Frontend health checks =="
    echo "Testing frontend..."
    if curl -sS -I "${FRONTEND_URL}" --max-time 10 2>&1 | head -5; then
        echo "✅ Frontend responding"
    else
        echo "⚠️  Frontend not responding (may be deploying)"
    fi
fi

echo ""

# ========= OPTIONAL: print API base guidance =========
if [ -n "${BACKEND_URL:-}" ]; then
    cat <<NOTE

==========================================
API Configuration Note
==========================================

If the frontend still calls "localhost" instead of the EB API:

1) Rebuild your React app with the API base set to the EB URL:

   cd hms-client
   export REACT_APP_API_URL="${BACKEND_URL}"
   npm run build
   
   # Then sync build to S3
   aws s3 sync build/ s3://YOUR_FRONTEND_BUCKET/ --delete
   
   # Optional: Create CloudFront invalidation
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DIST_ID \
     --paths "/*"

2) If CORS blocks requests, ensure your API CORS allows:
   - CloudFront origin: ${FRONTEND_URL:-https://[cloudfront-domain]}
   - Local dev origins: http://localhost:5173, http://localhost:3000

NOTE
fi

# ========= SUMMARY =========
echo ""
echo "=========================================="
echo "DEPLOYMENT SUMMARY"
echo "=========================================="
if [ -n "${BACKEND_URL:-}" ]; then
    echo "Backend (Swagger):    ${BACKEND_URL}/swagger"
    echo "Backend (Root):       ${BACKEND_URL}"
else
    echo "Backend:              Not deployed yet"
fi

if [ -n "${FRONTEND_URL:-}" ]; then
    echo "Frontend (CloudFront): ${FRONTEND_URL}"
else
    echo "Frontend:              Not deployed yet"
fi
echo "=========================================="
echo ""

