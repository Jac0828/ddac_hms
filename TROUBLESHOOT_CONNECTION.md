# Troubleshooting RDS Connection Timeout

## Current Error
```
Timeout during reading attempt
Exception while reading from stream
```

## Root Cause
The connection is timing out, which means:
1. **Security Group** - Port 5432 is not open for your IP address
2. **Network** - Firewall or network blocking the connection
3. **RDS Status** - RDS instance might not be accessible

## Your Current IP
Check your current IP:
```bash
curl https://checkip.amazonaws.com
```

**Current IP:** `149.102.244.103`

## Fix Steps

### Step 1: Verify Security Group Rule

1. Go to AWS Console: https://console.aws.amazon.com/ec2/
2. Navigate to: **EC2** → **Security Groups**
3. Search for: `sg-00c99757cb867e4b0`
4. Click on the security group
5. Go to **Inbound rules** tab
6. Check if there's a rule for:
   - **Type:** PostgreSQL (or Custom TCP)
   - **Port:** 5432
   - **Source:** Your current IP (`149.102.244.103/32`)

### Step 2: Add Security Group Rule (if missing)

If the rule doesn't exist:

1. Click **Edit inbound rules**
2. Click **Add rule**
3. Configure:
   - **Type:** PostgreSQL
   - **Protocol:** TCP
   - **Port range:** 5432
   - **Source:** `149.102.244.103/32`
   - **Description:** `HMS Dev - Current Machine`
4. Click **Save rules**

**Important:** Wait 10-30 seconds after saving for the rule to propagate.

### Step 3: Test Connection

After adding the rule, test with psql (if installed):
```bash
PGPASSWORD=admin1234 psql -h hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com \
  -p 5432 -U postgres -d postgres -c "SELECT NOW();"
```

Or test with telnet/nc:
```bash
nc -zv hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com 5432
```

Expected output if working:
```
Connection to hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com port 5432 [tcp/postgresql] succeeded!
```

### Step 4: Re-run Migration

Once connection works:
```bash
cd /Users/jac/ddac_hms
dotnet ef database update --project ./HMS.Infrastructure --startup-project ./HMS.Api
```

## Alternative: Check RDS Status

1. Go to AWS Console: https://console.aws.amazon.com/rds/
2. Check RDS instance status
3. Verify:
   - Status is **Available**
   - Endpoint matches: `hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com`
   - Public accessibility is enabled (if needed)

## If IP Changed

If your IP address changed, update the security group rule:

1. Get new IP:
   ```bash
   curl https://checkip.amazonaws.com
   ```

2. Update the security group rule with the new IP/32

## Connection String Verification

Current connection string in `appsettings.json`:
```
Host=hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com
Port=5432
Database=postgres
Username=postgres
Password=admin1234
SSL Mode=Require
Trust Server Certificate=true
```

✅ Connection string is correct.

## Summary

**The issue is 99% likely the security group.** Add the inbound rule for your IP (`149.102.244.103/32`) on port 5432, wait 30 seconds, then retry the migration.

