# Quick Start Guide - HMS

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- PostgreSQL running (local or Docker)
- .NET 7 SDK (or .NET 8 for production)
- Node.js 16+ for React

### Step 1: Start PostgreSQL

**Docker:**
```bash
docker run --name pg-hms -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

**Local:**
```bash
# Create database
createdb -U postgres hms
```

### Step 2: Run Database Migrations

```bash
cd HMS.Api
export PATH="$PATH:/Users/jac/.dotnet/tools"
dotnet ef database update --project ../HMS.Infrastructure/HMS.Infrastructure.csproj --startup-project .
```

### Step 3: Start Backend API

```bash
cd HMS.Api
dotnet run
```

**Verify:** Open http://localhost:5272/swagger

### Step 4: Start React Frontend

```bash
cd hms-client
npm start
```

**Verify:** Open http://localhost:3000

## ✅ Test Accounts

- **Manager:** manager@hms.com / Manager@123
- **Customer:** customer@hms.com / Customer@123
- **Receptionist:** receptionist@hms.com / Receptionist@123
- **Room Attendant:** roomattendant@hms.com / Attendant@123

## 📝 Configuration Files

- **Backend Connection:** `HMS.Api/appsettings.json`
- **Frontend API URL:** `hms-client/.env` (set `REACT_APP_API_URL=http://localhost:5272`)

## 🔧 Troubleshooting

**Migration fails?**
- Ensure PostgreSQL is running
- Check connection string in appsettings.json
- Verify database "hms" exists

**CORS errors?**
- Check CORS configuration in Program.cs
- Verify React app is on port 3000 or 5173

**API not starting?**
- Check PostgreSQL connection
- Verify all NuGet packages installed
- Check port 5272 is available

