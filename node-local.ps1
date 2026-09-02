# Add portable Node to PATH for this session and run npm commands.
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeDir = Join-Path $ProjectRoot ".tools\node"
$NodeExe = Join-Path $NodeDir "node.exe"

if (-not (Test-Path $NodeExe)) {
    Write-Host "Portable Node not found. Running setup first..." -ForegroundColor Yellow
    & (Join-Path $ProjectRoot "setup-node.ps1")
    if (-not (Test-Path $NodeExe)) { exit 1 }
}

$env:Path = "$NodeDir;$env:Path"
Set-Location $ProjectRoot

if ($Args.Count -eq 0) {
    Write-Host "Usage: .\node-local.ps1 install | dev | build | ..."
    exit 1
}

$cmd = $Args[0]
$rest = @()
if ($Args.Count -gt 1) { $rest = $Args[1..($Args.Count - 1)] }

switch ($cmd) {
    "install" { npm install @rest }
    "dev"     { npm run dev @rest }
    "build"   { npm run build @rest }
    "start"   { npm run start @rest }
    default   { npm @Args }
}
