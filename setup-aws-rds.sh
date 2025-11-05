#!/bin/bash

# ======================
# FIXED VARIABLES
# ======================
AWS_REGION="us-east-1"
RDS_ENDPOINT="hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB_NAME="postgres"
RDS_DB_USER="postgres"
RDS_DB_PASS="admin1234"
RDS_SG_ID="sg-00c99757cb867e4b0"
RDS_SG_NAME="rds-hms-dev-sg"

# Local project paths
API_DIR="./HMS.Api"
INFRA_DIR="./HMS.Infrastructure"

echo "=========================================="
echo "HMS AWS RDS Setup Automation"
echo "=========================================="
echo ""

# ======================
# PRECHECKS
# ======================
echo "Step 0: Prechecks..."
echo ""

# Check AWS CLI
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI found"
    AWS_CLI_AVAILABLE=true
else
    echo "⚠️  AWS CLI not found."
    AWS_CLI_AVAILABLE=false
fi

# Check AWS CLI configuration
if [ "$AWS_CLI_AVAILABLE" = true ]; then
    if aws sts get-caller-identity --region "$AWS_REGION" >/dev/null 2>&1; then
        echo "✅ AWS CLI configured and authenticated"
        AWS_CLI_CONFIGURED=true
    else
        echo "⚠️  AWS CLI not configured; will print manual instructions for SG step."
        AWS_CLI_CONFIGURED=false
    fi
else
    AWS_CLI_CONFIGURED=false
fi

echo ""

# ============================================
# STEP 1 — Allow THIS machine IP on RDS (5432)
# ============================================
echo "Step 1: Configuring Security Group for RDS access..."
echo ""

