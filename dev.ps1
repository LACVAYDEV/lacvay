# Start LACVAY dev servers using portable Node (no admin).
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ProjectRoot "node-local.ps1") dev
