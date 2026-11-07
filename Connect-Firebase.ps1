$ErrorActionPreference = 'Stop'
$nodePath = 'C:\Users\carpa\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$firebasePath = Join-Path $PSScriptRoot 'node_modules\firebase-tools\lib\bin\firebase.js'
Write-Host 'Connect Firebase for Watchlist. Keep this window open.'
Write-Host 'Open the sign-in link below, choose your Google account, and allow Firebase access.'
& $nodePath $firebasePath login
if ($LASTEXITCODE -ne 0) { Read-Host 'Login could not start. Press Enter to close'; exit 1 }
$accounts = & $nodePath $firebasePath login:list --non-interactive 2>&1
if (($accounts | Out-String) -match 'Logged in as') { Write-Host 'Firebase is connected.'; Read-Host 'Press Enter to close'; exit 0 }
$loginCode = Read-Host 'If Google gave you an authorization code, paste it HERE (not in chat), then press Enter. Otherwise leave blank'
if ($loginCode) { & $nodePath $firebasePath login $loginCode; $loginCode = $null }
Read-Host 'When finished, press Enter to close'
