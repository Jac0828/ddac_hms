# Hotel Management System - Setup Guide

## ✅ Solution Structure Verified

The solution has the correct structure:
- ✅ **HMS.Domain** - Contains entity classes (AppUser, Booking, Room, Payment, etc.)
- ✅ **HMS.Infrastructure** - Contains ApplicationDbContext.cs (NO appsettings.json)
- ✅ **HMS.Api** - Web API project with Program.cs, Controllers, and appsettings.json
- ✅ **HMS.Web** - Optional MVC project (React runs separately in hms-client)

## 📦 Project References

✅ **Correct reference chain:**
- HMS.Api → HMS.Infrastructure + HMS.Domain
- HMS.Infrastructure → HMS.Domain
- HMS.Domain → (no dependencies)

## 🔧 Configuration

### Connection String (Local PostgreSQL)

**HMS.Api/appsettings.json:**
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=hms;Username=postgres;Password=postgres;Include Error Detail=true"
  }
}
```

### Connection String (AWS RDS - when ready)

```json
{
  "ConnectionStrings": {
    "Default": "Host=<rds-endpoint>;Port=5432;Database=hms;Username=<db_user>;Password=<db_pw>;SSL Mode=Require;Trust Server Certificate=true"
  }
}
```

## 🚀 Setup Steps

### Step 1: Install PostgreSQL (Local)

**Option A: Docker**
```bash
docker run --name pg-hms -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

**Option B: Local Installation**
- Install PostgreSQL 16
- Create database: `createdb -U postgres hms`
- Update password in appsettings.json if needed

### Step 2: Install NuGet Packages

**Current Status:**
- ✅ HMS.Infrastructure has Npgsql.EntityFrameworkCore.PostgreSQL (7.0.0)
- ✅ HMS.Infrastructure has Microsoft.AspNetCore.Identity.EntityFrameworkCore (7.0.0)
- ✅ HMS.Api has Microsoft.EntityFrameworkCore.Design (7.0.0)
- ✅ HMS.Api has Swashbuckle.AspNetCore (6.5.0)

**Note:** Currently using .NET 7 packages. To upgrade to .NET 8:
1. Install .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0
2. Update all TargetFramework to `net8.0`
3. Update all package versions to 8.x

### Step 3: Create Database Migration

**Using Package Manager Console (Visual Studio):**
```
Startup Project: HMS.Api
Default Project: HMS.Infrastructure

Add-Migration InitialCreate -Project HMS.Infrastructure -StartupProject HMS.Api
Update-Database -Project HMS.Infrastructure -StartupProject HMS.Api
```

**Using Command Line:**
```bash
cd HMS.Api
export PATH="$PATH:/Users/jac/.dotnet/tools"
dotnet ef migrations add InitialCreate --project ../HMS.Infrastructure/HMS.Infrastructure.csproj --startup-project .
dotnet ef database update --project ../HMS.Infrastructure/HMS.Infrastructure.csproj --startup-project .
```

### Step 4: Run Backend API

```bash
cd HMS.Api
dotnet run
```

**Access:**
- Swagger UI: http://localhost:5272/swagger
- API: http://localhost:5272

### Step 5: Configure React Frontend

**Update hms-client/.env:**
```
REACT_APP_API_URL=http://localhost:5272
```

**Run React App:**
```bash
cd hms-client
npm start
```

**Access:** http://localhost:3000

## ✅ Validation Checklist

- [x] HMS.Api/appsettings.json configured with PostgreSQL connection string
- [x] Program.cs configured with DbContext, CORS, and Swagger
- [x] No appsettings.json in HMS.Infrastructure
- [x] Project references are correct
- [x] CORS configured for React (ports 5173 and 3000)
- [ ] PostgreSQL database created
- [ ] EF Core migrations applied
- [ ] API runs successfully with Swagger
- [ ] React frontend connects to API

## 🔄 Next Steps

1. **Create PostgreSQL database:**
   ```bash
   createdb -U postgres hms
   ```

2. **Run migrations:**
   ```bash
   cd HMS.Api
   dotnet ef database update --project ../HMS.Infrastructure/HMS.Infrastructure.csproj --startup-project .
   ```

3. **Test API:**
   - Start HMS.Api
   - Visit http://localhost:5272/swagger
   - Test login endpoint with seeded users

4. **Test React Frontend:**
   - Start HMS.Api
   - Start hms-client (npm start)
   - Test login and room browsing

## 🌐 AWS Deployment Preparation

When ready for AWS:

1. **RDS Setup:**
   - Create PostgreSQL RDS instance
   - Update connection string in appsettings.json
   - Run migrations against RDS

2. **Elastic Beanstalk:**
   - Package HMS.Api
   - Deploy to EB (.NET 8 runtime)
   - Configure environment variables

3. **React Build:**
   - Build: `npm run build`
   - Deploy to S3 + CloudFront

## 📝 Notes

- Currently using **.NET 7** due to SDK availability
- To use **.NET 8**, install .NET 8 SDK and update all TargetFramework values
- All packages are compatible and working with current setup
- CORS is configured for React development (ports 5173 and 3000)

