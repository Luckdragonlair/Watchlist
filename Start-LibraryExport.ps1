param([switch]$Once,[switch]$Stop)
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$script=Join-Path $root 'scripts\export-current-library.cjs'
$tools=Join-Path $root '.tools'
New-Item -ItemType Directory -Force -Path $tools | Out-Null
$pidFile=Join-Path $tools 'library-export.pid'
if($Stop){
  if(Test-Path -LiteralPath $pidFile){
    $watcherId=[int](Get-Content -LiteralPath $pidFile -Raw)
    $process=Get-CimInstance Win32_Process -Filter "ProcessId=$watcherId"
    if($process -and $process.CommandLine -and $process.CommandLine.Contains($script)){Stop-Process -Id $watcherId;Write-Output 'Library export watcher stopped.'}
    elseif($process){throw 'Saved process ID does not belong to the export helper; nothing stopped.'}
  }
  return
}
$node=(Get-Command node -ErrorAction SilentlyContinue).Source
if(-not $node){$node=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'}
if(-not (Test-Path -LiteralPath $node)){throw 'Node.js is required. See RUN.md.'}
if($Once){& $node $script;exit $LASTEXITCODE}
if(Test-Path -LiteralPath $pidFile){$watcherId=[int](Get-Content -LiteralPath $pidFile -Raw);$process=Get-CimInstance Win32_Process -Filter "ProcessId=$watcherId";if($process -and $process.CommandLine -and $process.CommandLine.Contains($script)){Write-Output 'Library export watcher is already running.';return}}
$process=Start-Process -FilePath $node -ArgumentList @(('"'+$script+'"'),'--watch') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $tools 'library-export.log') -RedirectStandardError (Join-Path $tools 'library-export-error.log') -PassThru
Write-Output ('Started read-only library export watcher (process '+$process.Id+'). Refreshes the folder after cloud changes; stops at sign-out or reboot.')
