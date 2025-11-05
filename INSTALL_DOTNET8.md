# Install .NET 8 SDK

## Current Status
- ✅ All projects updated to `net8.0`
- ✅ All NuGet packages updated to version 8.0.0
- ❌ .NET 8 SDK not installed (currently only .NET 7.0.317)

## Installation Instructions

### macOS (using Homebrew)
```bash
brew install --cask dotnet-sdk
# Or for specific version:
brew install --cask dotnet@8
```

### macOS (Manual Download)
1. Visit: https://dotnet.microsoft.com/download/dotnet/8.0
2. Download the .NET 8 SDK for macOS
3. Install the .pkg file
4. Verify: `dotnet --version` (should show 8.x.x)

### Linux
```bash
# Ubuntu/Debian
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --version 8.0.0

# Add to PATH in ~/.bashrc or ~/.zshrc:
export PATH="$PATH:$HOME/.dotnet"
```

### Windows
1. Visit: https://dotnet.microsoft.com/download/dotnet/8.0
2. Download the .NET 8 SDK installer
3. Run the installer
4. Verify: `dotnet --version` (should show 8.x.x)

## Verify Installation
After installation, run:
```bash
dotnet --version
# Should output: 8.0.x or higher
```

## After Installing .NET 8 SDK

Once .NET 8 SDK is installed, the projects will build successfully:

```bash
cd /Users/jac/ddac_hms
dotnet build
```

All projects are already configured for .NET 8 - just need the SDK installed!