MYIP=$(curl -s https://checkip.amazonaws.com | tr -d '\n')
CIDR="${MYIP}/32"

echo "Current machine IP: $MYIP"
echo "CIDR: $CIDR"
echo ""

if [ "$AWS_CLI_CONFIGURED" = true ]; then
    echo "Adding security group ingress rule..."
    aws ec2 authorize-security-group-ingress \
      --region "$AWS_REGION" \
      --group-id "$RDS_SG_ID" \
      --ip-permissions IpProtocol=tcp,FromPort=5432,ToPort=5432,IpRanges="[{CidrIp=$CIDR,Description='HMS Dev - Current Machine'}]" \
      2>&1 || echo "⚠️  Ingress may already exist for $CIDR"
    
    echo ""
    echo "Current security group rules for port 5432:"
    aws ec2 describe-security-groups --region "$AWS_REGION" --group-ids "$RDS_SG_ID" \
      --query "SecurityGroups[].IpPermissions[?FromPort==\`5432\`].IpRanges[].CidrIp" --output table || true
else
    echo "---"
    echo "AWS CLI not configured. Add this inbound rule manually:"
    echo ""
    echo "  Console path: EC2 > Security Groups > $RDS_SG_NAME ($RDS_SG_ID) > Inbound rules > Edit"
    echo "  Rule: Type=PostgreSQL, Port=5432, Source=$CIDR, Desc='HMS Dev - Current Machine'"
    echo "---"
fi

echo ""
echo ""

# ============================================
# STEP 2 — Update HMS.Api/appsettings.json
# ============================================
echo "Step 2: Updating appsettings.json with RDS connection string..."
echo ""

APP_SETTINGS_FILE="$API_DIR/appsettings.json"

if [ ! -f "$APP_SETTINGS_FILE" ]; then
    echo "⚠️  appsettings.json not found, creating it..."
    mkdir -p "$API_DIR"
    echo '{}' > "$APP_SETTINGS_FILE"
fi

# Backup original
cp "$APP_SETTINGS_FILE" "${APP_SETTINGS_FILE}.backup"

# Create new connection string
NEW_CONNECTION_STRING="Host=$RDS_ENDPOINT;Port=$RDS_PORT;Database=$RDS_DB_NAME;Username=$RDS_DB_USER;Password=$RDS_DB_PASS;SSL Mode=Require;Trust Server Certificate=true;Include Error Detail=true"

# Use Python to update JSON (more reliable than jq which might not be installed)
python3 << EOF
import json
import sys

file_path = "$APP_SETTINGS_FILE"

try:
    with open(file_path, 'r') as f:
        data = json.load(f)
except:
    data = {}

# Update connection strings
if "ConnectionStrings" not in data:
    data["ConnectionStrings"] = {}

data["ConnectionStrings"]["Default"] = "$NEW_CONNECTION_STRING"

# Write back
with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print("✅ appsettings.json updated successfully")
EOF

echo ""
echo "Connection string updated:"
echo "  Default: Host=$RDS_ENDPOINT;Port=$RDS_PORT;Database=$RDS_DB_NAME;Username=$RDS_DB_USER;Password=***;SSL Mode=Require;Trust Server Certificate=true"
echo ""
echo ""

# =======================================================
# STEP 3 — Run EF Core migration against AWS RDS
# =======================================================
echo "Step 3: Running EF Core migrations against AWS RDS..."
echo ""

# Ensure dotnet-ef is installed
echo "Checking/installing dotnet-ef tool..."
export PATH="$PATH:/Users/jac/.dotnet/tools"
dotnet tool update --global dotnet-ef 2>/dev/null || dotnet tool install --global dotnet-ef 2>&1 | grep -v "already installed" || true

echo ""
echo "Running database update..."
echo "  Project: $INFRA_DIR"
echo "  Startup: $API_DIR"
echo ""

if dotnet ef database update \
    --project "$INFRA_DIR" \
    --startup-project "$API_DIR" 2>&1; then
    echo ""
    echo "✅ Database migration completed successfully!"
else
    MIGRATION_EXIT_CODE=$?
    echo ""
    echo "❌ Migration failed with exit code: $MIGRATION_EXIT_CODE"
    echo ""
    echo "Likely fixes:"
    echo "  * Security Group not open for your IP (5432) - Check Step 1"
    echo "  * Wrong endpoint/DB/user/pass - Verify RDS credentials"
    echo "  * EFCore/Npgsql version mismatch - Ensure all packages are 8.x for .NET 8"
    echo "  * Startup project not set to HMS.Api - Verify project structure"
    echo "  * .NET 8 SDK not installed - Run: brew install --cask dotnet-sdk@8"
    echo ""
    exit $MIGRATION_EXIT_CODE
fi

echo ""
echo ""

# ========================================
# STEP 4 — Optional connectivity smoke test
# ========================================
echo "Step 4: Testing connectivity (optional)..."
echo ""

if command -v psql &> /dev/null; then
    echo "Testing PostgreSQL connection..."
    if PGPASSWORD="$RDS_DB_PASS" psql -h "$RDS_ENDPOINT" -p "$RDS_PORT" -U "$RDS_DB_USER" -d "$RDS_DB_NAME" -c "SELECT NOW();" 2>&1; then
        echo "✅ PostgreSQL connection test successful"
    else
        echo "⚠️  PostgreSQL connection test failed (non-critical)"
    fi
else
    echo "⚠️  psql not found, skipping connectivity test"
fi

echo ""
echo ""

# ======================
# STEP 5 — Final output
# ======================
echo "=========================================="
echo "Final Checklist"
echo "=========================================="
echo ""
echo "[ ] SG shows this machine's IP on 5432"
echo "    - Check via AWS Console: EC2 > Security Groups > $RDS_SG_NAME ($RDS_SG_ID)"
echo "    - Or verify the output above shows: $CIDR"
echo ""
echo "[ ] EF 'database update' succeeded without errors"
echo "    - Check output above for '✅ Database migration completed successfully!'"
echo ""
echo "[ ] API ready to run with RDS"
echo "    - Next step: cd $API_DIR && dotnet run"
echo "    - Then open Swagger: http://localhost:5272/swagger"
echo ""
echo "=========================================="
echo "Verification in AWS RDS Query Editor"
echo "=========================================="
echo ""
echo "In AWS RDS Query editor v2, run:"
echo ""
echo "  SELECT table_name FROM information_schema.tables"
echo "  WHERE table_schema='public' ORDER BY table_name;"
echo ""
echo "You should see tables created by EF:"
echo "  - AspNetRoles"
echo "  - AspNetUsers"
echo "  - Bookings"
echo "  - Rooms"
echo "  - Payments"
echo "  - ServiceRequests"
echo "  - Newsletters"
echo "  - NewsComments"
echo "  - ActivityLogs"
echo "  - QueryTickets"
echo "  - __EFMigrationsHistory"
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="

