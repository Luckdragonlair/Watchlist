param([switch]$Stop)
$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot 'scripts\genre-review\server.cjs'
$tools=Join-Path $PSScriptRoot '.tools'
New-Item -ItemType Directory -Force -Path $tools | Out-Null
$pidFile=Join-Path $tools 'genre-review.pid'
if(Test-Path -LiteralPath $pidFile){
 $reviewId=[int](Get-Content -LiteralPath $pidFile -Raw)
 $process=Get-CimInstance Win32_Process -Filter "ProcessId=$reviewId"
 if($process -and $process.CommandLine -and $process.CommandLine.Contains($script)){
  if($Stop){Stop-Process -Id $reviewId;Write-Output 'Genre review stopped. Saved choices are retained.'}else{Write-Output 'Genre review is running: http://127.0.0.1:5188'}
  return
 }
}
if($Stop){Write-Output 'No verified genre review process is running.';return}
$node=(Get-Command node -ErrorAction SilentlyContinue).Source
if(-not $node){$node=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'}
if(-not (Test-Path -LiteralPath $node)){throw 'Node.js was not found. See RUN.md.'}
$process=Start-Process -FilePath $node -ArgumentList @(('"'+$script+'"')) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $tools 'genre-review.log') -RedirectStandardError (Join-Path $tools 'genre-review-error.log') -PassThru
Set-Content -LiteralPath $pidFile -Value $process.Id
for($attempt=0;$attempt -lt 20;$attempt++){
 Start-Sleep -Milliseconds 150
 if($process.HasExited){throw 'Review could not start. Check .tools\genre-review-error.log.'}
 try{$health=Invoke-RestMethod 'http://127.0.0.1:5188/api/health';if($health.service -eq 'watchlist-genre-review'){Write-Output ("Genre review: http://127.0.0.1:5188 — "+$health.count+' multi-genre shows. Choices save to Library\Primary Genre Choices.json.');return}}catch{}
}
throw 'Genre review did not become ready. Check .tools\genre-review-error.log.'
