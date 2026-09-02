# Install LACVAY dependencies using portable Node (no admin).
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ProjectRoot "node-local.ps1") install
