param([ValidateSet('dev','install','test','test:e2e','build','preview')][string]$Task = 'dev')
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  $taskNodeCommand = Get-Command node -ErrorAction SilentlyContinue
  $taskRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node'
  $taskNode = if ($taskNodeCommand) { $taskNodeCommand.Source } else { Join-Path $taskRuntime 'bin\node.exe' }
  if (!(Test-Path -LiteralPath $taskNode)) { throw 'Install Node.js 22.12+ or Node.js 24, then retry.' }
  $env:Path = (Split-Path -Parent $taskNode) + ';' + $env:Path
  $taskPnpm = Get-Command pnpm -ErrorAction SilentlyContinue
  $taskBundledPnpm = Join-Path $taskRuntime 'node_modules\pnpm\bin\pnpm.cjs'
  function Invoke-WatchlistPackage([string[]]$PackageArgs) {
    if ($taskPnpm) { & $taskPnpm.Source @PackageArgs }
    elseif (Test-Path -LiteralPath $taskBundledPnpm) { & $taskNode $taskBundledPnpm @PackageArgs }
    else { throw 'Install pnpm, or use npm install followed by npm run dev.' }
    if ($LASTEXITCODE -ne 0) { throw "Watchlist command failed (exit $LASTEXITCODE)." }
  }
  if ($Task -eq 'install') { Invoke-WatchlistPackage @('install','--frozen-lockfile') }
  else {
    if (!(Test-Path -LiteralPath 'node_modules')) { Invoke-WatchlistPackage @('install','--frozen-lockfile') }
    Invoke-WatchlistPackage @('run',$Task)
  }
} finally { Pop-Location }
