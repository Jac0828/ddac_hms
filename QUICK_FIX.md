# Quick Fix: Add Security Group Rule

## Current Issue
Connection timeout because security group doesn't allow your IP.

## Your IP Address
**149.102.244.103/32**

## Quick Fix (2 minutes)

1. Open AWS Console: https://console.aws.amazon.com/ec2/
2. Go to: Security Groups
3. Search for: `sg-00c99757cb867e4b0` or `rds-hms-dev-sg`
4. Click on it → Inbound rules → Edit inbound rules
5. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: `149.102.244.103/32`
   - Description: `HMS Dev`
6. Save rules

## Then Run Migration

```bash
cd /Users/jac/ddac_hms
dotnet ef database update --project ./HMS.Infrastructure --startup-project ./HMS.Api
```

## Expected Result
✅ Migration completes successfully
✅ Tables created in RDS
✅ API ready to connect to RDS

