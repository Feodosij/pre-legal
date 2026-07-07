$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

docker build -t prelegal .
if ($LASTEXITCODE -ne 0) { throw "docker build failed (exit $LASTEXITCODE)" }

docker rm -f prelegal 2>$null | Out-Null

docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
if ($LASTEXITCODE -ne 0) { throw "docker run failed (exit $LASTEXITCODE)" }

Write-Host "Prelegal is running at http://localhost:8000"
