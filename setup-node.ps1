# Portable Node.js for LACVAY — no admin password required.
# Downloads Node into .tools/node inside this project folder only.

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ToolsDir = Join-Path $ProjectRoot ".tools"
$NodeDir = Join-Path $ToolsDir "node"
$NodeExe = Join-Path $NodeDir "node.exe"
$NodeVersion = "22.14.0"
$ZipUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
$ZipPath = Join-Path $ToolsDir "node.zip"

if (Test-Path $NodeExe) {
    Write-Host "Portable Node.js already installed:" -ForegroundColor Green
    & $NodeExe --version
    & (Join-Path $NodeDir "npm.cmd") --version
    exit 0
}

Write-Host "Setting up portable Node.js (no admin needed)..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null

Write-Host "Downloading Node.js v$NodeVersion..."
try {
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
} catch {
    Write-Host "Download failed. Check your internet connection or firewall." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host "Extracting..."
Expand-Archive -Path $ZipPath -DestinationPath $ToolsDir -Force
Rename-Item (Join-Path $ToolsDir "node-v$NodeVersion-win-x64") "node" -Force
Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done! Portable Node.js is ready at:" -ForegroundColor Green
Write-Host "  $NodeDir"
& $NodeExe --version
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Double-click lacvay-dev.bat   (easiest)"
Write-Host "  2. Or run:  .\install.ps1  then  .\dev.ps1"
