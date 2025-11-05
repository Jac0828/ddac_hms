# AWS RDS Setup Status

## ✅ Completed Steps

### Step 1: Configuration Files Updated ✅
- ✅ **appsettings.json** - Updated with RDS connection string
- ✅ **appsettings.Development.json** - Updated with RDS connection string
- ✅ Connection string format correct for AWS RDS with SSL

### Step 2: .NET 8 SDK ✅
- ✅ .NET 8 SDK installed: **8.0.415**
- ✅ dotnet-ef tool updated to version 9.0.10

### Step 3: Project Configuration ✅
- ✅ All projects configured for .NET 8
- ✅ All packages updated to 8.0.0

## ⚠️ Required Action: Security Group Configuration

### Your Current IP Address
**IP:** `149.102.244.103`  
**CIDR:** `149.102.244.103/32`

### Manual Steps Required

Since AWS CLI is not configured, you need to manually add the security group rule:

1. **Go to AWS Console:**
   - Navigate to: EC2 > Security Groups
   - Find security group: `rds-hms-dev-sg` (ID: `sg-00c99757cb867e4b0`)

2. **Add Inbound Rule:**
   - Click on the security group
   - Go to "Inbound rules" tab
   - Click "Edit inbound rules"
   - Click "Add rule"
   - Configure:
     - **Type:** PostgreSQL
     - **Protocol:** TCP
     - **Port:** 5432
     - **Source:** `149.102.244.103/32`
     - **Description:** `HMS Dev - Current Machine`
   - Click "Save rules"

3. **Verify:**
   - The rule should appear in the inbound rules list
   - Status should be "Active"

## 🔄 After Security Group is Configured

Once you've added the security group rule, run the migration again:

```bash
cd /Users/jac/ddac_hms
./setup-aws-rds.sh
```

Or manually:

```bash
cd /Users/jac/ddac_hms
dotnet ef database update \
  --project ./HMS.Infrastructure \
  --startup-project ./HMS.Api
```

## 📋 Connection Details

**RDS Endpoint:** `hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com`  
**Port:** `5432`  
**Database:** `postgres`  
**Username:** `postgres`  
**Password:** `admin1234`  
**SSL Mode:** `Require`

## ✅ Next Steps After Migration Succeeds

1. **Run the API:**
   ```bash
   cd HMS.Api
   dotnet run
   ```

2. **Open Swagger:**
   - Visit: http://localhost:5272/swagger

3. **Verify Tables in RDS:**
   - Go to AWS RDS Query Editor v2
   - Run:
     ```sql
     SELECT table_name FROM information_schema.tables 
     WHERE table_schema='public' ORDER BY table_name;
     ```
   - Should see tables: AspNetRoles, AspNetUsers, Bookings, Rooms, Payments, etc.

## 🔍 Troubleshooting

If migration still fails after adding security group:

1. **Check Security Group:**
   - Verify your current IP matches: `149.102.244.103`
   - Get current IP: `curl https://checkip.amazonaws.com`
   - Update rule if IP changed

2. **Test Connection:**
   ```bash
   # If psql is installed
   PGPASSWORD=admin1234 psql -h hotelmanagementsystem.cfvcmi6jlpxm.us-east-1.rds.amazonaws.com \
     -p 5432 -U postgres -d postgres -c "SELECT NOW();"
   ```

3. **Check RDS Status:**
   - Verify RDS instance is "Available" in AWS Console
   - Check endpoint is correct

## 📝 Summary

- ✅ Configuration files updated
- ✅ .NET 8 SDK installed
- ✅ Ready to migrate
- ⚠️ **Action Required:** Add security group rule for IP `149.102.244.103/32`

Once the security group is configured, the migration should succeed!

