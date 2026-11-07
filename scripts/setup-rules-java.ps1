$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$javaRoot = Join-Path $projectRoot '.tools\java21'
$archivePath = Join-Path $projectRoot '.tools\java21.zip'
$javaPath = Join-Path $javaRoot 'jdk-21.0.13+9-jre\bin\java.exe'
if (Test-Path -LiteralPath $javaPath) { & $javaPath -version; exit $LASTEXITCODE }
New-Item -ItemType Directory -Path $javaRoot -Force | Out-Null
Invoke-WebRequest -Uri 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_x64_windows_hotspot_21.0.13_9.zip' -OutFile $archivePath
if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ne '2332c0b4cff6bed722da3567c91d5e47568bcba863fa4945d0a8d6fc76158628') { throw 'Java checksum mismatch. Archive was not extracted.' }
Expand-Archive -LiteralPath $archivePath -DestinationPath $javaRoot -Force
& $javaPath -version
exit $LASTEXITCODE
